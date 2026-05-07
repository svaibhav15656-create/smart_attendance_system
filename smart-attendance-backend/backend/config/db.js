const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS faculty (
        id SERIAL PRIMARY KEY,
        faculty_id VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        department VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        face_data TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        faculty_id VARCHAR(20) NOT NULL REFERENCES faculty(faculty_id),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        entry_time TIMESTAMP,
        exit_time TIMESTAMP,
        entry_ip VARCHAR(50),
        exit_ip VARCHAR(50),
        entry_face_verified BOOLEAN DEFAULT FALSE,
        exit_face_verified BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'present',
        UNIQUE(faculty_id, date)
      );

      CREATE TABLE IF NOT EXISTS device_logs (
        id SERIAL PRIMARY KEY,
        faculty_id VARCHAR(20) NOT NULL,
        action VARCHAR(20) NOT NULL,
        ip_address VARCHAR(50),
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ DB init error:', err.message);
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
