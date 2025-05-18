const pool = require('./db');

console.log('Testing database connection...');

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection error:', err);
        console.error('Error details:', err.message);
    } else {
        console.log('✅ Database connected successfully!');
        console.log('Current database time:', res.rows[0].now);
    }
    // Close the pool
    pool.end();
});  


// VIBE CODED FOR TEST