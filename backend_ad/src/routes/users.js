const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const authenticateToken = require('../middleware/auth');

// Delete user account but keep locked ads until expiry
router.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    // 1. Set user as deleted (or remove from users table)
    await query('DELETE FROM users WHERE id = $1', [userId]);

    // 2. For ads: do NOT delete ads that are still in locked period (edit_locked_until > NOW())
    //    Instead, keep them in DB; they will expire and be auto-deleted by your existing cleanup/expiry logic.
    //    Optionally, you can anonymize the user_id on those ads if needed for privacy.

    // 3. For all ads not in locked period (if you want to delete them):
    // await query('DELETE FROM ads WHERE user_id = $1 AND edit_locked_until <= NOW()', [userId]);

    res.json({ success: true, message: 'Account deleted. Locked ads will remain until expiry.' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

module.exports = router;
