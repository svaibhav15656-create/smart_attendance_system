const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require admin
router.use(authenticateToken, requireAdmin);

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const [totalFaculty, todayPresent, todayLate, todayAbsent] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM faculty WHERE is_admin = FALSE'),
      pool.query("SELECT COUNT(*) FROM attendance WHERE date = $1 AND status IN ('present','late')", [today]),
      pool.query("SELECT COUNT(*) FROM attendance WHERE date = $1 AND status = 'late'", [today]),
      pool.query(`SELECT COUNT(*) FROM faculty f WHERE is_admin = FALSE AND NOT EXISTS (
        SELECT 1 FROM attendance a WHERE a.faculty_id = f.faculty_id AND a.date = $1)`, [today])
    ]);

    res.json({
      total_faculty: parseInt(totalFaculty.rows[0].count),
      today_present: parseInt(todayPresent.rows[0].count),
      today_late: parseInt(todayLate.rows[0].count),
      today_absent: parseInt(todayAbsent.rows[0].count),
      date: today
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// Today's attendance list
router.get('/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(`
      SELECT f.faculty_id, f.name, f.department, f.email,
             a.entry_time, a.exit_time, a.status, a.entry_face_verified, a.exit_face_verified, a.entry_ip
      FROM faculty f
      LEFT JOIN attendance a ON f.faculty_id = a.faculty_id AND a.date = $1
      WHERE f.is_admin = FALSE
      ORDER BY f.department, f.name
    `, [today]);

    res.json({ attendance: result.rows, date: today });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch today attendance' });
  }
});

// All faculty list
router.get('/faculty', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT faculty_id, name, email, department, is_admin, face_data IS NOT NULL as has_face_data, created_at FROM faculty ORDER BY department, name'
    );
    res.json({ faculty: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

// Attendance report by date range
router.get('/report', async (req, res) => {
  const { from, to, department } = req.query;
  const fromDate = from || new Date().toISOString().split('T')[0];
  const toDate = to || fromDate;

  try {
    let query = `
      SELECT f.faculty_id, f.name, f.department,
             a.date, a.entry_time, a.exit_time, a.status, a.entry_face_verified
      FROM faculty f
      LEFT JOIN attendance a ON f.faculty_id = a.faculty_id AND a.date BETWEEN $1 AND $2
      WHERE f.is_admin = FALSE
    `;
    const params = [fromDate, toDate];

    if (department) {
      query += ` AND f.department = $3`;
      params.push(department);
    }

    query += ' ORDER BY a.date DESC, f.department, f.name';
    const result = await pool.query(query, params);
    res.json({ report: result.rows, from: fromDate, to: toDate });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Departments list
router.get('/departments', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT department FROM faculty ORDER BY department');
    res.json({ departments: result.rows.map(r => r.department) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Monthly summary for a faculty
router.get('/faculty/:faculty_id/summary', async (req, res) => {
  const { faculty_id } = req.params;
  const { month, year } = req.query;
  const m = month || new Date().getMonth() + 1;
  const y = year || new Date().getFullYear();

  try {
    const result = await pool.query(`
      SELECT date, entry_time, exit_time, status, entry_face_verified
      FROM attendance
      WHERE faculty_id = $1
        AND EXTRACT(MONTH FROM date) = $2
        AND EXTRACT(YEAR FROM date) = $3
      ORDER BY date
    `, [faculty_id, m, y]);

    const stats = {
      present: result.rows.filter(r => r.status === 'present').length,
      late: result.rows.filter(r => r.status === 'late').length,
      absent: 0
    };

    res.json({ summary: result.rows, stats, faculty_id, month: m, year: y });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
