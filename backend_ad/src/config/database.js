const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'lankaads',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Log database configuration (without password)
console.log('Database Configuration:');
console.log('DB_USER:', process.env.DB_USER || 'postgres');
console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
console.log('DB_NAME:', process.env.DB_NAME || 'lankaads');
console.log('DB_PORT:', process.env.DB_PORT || 5432);

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Successfully connected to the database');
  }
});

const initializeDatabase = async () => {
  try {
    // Test the connection
    const client = await pool.connect();
    client.release();
    console.log('Database connection test successful');
  } catch (error) {
    console.error('Error testing database connection:', error);
    throw error;
  }
};

// Helper function to execute queries
const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  initializeDatabase
}; 