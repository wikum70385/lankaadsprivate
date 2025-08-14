const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Get online users
router.get('/online', auth, async (req, res) => {
  try {
    // Only return users who are truly connected (socket)
    const { getConnectedUserIds } = require('../config/socket');
    const connectedIds = getConnectedUserIds();
    if (connectedIds.length === 0) return res.json({ success: true, users: [] });
    const result = await pool.query(
      `SELECT id, nickname, gender, last_active FROM users WHERE id = ANY($1) ORDER BY nickname`,
      [connectedIds]
    );
    const users = result.rows.map(user => ({
      id: user.id,
      nickname: user.nickname,
      gender: user.gender,
      lastActive: user.last_active
    }));
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      'SELECT id, nickname, gender, last_active, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        nickname: user.nickname,
        gender: user.gender,
        lastActive: user.last_active,
        joinedAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
