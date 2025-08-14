const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const router = express.Router();

// Guest login (no password required)
router.post('/guest-login', async (req, res) => {
  try {
    const { nickname, gender } = req.body;
    
    if (!nickname || !gender) {
      return res.status(400).json({ error: 'Nickname and gender are required' });
    }

    // Check if nickname already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE nickname = $1',
      [nickname]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      // Check if the user is truly connected (socket)
      const { getConnectedUserIds } = require('../config/socket');
      const connectedIds = getConnectedUserIds();
      if (connectedIds.includes(user.id)) {
        return res.status(400).json({ error: 'Nickname already taken' });
      } else {
        // If user exists but is offline, set them online and return
        // Do NOT set is_online here. Only set is_online=true on socket connect.
        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, nickname: nickname },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        const userResult = await pool.query(
          'SELECT id, nickname, gender, created_at FROM users WHERE id = $1',
          [user.id]
        );
        const userData = userResult.rows[0];
        return res.json({
          success: true,
          user: {
            id: userData.id,
            nickname: userData.nickname,
            gender: userData.gender,
            lastActive: userData.created_at
          },
          token
        });
      }
    }

    // Create new user
    const result = await pool.query(
      `INSERT INTO users (nickname, gender, is_online) 
       VALUES ($1, $2, false) RETURNING id, nickname, gender, created_at`,
      [nickname, gender]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, nickname: user.nickname },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        nickname: user.nickname,
        gender: user.gender,
        lastActive: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Check if user has ever sent a message
      const msgRes = await pool.query('SELECT 1 FROM messages WHERE user_id = $1 LIMIT 1', [decoded.userId]);
      if (msgRes.rows.length === 0) {
        // Delete ghost user
        await pool.query('DELETE FROM users WHERE id = $1', [decoded.userId]);
      } else {
        await pool.query('UPDATE users SET is_online = false WHERE id = $1', [decoded.userId]);
      }
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to clean up ghost users (inactive >24h and never sent a message)
router.delete('/cleanup-ghost-users', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM users 
       WHERE id NOT IN (SELECT DISTINCT user_id FROM messages)
         AND is_online = false
         AND created_at < NOW() - INTERVAL '24 hours'`
    );
    res.json({ success: true, deleted: result.rowCount });
  } catch (error) {
    console.error('Ghost user cleanup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user info from token
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const userResult = await pool.query(
      'SELECT id, nickname, gender, created_at as "lastActive" FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];
    res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
