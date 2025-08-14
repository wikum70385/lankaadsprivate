const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get room messages
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await pool.query(
      `SELECT m.*, u.nickname, u.gender 
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.room_id = $1 AND m.is_private = false
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [roomId, limit, offset]
    );
    
    const messages = result.rows.reverse().map(msg => ({
      id: msg.id,
      userId: msg.user_id,
      nickname: msg.nickname,
      content: msg.content,
      timestamp: msg.created_at,
      type: msg.message_type,
      room: msg.room_id,
      isPrivate: false
    }));
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching room messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get private messages
router.get('/private/:otherUserId', auth, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT m.*, u.nickname, u.gender 
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.is_private = true
       AND ((m.user_id = $1 AND m.recipient_id = $2) OR (m.user_id = $2 AND m.recipient_id = $1))
       ORDER BY m.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, otherUserId, limit, offset]
    );
    
    const messages = result.rows.reverse().map(msg => ({
      id: msg.id,
      userId: msg.user_id,
      nickname: msg.nickname,
      content: msg.content,
      timestamp: msg.created_at,
      type: msg.message_type,
      isPrivate: true,
      recipientId: msg.recipient_id
    }));
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching private messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload image
router.post('/upload-image', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imageUrl = `/uploads/images/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread message counts
router.get('/unread-counts', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get unread room messages
    const roomResult = await pool.query(
      `SELECT m.room_id, COUNT(*) as unread_count
       FROM messages m
       LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = $1
       WHERE m.room_id IS NOT NULL 
       AND m.is_private = false 
       AND m.user_id != $1 
       AND mr.id IS NULL
       GROUP BY m.room_id`,
      [userId]
    );
    
    // Get unread private messages
    const privateResult = await pool.query(
      `SELECT m.user_id, COUNT(*) as unread_count
       FROM messages m
       LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = $1
       WHERE m.recipient_id = $1 
       AND m.is_private = true 
       AND mr.id IS NULL
       GROUP BY m.user_id`,
      [userId]
    );
    
    const rooms = {};
    roomResult.rows.forEach(row => {
      rooms[row.room_id] = parseInt(row.unread_count);
    });
    
    const privateChats = {};
    privateResult.rows.forEach(row => {
      privateChats[row.user_id] = parseInt(row.unread_count);
    });
    
    res.json({
      success: true,
      unreadCounts: {
        rooms,
        privateChats
      }
    });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark messages as read
router.post('/mark-read', auth, async (req, res) => {
  try {
    const { roomId, otherUserId } = req.body;
    const userId = req.user.id;
    
    let query, params;
    
    if (roomId) {
      // Mark room messages as read
      query = `
        INSERT INTO message_reads (message_id, user_id)
        SELECT m.id, $1
        FROM messages m
        LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = $1
        WHERE m.room_id = $2 AND m.is_private = false AND m.user_id != $1 AND mr.id IS NULL
      `;
      params = [userId, roomId];
    } else if (otherUserId) {
      // Mark private messages as read
      query = `
        INSERT INTO message_reads (message_id, user_id)
        SELECT m.id, $1
        FROM messages m
        LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = $1
        WHERE m.user_id = $2 AND m.recipient_id = $1 AND m.is_private = true AND mr.id IS NULL
      `;
      params = [userId, otherUserId];
    } else {
      return res.status(400).json({ error: 'Either roomId or otherUserId is required' });
    }
    
    await pool.query(query, params);
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
