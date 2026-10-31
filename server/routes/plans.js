const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/plans - list all plans
router.get('/', authenticate, (req, res) => {
  const plans = db.prepare(`
    SELECT * FROM plans WHERE active = 1 ORDER BY id DESC
  `).all();
  res.json({ plans });
});

// GET /api/plans/:id
router.get('/:id', authenticate, (req, res) => {
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found.' });
  }
  res.json({ plan });
});

// POST /api/plans - Admin only
router.post('/', authenticate, requireAdmin, (req, res) => {
  const {
    name,
    billing_frequency,
    price,
    cost_price,
    min_quantity,
    start_date,
    end_date,
    auto_close_on_end,
    allow_close_early,
    allow_pause,
    allow_renew
  } = req.body;

  if (!name || !billing_frequency || price === undefined) {
    return res.status(400).json({ error: 'Name, billing frequency, and price are required.' });
  }

  const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
  if (!validFrequencies.includes(billing_frequency)) {
    return res.status(400).json({ error: `Billing frequency must be one of: ${validFrequencies.join(', ')}` });
  }

  try {
    const info = db.prepare(`
      INSERT INTO plans (
        name, billing_frequency, price, cost_price, min_quantity,
        start_date, end_date, auto_close_on_end, allow_close_early,
        allow_pause, allow_renew
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      billing_frequency,
      Number(price),
      Number(cost_price || 0),
      Number(min_quantity || 1),
      start_date || null,
      end_date || null,
      auto_close_on_end ? 1 : 0,
      allow_close_early !== undefined ? (allow_close_early ? 1 : 0) : 1,
      allow_pause !== undefined ? (allow_pause ? 1 : 0) : 1,
      allow_renew !== undefined ? (allow_renew ? 1 : 0) : 1
    );

    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ message: 'Plan created successfully', plan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create plan: ' + err.message });
  }
});

// PUT /api/plans/:id - Admin only
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const {
    name,
    billing_frequency,
    price,
    cost_price,
    min_quantity,
    start_date,
    end_date,
    auto_close_on_end,
    allow_close_early,
    allow_pause,
    allow_renew
  } = req.body;

  const planId = req.params.id;
  const existing = db.prepare('SELECT * FROM plans WHERE id = ?').get(planId);
  if (!existing) {
    return res.status(404).json({ error: 'Plan not found.' });
  }

  try {
    db.prepare(`
      UPDATE plans
      SET name = ?, billing_frequency = ?, price = ?, cost_price = ?,
          min_quantity = ?, start_date = ?, end_date = ?,
          auto_close_on_end = ?, allow_close_early = ?, allow_pause = ?,
          allow_renew = ?
      WHERE id = ?
    `).run(
      name || existing.name,
      billing_frequency || existing.billing_frequency,
      price !== undefined ? Number(price) : existing.price,
      cost_price !== undefined ? Number(cost_price) : existing.cost_price,
      min_quantity !== undefined ? Number(min_quantity) : existing.min_quantity,
      start_date !== undefined ? start_date : existing.start_date,
      end_date !== undefined ? end_date : existing.end_date,
      auto_close_on_end !== undefined ? (auto_close_on_end ? 1 : 0) : existing.auto_close_on_end,
      allow_close_early !== undefined ? (allow_close_early ? 1 : 0) : existing.allow_close_early,
      allow_pause !== undefined ? (allow_pause ? 1 : 0) : existing.allow_pause,
      allow_renew !== undefined ? (allow_renew ? 1 : 0) : existing.allow_renew,
      planId
    );

    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(planId);
    res.json({ message: 'Plan updated successfully', plan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update plan: ' + err.message });
  }
});

// DELETE /api/plans/:id - Admin only (soft delete)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('UPDATE plans SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Plan deactivated successfully' });
});

module.exports = router;

