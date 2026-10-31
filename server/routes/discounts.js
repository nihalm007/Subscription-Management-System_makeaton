const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/discounts - List discounts
router.get('/', authenticate, (req, res) => {
  const discounts = db.prepare(`
    SELECT d.*, p.name as product_name
    FROM discount_rules d
    LEFT JOIN products p ON p.id = d.product_id
    ORDER BY d.id DESC
  `).all();
  res.json({ discounts });
});

// POST /api/discounts - ONLY Admin can create discount rules!
router.post('/', authenticate, requireAdmin, (req, res) => {
  const {
    code,
    name,
    discount_type,
    value,
    min_purchase_amount,
    min_quantity,
    start_date,
    end_date,
    usage_limit,
    scope,
    product_id
  } = req.body;

  if (!code || !name || !discount_type || value === undefined) {
    return res.status(400).json({ error: 'Code, name, discount type and value are required.' });
  }

  if (!['fixed', 'percentage'].includes(discount_type)) {
    return res.status(400).json({ error: 'discount_type must be either "fixed" or "percentage".' });
  }

  if (!['whole_subscription', 'specific_product'].includes(scope || 'whole_subscription')) {
    return res.status(400).json({ error: 'scope must be "whole_subscription" or "specific_product".' });
  }

  const existing = db.prepare('SELECT id FROM discount_rules WHERE code = ?').get(code.trim().toUpperCase());
  if (existing) {
    return res.status(400).json({ error: 'A discount rule with this code already exists.' });
  }

  try {
    const info = db.prepare(`
      INSERT INTO discount_rules (
        code, name, discount_type, value, min_purchase_amount,
        min_quantity, start_date, end_date, usage_limit, usage_count,
        scope, product_id, is_active, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1, ?)
    `).run(
      code.trim().toUpperCase(),
      name.trim(),
      discount_type,
      Number(value),
      Number(min_purchase_amount || 0),
      Number(min_quantity || 0),
      start_date || null,
      end_date || null,
      Number(usage_limit || 0),
      scope || 'whole_subscription',
      scope === 'specific_product' ? Number(product_id) : null,
      req.user.id
    );

    const discount = db.prepare('SELECT * FROM discount_rules WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ message: 'Discount rule created successfully', discount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create discount rule: ' + err.message });
  }
});

// PUT /api/discounts/:id - Admin only
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const {
    name,
    discount_type,
    value,
    min_purchase_amount,
    min_quantity,
    start_date,
    end_date,
    usage_limit,
    scope,
    product_id,
    is_active
  } = req.body;

  const discountId = req.params.id;
  const existing = db.prepare('SELECT * FROM discount_rules WHERE id = ?').get(discountId);
  if (!existing) {
    return res.status(404).json({ error: 'Discount rule not found.' });
  }

  try {
    db.prepare(`
      UPDATE discount_rules
      SET name = ?, discount_type = ?, value = ?, min_purchase_amount = ?,
          min_quantity = ?, start_date = ?, end_date = ?, usage_limit = ?,
          scope = ?, product_id = ?, is_active = ?
      WHERE id = ?
    `).run(
      name || existing.name,
      discount_type || existing.discount_type,
      value !== undefined ? Number(value) : existing.value,
      min_purchase_amount !== undefined ? Number(min_purchase_amount) : existing.min_purchase_amount,
      min_quantity !== undefined ? Number(min_quantity) : existing.min_quantity,
      start_date !== undefined ? start_date : existing.start_date,
      end_date !== undefined ? end_date : existing.end_date,
      usage_limit !== undefined ? Number(usage_limit) : existing.usage_limit,
      scope || existing.scope,
      scope === 'specific_product' ? Number(product_id) : (scope === 'whole_subscription' ? null : existing.product_id),
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      discountId
    );

    const updated = db.prepare('SELECT * FROM discount_rules WHERE id = ?').get(discountId);
    res.json({ message: 'Discount rule updated successfully', discount: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update discount rule: ' + err.message });
  }
});

// DELETE /api/discounts/:id - Admin only
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM discount_rules WHERE id = ?').run(req.params.id);
  res.json({ message: 'Discount rule deleted' });
});

module.exports = router;

