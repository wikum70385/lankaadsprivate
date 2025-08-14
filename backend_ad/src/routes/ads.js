const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const authenticateToken = require('../middleware/auth');

// Constants
const MAX_ADS_PER_USER = 4;
const AD_EDIT_LOCK_PERIOD = 14 * 24 * 60 * 60 * 1000; // 14 days in ms
const AD_EXPIRATION_PERIOD = 60 * 24 * 60 * 60 * 1000; // 60 days in ms

// Get all ads with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, district, city } = req.query;
    const offset = (page - 1) * limit;

    let queryString = `
      SELECT a.*, u.username, u.telephone,
        (SELECT json_agg(image_url ORDER BY display_order) FROM ad_images WHERE ad_id = a.id) as images
      FROM ads a
      JOIN users u ON a.user_id = u.id
      WHERE a.status = 'active' AND a.expires_at > NOW()
    `;
    const queryParams = [];
    let paramCount = 1;

    if (category) {
      queryString += ` AND a.category = $${paramCount}`;
      queryParams.push(category);
      paramCount++;
    }

    if (district) {
      queryString += ` AND a.district = $${paramCount}`;
      queryParams.push(district);
      paramCount++;
    }

    if (city) {
      queryString += ` AND a.city = $${paramCount}`;
      queryParams.push(city);
      paramCount++;
    }

    queryString += ` ORDER BY a.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryString, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific ad
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, u.username, u.telephone,
        (SELECT json_agg(image_url ORDER BY display_order) FROM ad_images WHERE ad_id = a.id) as images
      FROM ads a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching ad:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new ad
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      title,
      description,
      price,
      category,
      contact_number,
      is_whatsapp,
      is_viber,
      district,
      city,
      images
    } = req.body;

    // Validate required fields
    if (!title || !description || !price || !category || !contact_number || !district) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          title: !title,
          description: !description,
          price: !price,
          category: !category,
          contact_number: !contact_number,
          district: !district
        }
      });
    }

    // Validate price is a number
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ error: 'Invalid price value' });
    }

    // Check user's active ad count
    const activeAdsCount = await query(
      'SELECT COUNT(*) FROM ads WHERE user_id = $1 AND status = $2 AND expires_at > NOW()',
      [userId, 'active']
    );

    if (activeAdsCount.rows[0].count >= MAX_ADS_PER_USER) {
      return res.status(400).json({ error: 'Maximum number of active ads reached' });
    }

    // Create new ad
    const adId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + AD_EXPIRATION_PERIOD);
    const editLockedUntil = new Date(now.getTime() + AD_EDIT_LOCK_PERIOD);

    try {
      await query(`
        INSERT INTO ads (
          id, user_id, title, description, price, category,
          contact_number, is_whatsapp, is_viber, district, city,
          edit_locked_until, expires_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active')
      `, [
        adId, userId, title, description, price, category,
        contact_number, is_whatsapp, is_viber, district, city,
        editLockedUntil, expiresAt
      ]);

      // Insert images if provided
      if (images && images.length > 0) {
        const imageValues = images.map((image, index) => ({
          id: uuidv4(),
          ad_id: adId,
          image_url: image,
          display_order: index
        }));

        for (const image of imageValues) {
          await query(
            'INSERT INTO ad_images (id, ad_id, image_url, display_order) VALUES ($1, $2, $3, $4)',
            [image.id, image.ad_id, image.image_url, image.display_order]
          );
        }
      }

      res.status(201).json({ id: adId, message: 'Ad created successfully' });
    } catch (dbError) {
      console.error('Database error creating ad:', dbError);
      return res.status(500).json({ 
        error: 'Database error creating ad',
        details: dbError.message
      });
    }
  } catch (error) {
    console.error('Error creating ad:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Update ad
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const adId = req.params.id;

    // Check if ad exists and belongs to user
    const adResult = await query(
      'SELECT * FROM ads WHERE id = $1 AND user_id = $2',
      [adId, userId]
    );

    if (adResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    const ad = adResult.rows[0];

    // Check if ad is locked
    if (new Date(ad.edit_locked_until) > new Date()) {
      return res.status(400).json({ error: 'Ad is locked for editing' });
    }

    // Update ad
    const {
      title,
      description,
      price,
      category,
      contact_number,
      is_whatsapp,
      is_viber,
      district,
      city
    } = req.body;

    await query(`
      UPDATE ads SET
        title = $1,
        description = $2,
        price = $3,
        category = $4,
        contact_number = $5,
        is_whatsapp = $6,
        is_viber = $7,
        district = $8,
        city = $9
      WHERE id = $10 AND user_id = $11
    `, [
      title, description, price, category, contact_number,
      is_whatsapp, is_viber, district, city, adId, userId
    ]);

    res.json({ message: 'Ad updated successfully' });
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete ad
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const adId = req.params.id;

    const result = await query(
      'DELETE FROM ads WHERE id = $1 AND user_id = $2 RETURNING *',
      [adId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Republish expired ad
router.post('/:id/republish', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const adId = req.params.id;

    // Check if ad exists and belongs to user
    const adResult = await query(
      'SELECT * FROM ads WHERE id = $1 AND user_id = $2',
      [adId, userId]
    );

    if (adResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    const ad = adResult.rows[0];

    // Check if ad is expired
    if (new Date(ad.expires_at) > new Date()) {
      return res.status(400).json({ error: 'Ad is not expired yet' });
    }

    // Check user's active ad count
    const activeAdsCount = await query(
      'SELECT COUNT(*) FROM ads WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );

    if (activeAdsCount.rows[0].count >= MAX_ADS_PER_USER) {
      return res.status(400).json({ error: 'Maximum number of active ads reached' });
    }

    // Republish ad
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + AD_EXPIRATION_PERIOD);
    const newEditLockedUntil = new Date(now.getTime() + AD_EDIT_LOCK_PERIOD);

    await query(`
      UPDATE ads SET
        status = 'active',
        expires_at = $1,
        edit_locked_until = $2
      WHERE id = $3 AND user_id = $4
    `, [newExpiresAt, newEditLockedUntil, adId, userId]);

    res.json({ message: 'Ad republished successfully' });
  } catch (error) {
    console.error('Error republishing ad:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's active ad count
router.get('/user/count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await query(
      'SELECT COUNT(*) FROM ads WHERE user_id = $1 AND status = $2 AND expires_at > NOW()',
      [userId, 'active']
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching user ad count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's ads
router.get('/user/ads', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await query(`
      WITH ad_images_agg AS (
        SELECT ad_id, json_agg(image_url ORDER BY display_order) as images
        FROM ad_images
        GROUP BY ad_id
      )
      SELECT a.*, ai.images, u.username, u.telephone
      FROM ads a
      LEFT JOIN ad_images_agg ai ON a.id = ai.ad_id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.user_id = $1 AND a.status = 'active' AND a.expires_at > NOW()
      ORDER BY a.created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user ads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 