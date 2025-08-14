const jwt = require('jsonwebtoken');
const pool = require('./database');

const connectedUsers = new Map();

const getConnectedUserIds = () => Array.from(connectedUsers.keys());

async function emitOnlineUsers(io) {
  // Only emit users who are truly connected (in connectedUsers)
  const userIds = Array.from(connectedUsers.keys());
  if (userIds.length === 0) {
    io.emit('online_users_updated', []);
    return;
  }
  // Fetch user info from DB for connected users
  const result = await pool.query(
    'SELECT id, nickname, gender, last_active FROM users WHERE id = ANY($1) ORDER BY nickname',
    [userIds]
  );
  const users = result.rows.map(user => ({
    id: user.id,
    nickname: user.nickname,
    gender: user.gender,
    lastActive: user.last_active
  }));
  io.emit('online_users_updated', users);
}

const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
        if (result.rows.length > 0) {
          socket.userId = decoded.userId;
          socket.user = result.rows[0];
        }
      }
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user?.nickname || 'Anonymous'}`);
    
    if (socket.userId) {
       connectedUsers.set(socket.userId, socket.id);
      // Only set online status if not already online
      await pool.query(
        'UPDATE users SET is_online = true, last_active = CURRENT_TIMESTAMP WHERE id = $1',
        [socket.userId]
      );
      // Join user to their private room for private messages
      socket.join(`user_${socket.userId}`);
      // Emit updated online users list
      await emitOnlineUsers(io);
    }

    // Utils for private chat session tracking
    const privateSession = require('../utils/private_chat_session');
    const chatCleanup = require('../utils/chat_cleanup');

    // Handle joining rooms
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.user?.nickname} joined room: ${roomId}`);
    });

    // Handle joining/leaving private chat sessions
    socket.on('join_private_chat', (otherUserId) => {
      privateSession.userJoinedPrivateSession(socket.userId, otherUserId, socket.userId);
    });
    socket.on('leave_private_chat', async (otherUserId) => {
      // Mark this user as having left the session
      const sessionEnded = privateSession.userLeftPrivateSession(socket.userId, otherUserId, socket.userId);
      const leaverNickname = socket.user?.nickname || 'Unknown';
      // Notify the other user in the private chat ONLY if they are still in the session
      if (!sessionEnded) {
        io.to(`user_${otherUserId}`).emit('private_chat_left', {
          userId: socket.userId,
          nickname: leaverNickname
        });
      }
      // If both users have left, delete the session and all messages
      if (sessionEnded) {
        privateSession.removePrivateSession(socket.userId, otherUserId);
        await pool.query(
          `DELETE FROM messages WHERE ((user_id = $1 AND recipient_id = $2) OR (user_id = $2 AND recipient_id = $1)) AND is_private = true`,
          [socket.userId, otherUserId]
        );
        // Notify both users to remove the chat from their UI
        io.to(`user_${otherUserId}`).emit('private_chat_removed', { userId: socket.userId, otherUserId });
        io.to(`user_${socket.userId}`).emit('private_chat_removed', { userId: socket.userId, otherUserId });
      }
    });

    // Periodic cleanup for inactive private chat sessions (no messages for 4 hours)
    if (io._privateCleanupInterval == null) {
      io._privateCleanupInterval = setInterval(async () => {
        const sessions = privateSession.getAllSessions && privateSession.getAllSessions();
        if (sessions) {
          for (const key in sessions) {
            const session = sessions[key];
            // Check lastActive (should be tracked in session)
            if (session.lastActive && Date.now() - new Date(session.lastActive).getTime() > 4 * 60 * 60 * 1000) {
              // Delete all private messages between these two users
              const [userA, userB] = key.split('_');
              await pool.query(
                `DELETE FROM messages WHERE ((user_id = $1 AND recipient_id = $2) OR (user_id = $2 AND recipient_id = $1)) AND is_private = true`,
                [userA, userB]
              );
              privateSession.removePrivateSession(userA, userB);
              io.to(`user_${userA}`).emit('private_chat_removed', { userId: userA, otherUserId: userB });
              io.to(`user_${userB}`).emit('private_chat_removed', { userId: userB, otherUserId: userA });
            }
          }
        }
      }, 5 * 60 * 1000); // every 5 minutes
    }

    // Handle leaving rooms
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.user?.nickname} left room: ${roomId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { content, type = 'text', roomId, recipientId, isPrivate } = data;
        
        if (!socket.userId) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        // Insert message into database
        const messageResult = await pool.query(
          `INSERT INTO messages (user_id, room_id, recipient_id, content, message_type, is_private) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [socket.userId, isPrivate ? null : roomId, isPrivate ? recipientId : null, content, type, isPrivate]
        );

        // Enforce message limits
        const chatCleanup = require('../utils/chat_cleanup');
        if (isPrivate && recipientId) {
          await chatCleanup.enforcePrivateMessageLimit(socket.userId, recipientId, 100);
        } else if (!isPrivate && roomId) {
          await chatCleanup.enforceRoomMessageLimit(roomId, 500);
        }

        const message = messageResult.rows[0];
        
        // Get user info for the message
        const userResult = await pool.query('SELECT nickname, gender FROM users WHERE id = $1', [socket.userId]);
        const user = userResult.rows[0];

        const messageData = {
          id: message.id,
          userId: message.user_id,
          nickname: user.nickname,
          content: message.content,
          timestamp: message.created_at,
          type: message.message_type,
          room: message.room_id,
          isPrivate: message.is_private,
          recipientId: message.recipient_id
        };

        if (isPrivate) {
          // Send to both sender and recipient
          io.to(`user_${recipientId}`).emit('new_message', messageData);
          io.to(`user_${socket.userId}`).emit('new_message', messageData);
        } else {
          // Emit to all connected users (except sender) for global room notifications
          for (const userId of connectedUsers.keys()) {
            if (userId !== socket.userId) {
              io.to(`user_${userId}`).emit('new_message', messageData);
            }
          }
          // Also emit to the sender for immediate feedback
          io.to(`user_${socket.userId}`).emit('new_message', messageData);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      if (data.isPrivate) {
        socket.to(`user_${data.recipientId}`).emit('user_typing', {
          userId: socket.userId,
          nickname: socket.user.nickname
        });
      } else {
        socket.to(data.roomId).emit('user_typing', {
          userId: socket.userId,
          nickname: socket.user.nickname
        });
      }
    });

    socket.on('stop_typing', (data) => {
      if (data.isPrivate) {
        socket.to(`user_${data.recipientId}`).emit('user_stop_typing', {
          userId: socket.userId
        });
      } else {
        socket.to(data.roomId).emit('user_stop_typing', {
          userId: socket.userId
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user?.nickname || 'Anonymous'}`);
      
      if (socket.userId) {
        // Notify all private chat partners that this user left
        for (const [otherUserId, otherSocketId] of connectedUsers.entries()) {
          if (otherUserId !== socket.userId) {
            io.to(`user_${otherUserId}`).emit('private_chat_left', {
              userId: socket.userId,
              nickname: socket.user?.nickname || 'Unknown'
            });
          }
        }
        connectedUsers.delete(socket.userId);
        // Ghost user cleanup: delete user if never sent a message
        const msgRes = await pool.query('SELECT 1 FROM messages WHERE user_id = $1 LIMIT 1', [socket.userId]);
        if (msgRes.rows.length === 0) {
          await pool.query('DELETE FROM users WHERE id = $1', [socket.userId]);
        } else {
          await pool.query('UPDATE users SET is_online = false, last_active = CURRENT_TIMESTAMP WHERE id = $1', [socket.userId]);
        }
        await emitOnlineUsers(io);
      }
    });
  });
};

module.exports = { initializeSocket, getConnectedUserIds };

