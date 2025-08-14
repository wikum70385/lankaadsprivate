const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  // For development, accept dummy tokens
  if (token.startsWith('dummy_token_')) {
    try {
      // Extract username from token (assuming format: dummy_token_username_timestamp)
      const parts = token.split('_');
      const username = parts[2] || 'dummy_user';
      const userId = 'dummy_user_' + Date.now();

      // First check if user exists by username
      const existingUser = await query('SELECT * FROM users WHERE username = $1', [username]);
      
      if (existingUser.rows.length > 0) {
        // Use existing user
        req.user = {
          userId: existingUser.rows[0].id,
          username: existingUser.rows[0].username,
          telephone: existingUser.rows[0].telephone
        };
        return next();
      }

      // If no existing user, create new one
      await query(
        'INSERT INTO users (id, username, telephone, password_hash) VALUES ($1, $2, $3, $4)',
        [userId, username, '0712345678', 'dummy_hash']
      );

      req.user = {
        userId,
        username,
        telephone: '0712345678'
      };
      return next();
    } catch (error) {
      console.error('Error handling dummy user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // For production, verify JWT token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken; 