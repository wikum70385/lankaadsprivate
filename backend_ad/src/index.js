const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/init-db');
const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ads');
const categoryRoutes = require('./routes/categories');
const locationRoutes = require('./routes/locations');
const { initializeDatabase } = require('./config/database');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/users', usersRoutes);

// Initialize database
initDatabase().catch(console.error);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 