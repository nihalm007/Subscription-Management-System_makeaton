const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate, requireStaffOrAdmin } = require('../middleware/auth');

// GET /api/audit-logs
router.get('/', authenticate, requireStaffOrAdmin, (req, res) => {
  const logs = db.prepare(`
    SELECT * FROM audit_logs
    ORDER BY id DESC
    LIMIT 100
  `).all();
  res.json({ logs });
});

module.exports = router;

