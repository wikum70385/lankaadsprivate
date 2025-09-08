const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Get all districts
router.get('/districts', async (req, res) => {
  try {
    const result = await query('SELECT district FROM districts ORDER BY district');
    res.json(result.rows.map(row => row.district));
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cities for a district
router.get('/cities/:district', async (req, res) => {
  try {
    const result = await query(
      'SELECT city FROM cities WHERE district = $1 ORDER BY city',
      [req.params.district]
    );
    res.json(result.rows.map(row => row.city));
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 