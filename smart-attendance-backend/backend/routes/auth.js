const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Register new faculty
router.post('/register', async (req, res) => {
  const { faculty_id, name, email, department, password, admin_key } = req.body;

  if (!faculty_id || !name || !email || !department || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM faculty WHERE faculty_id = $1 OR email = $2',
      [faculty_id, email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Faculty ID or email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const is_admin = admin_key === process.env.ADMIN_SECRET_KEY;

    const result = await pool.query(
      `INSERT INTO faculty (faculty_id, name, email, department, password_hash, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, faculty_id, name, email, department, is_admin`,
      [faculty_id, name, email, department, password_hash, is_admin]
    );

    res.status(201).json({ message: 'Registration successful', faculty: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { faculty_id, password } = req.body;

  if (!faculty_id || !password) {
    return res.status(400).json({ error: 'Faculty ID and password required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM faculty WHERE faculty_id = $1',
      [faculty_id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const faculty = result.rows[0];
    const valid = await bcrypt.compare(password, faculty.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: faculty.id,
        faculty_id: faculty.faculty_id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        is_admin: faculty.is_admin
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      faculty: {
        faculty_id: faculty.faculty_id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        is_admin: faculty.is_admin,
        has_face_data: !!faculty.face_data
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT faculty_id, name, email, department, is_admin, face_data IS NOT NULL as has_face_data FROM faculty WHERE faculty_id = $1',
      [req.user.faculty_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Save face data (base64 image)
router.post('/save-face', authenticateToken, async (req, res) => {
  const { face_data } = req.body;
  if (!face_data) return res.status(400).json({ error: 'Face data required' });

  try {
    await pool.query(
      'UPDATE faculty SET face_data = $1 WHERE faculty_id = $2',
      [face_data, req.user.faculty_id]
    );
    res.json({ message: 'Face data saved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save face data' });
  }
});

// Get stored face data for verification
router.get('/face-data', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT face_data FROM faculty WHERE faculty_id = $1',
      [req.user.faculty_id]
    );
    if (!result.rows[0]?.face_data) {
      return res.status(404).json({ error: 'No face data registered' });
    }
    res.json({ face_data: result.rows[0].face_data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch face data' });
  }
});

module.exports = router;
