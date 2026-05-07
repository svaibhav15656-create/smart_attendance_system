const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { checkWifiRestriction, getClientIp } = require('../middleware/wifi');

// Helper: check time window
const isWithinWindow = (startTime, endTime) => {
  const now = new Date();
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

// Mark entry
router.post('/entry', authenticateToken, checkWifiRestriction, async (req, res) => {
  const { face_verified } = req.body;
  const { faculty_id } = req.user;
  const ip = getClientIp(req);
  const today = new Date().toISOString().split('T')[0];

  // Check time window
  const entryStart = process.env.ENTRY_START || '06:00';
  const entryEnd = process.env.ENTRY_END || '09:30';
  
  // Allow if no time restriction in dev (when times are default)
  const skipTimeCheck = process.env.SKIP_TIME_CHECK === 'true';
  
  if (!skipTimeCheck && !isWithinWindow(entryStart, entryEnd)) {
    return res.status(400).json({
      error: 'Outside entry window',
      message: `Entry is allowed only between ${entryStart} and ${entryEnd}`
    });
  }

  try {
    // Check if already marked entry today
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE faculty_id = $1 AND date = $2',
      [faculty_id, today]
    );

    if (existing.rows.length > 0 && existing.rows[0].entry_time) {
      return res.status(409).json({
        error: 'Already marked',
        message: 'Entry already marked for today',
        entry_time: existing.rows[0].entry_time
      });
    }

    const now = new Date();
    const [eh, em] = entryEnd.split(':').map(Number);
    const entryEndMinutes = eh * 60 + em;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    // Consider late if within last 30 min of window
    const isLate = currentMinutes > entryEndMinutes - 30;

    const result = await pool.query(
      `INSERT INTO attendance (faculty_id, date, entry_time, entry_ip, entry_face_verified, status)
       VALUES ($1, $2, NOW(), $3, $4, $5)
       ON CONFLICT (faculty_id, date) DO UPDATE
       SET entry_time = NOW(), entry_ip = $3, entry_face_verified = $4, status = $5
       RETURNING *`,
      [faculty_id, today, ip, face_verified || false, isLate ? 'late' : 'present']
    );

    // Log device info
    await pool.query(
      'INSERT INTO device_logs (faculty_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
      [faculty_id, 'entry', ip, req.headers['user-agent']]
    );

    res.json({
      message: 'Entry marked successfully',
      attendance: result.rows[0],
      status: isLate ? 'late' : 'on_time'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark entry' });
  }
});

// Mark exit
router.post('/exit', authenticateToken, checkWifiRestriction, async (req, res) => {
  const { face_verified } = req.body;
  const { faculty_id } = req.user;
  const ip = getClientIp(req);
  const today = new Date().toISOString().split('T')[0];

  const exitStart = process.env.EXIT_START || '16:00';
  const exitEnd = process.env.EXIT_END || '20:00';
  const skipTimeCheck = process.env.SKIP_TIME_CHECK === 'true';

  if (!skipTimeCheck && !isWithinWindow(exitStart, exitEnd)) {
    return res.status(400).json({
      error: 'Outside exit window',
      message: `Exit is allowed only between ${exitStart} and ${exitEnd}`
    });
  }

  try {
    const existing = await pool.query(
      'SELECT * FROM attendance WHERE faculty_id = $1 AND date = $2',
      [faculty_id, today]
    );

    if (existing.rows.length === 0 || !existing.rows[0].entry_time) {
      return res.status(400).json({ error: 'Entry not marked', message: 'Please mark entry first' });
    }

    if (existing.rows[0].exit_time) {
      return res.status(409).json({
        error: 'Already marked',
        message: 'Exit already marked for today',
        exit_time: existing.rows[0].exit_time
      });
    }

    const result = await pool.query(
      `UPDATE attendance SET exit_time = NOW(), exit_ip = $1, exit_face_verified = $2
       WHERE faculty_id = $3 AND date = $4 RETURNING *`,
      [ip, face_verified || false, faculty_id, today]
    );

    await pool.query(
      'INSERT INTO device_logs (faculty_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
      [faculty_id, 'exit', ip, req.headers['user-agent']]
    );

    res.json({ message: 'Exit marked successfully', attendance: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark exit' });
  }
});

// Get today's status for logged-in faculty
router.get('/today', authenticateToken, async (req, res) => {
  const { faculty_id } = req.user;
  const today = new Date().toISOString().split('T')[0];

  try {
    const result = await pool.query(
      'SELECT * FROM attendance WHERE faculty_id = $1 AND date = $2',
      [faculty_id, today]
    );
    res.json({ attendance: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch today status' });
  }
});

// Get my attendance history
router.get('/my-history', authenticateToken, async (req, res) => {
  const { faculty_id } = req.user;
  const { month, year } = req.query;

  try {
    let query = 'SELECT * FROM attendance WHERE faculty_id = $1';
    const params = [faculty_id];

    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`;
      params.push(month, year);
    }

    query += ' ORDER BY date DESC LIMIT 30';
    const result = await pool.query(query, params);
    res.json({ attendance: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
