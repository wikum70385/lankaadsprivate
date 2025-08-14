const { pool } = require('./database');
const categories = require('./categories');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const initDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        telephone VARCHAR(15) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create ads table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ads (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        contact_number VARCHAR(15) NOT NULL,
        is_whatsapp BOOLEAN DEFAULT FALSE,
        is_viber BOOLEAN DEFAULT FALSE,
        district VARCHAR(50),
        city VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        edit_locked_until TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(10) DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create ad_images table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ad_images (
        id UUID PRIMARY KEY,
        ad_id UUID NOT NULL,
        image_url TEXT NOT NULL,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
      );
    `);

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        slug VARCHAR(50) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        icon VARCHAR(50) NOT NULL
      );
    `);

    // Create districts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS districts (
        district VARCHAR(50) PRIMARY KEY
      );
    `);

    // Create cities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id UUID PRIMARY KEY,
        district VARCHAR(50) NOT NULL,
        city VARCHAR(50) NOT NULL,
        FOREIGN KEY (district) REFERENCES districts(district) ON DELETE CASCADE
      );
    `);

    // Initialize categories if table is empty
    const categoryCount = await pool.query('SELECT COUNT(*) FROM categories');
    if (categoryCount.rows[0].count === '0') {
      for (const category of categories) {
        await pool.query(
          'INSERT INTO categories (slug, name, icon) VALUES ($1, $2, $3)',
          [category.slug, category.name, category.icon]
        );
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

async function initializeTestUser() {
  try {
    // Create test user
    const userId = uuidv4();
    const username = 'testuser';
    const password = 'testpass123';
    const telephone = '+94771234567';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length === 0) {
      // Insert test user
      await pool.query(
        'INSERT INTO users (id, username, password, telephone) VALUES ($1, $2, $3, $4)',
        [userId, username, hashedPassword, telephone]
      );
      console.log('Test user created successfully');
    } else {
      console.log('Test user already exists');
    }
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

// Run the initialization
async function initialize() {
  try {
    await initDatabase();
    await initializeTestUser();
  } catch (error) {
    console.error('Error during initialization:', error);
  } finally {
    // Don't close the pool here as it might be needed by other parts of the application
    // await pool.end();
  }
}

// Only run if this file is being run directly
if (require.main === module) {
  initialize().catch(console.error);
}

module.exports = { initDatabase, initializeTestUser }; 