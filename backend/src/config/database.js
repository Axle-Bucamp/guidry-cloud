const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Add a table for user credits and transactions
const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_credits (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
        last_free_credit_grant TIMESTAMPTZ
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(12, 4) NOT NULL, -- Positive for additions, negative for deductions
        type VARCHAR(50) NOT NULL, -- e.g., 'purchase', 'usage_deduction', 'free_grant', 'refund'
        description TEXT,
        transaction_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        payment_gateway_id VARCHAR(255), -- Optional: ID from payment gateway
        status VARCHAR(50) DEFAULT 'completed' -- e.g., 'pending', 'completed', 'failed'
      );
    `);
    console.log("User credits and credit transactions tables initialized or already exist.");
  } catch (err) {
    console.error("Error initializing database tables for credits:", err);
  } finally {
    client.release();
  }
};

// Call initDb when this module is loaded, or integrate into a larger DB init script
// For simplicity here, we can call it, but in a real app, this would be part of a migration system.
// initDb(); // Commenting out to avoid running automatically during file write, should be run by the app startup.

module.exports = {
  query: (text, params) => pool.query(text, params),
  initDb, // Export initDb to be called at application startup
  pool,
};


