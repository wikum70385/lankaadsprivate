const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific category
router.get('/:slug', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categories WHERE slug = $1', [req.params.slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 