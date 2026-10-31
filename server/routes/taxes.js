const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/taxes - list active tax rules
router.get('/', authenticate, (req, res) => {
  const taxes = db.prepare('SELECT * FROM tax_rules WHERE is_active = 1 ORDER BY id ASC').all();
  res.json({ taxes });
});

// POST /api/taxes - Admin only
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name, rate, tax_type } = req.body;
  if (!name || rate === undefined) {
    return res.status(400).json({ error: 'Name and rate are required.' });
  }

  try {
    const info = db.prepare(`
      INSERT INTO tax_rules (name, rate, tax_type)
      VALUES (?, ?, ?)
    `).run(name.trim(), Number(rate), tax_type || 'percentage');

    const tax = db.prepare('SELECT * FROM tax_rules WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ message: 'Tax rule created successfully', tax });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create tax rule: ' + err.message });
  }
});

// PUT /api/taxes/:id - Admin only
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const { name, rate, is_active } = req.body;
  try {
    db.prepare(`
      UPDATE tax_rules
      SET name = COALESCE(?, name),
          rate = COALESCE(?, rate),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(name, rate !== undefined ? Number(rate) : null, is_active !== undefined ? (is_active ? 1 : 0) : null, req.params.id);

    const tax = db.prepare('SELECT * FROM tax_rules WHERE id = ?').get(req.params.id);
    res.json({ message: 'Tax rule updated', tax });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update tax rule: ' + err.message });
  }
});

module.exports = router;

