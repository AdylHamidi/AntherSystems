const { Pool } = require('pg');
require('dotenv').config();

// Log database configuration (without sensitive data)
console.log('Database Configuration:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    // Don't log the password
});

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

// Test the database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            stack: err.stack
        });
    } else {
        console.log('Successfully connected to the database');
        release();
    }
});

// Add error handler for the pool
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack
    });
});

module.exports = pool; 