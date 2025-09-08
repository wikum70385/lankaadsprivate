// Utility for chat cleanup: enforce message limits and auto-delete inactive private chats
const pool = require('../config/database');

// Delete oldest messages to keep only 'max' messages for a public room
async function enforceRoomMessageLimit(roomId, max = 500) {
  await pool.query(`
    DELETE FROM messages
    WHERE id IN (
      SELECT id FROM messages
      WHERE room_id = $1 AND is_private = false
      ORDER BY created_at ASC
      OFFSET $2
    )
  `, [roomId, max]);
}

// Delete oldest private messages to keep only 'max' messages between 2 users
async function enforcePrivateMessageLimit(userA, userB, max = 100) {
  await pool.query(`
    DELETE FROM messages
    WHERE id IN (
      SELECT id FROM messages
      WHERE is_private = true
        AND ((user_id = $1 AND recipient_id = $2) OR (user_id = $2 AND recipient_id = $1))
      ORDER BY created_at ASC
      OFFSET $3
    )
  `, [userA, userB, max]);
}

// Delete all private messages between 2 users
async function deletePrivateSession(userA, userB) {
  await pool.query(`
    DELETE FROM messages
    WHERE is_private = true
      AND ((user_id = $1 AND recipient_id = $2) OR (user_id = $2 AND recipient_id = $1))
  `, [userA, userB]);
}

// Delete all private chats inactive for more than 4 hours
date4hAgo = () => new Date(Date.now() - 4 * 60 * 60 * 1000);
async function deleteInactivePrivateChats() {
  // Find all distinct private chat pairs with last activity older than 4 hours
  const res = await pool.query(`
    SELECT user_id, recipient_id, MAX(created_at) as last_msg
    FROM messages
    WHERE is_private = true
    GROUP BY user_id, recipient_id
    HAVING MAX(created_at) < NOW() - INTERVAL '4 hours'
  `);
  for (const row of res.rows) {
    await deletePrivateSession(row.user_id, row.recipient_id);
  }
}

module.exports = {
  enforceRoomMessageLimit,
  enforcePrivateMessageLimit,
  deletePrivateSession,
  deleteInactivePrivateChats
};
