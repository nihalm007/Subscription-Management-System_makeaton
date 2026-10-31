const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate, requireStaffOrAdmin } = require('../middleware/auth');

// GET /api/quotation-templates
router.get('/', authenticate, (req, res) => {
  const templates = db.prepare(`
    SELECT t.*, p.name as plan_name, p.billing_frequency, p.price as plan_price
    FROM quotation_templates t
    LEFT JOIN plans p ON p.id = t.plan_id
    ORDER BY t.id DESC
  `).all();

  const getLines = db.prepare(`
    SELECT ql.*, pr.name as product_name, pr.type as product_type,
           pv.variant_name, pv.price_extra
    FROM quotation_template_lines ql
    JOIN products pr ON pr.id = ql.product_id
    LEFT JOIN product_variants pv ON pv.id = ql.variant_id
    WHERE ql.template_id = ?
  `);

  const enriched = templates.map(t => ({
    ...t,
    lines: getLines.all(t.id)
  }));

  res.json({ templates: enriched });
});

// GET /api/quotation-templates/:id
router.get('/:id', authenticate, (req, res) => {
  const template = db.prepare(`
    SELECT t.*, p.name as plan_name, p.billing_frequency, p.price as plan_price
    FROM quotation_templates t
    LEFT JOIN plans p ON p.id = t.plan_id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!template) {
    return res.status(404).json({ error: 'Quotation template not found.' });
  }

  const lines = db.prepare(`
    SELECT ql.*, pr.name as product_name, pr.type as product_type,
           pv.variant_name, pv.price_extra
    FROM quotation_template_lines ql
    JOIN products pr ON pr.id = ql.product_id
    LEFT JOIN product_variants pv ON pv.id = ql.variant_id
    WHERE ql.template_id = ?
  `).all(template.id);

  res.json({ template: { ...template, lines } });
});

// POST /api/quotation-templates - Staff or Admin can create templates
router.post('/', authenticate, requireStaffOrAdmin, (req, res) => {
  const { name, plan_id, validity_days, notes, lines } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Template name is required.' });
  }

  const transaction = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO quotation_templates (name, plan_id, validity_days, notes)
      VALUES (?, ?, ?, ?)
    `).run(name.trim(), plan_id || null, Number(validity_days || 30), notes || null);

    const templateId = info.lastInsertRowid;

    if (Array.isArray(lines)) {
      const insertLine = db.prepare(`
        INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, unit_price, discount_percent)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const line of lines) {
        if (line.product_id) {
          insertLine.run(
            templateId,
            line.product_id,
            line.variant_id || null,
            Number(line.quantity || 1),
            Number(line.unit_price || 0),
            Number(line.discount_percent || 0)
          );
        }
      }
    }

    return templateId;
  });

  try {
    const templateId = transaction();
    res.status(201).json({ message: 'Quotation template created', templateId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create quotation template: ' + err.message });
  }
});

// DELETE /api/quotation-templates/:id
router.delete('/:id', authenticate, requireStaffOrAdmin, (req, res) => {
  db.prepare('DELETE FROM quotation_templates WHERE id = ?').run(req.params.id);
  res.json({ message: 'Quotation template deleted' });
});

module.exports = router;

