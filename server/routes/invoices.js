const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate, requireStaffOrAdmin } = require('../middleware/auth');

// GET /api/invoices - List invoices with filters
router.get('/', authenticate, (req, res) => {
  const { status, customer_id, overdue, search, limit, offset } = req.query;
  const today = new Date().toISOString().split('T')[0];

  let query = `
    SELECT i.*, 
           u.name as customer_name, u.email as customer_email, u.company_name as customer_company,
           s.subscription_number,
           CASE 
             WHEN i.status != 'Paid' AND i.status != 'Cancelled' AND i.due_date < ? THEN 1 
             ELSE 0 
           END as is_overdue,
           CAST(JULIANDAY(?) - JULIANDAY(i.due_date) AS INTEGER) as days_overdue
    FROM invoices i
    JOIN users u ON u.id = i.customer_id
    LEFT JOIN subscriptions s ON s.id = i.subscription_id
    WHERE 1=1
  `;
  const params = [today, today];

  // Role scoping: Customers see only their own invoices!
  if (req.user.role === 'customer') {
    query += ' AND i.customer_id = ?';
    params.push(req.user.id);
  } else if (customer_id) {
    query += ' AND i.customer_id = ?';
    params.push(customer_id);
  }

  if (status && status !== 'all') {
    if (status === 'Overdue') {
      query += " AND i.status != 'Paid' AND i.status != 'Cancelled' AND i.due_date < ?";
      params.push(today);
    } else {
      query += ' AND i.status = ?';
      params.push(status);
    }
  }

  if (overdue === 'true' || overdue === '1') {
    query += " AND i.status != 'Paid' AND i.status != 'Cancelled' AND i.due_date < ?";
    params.push(today);
  }

  if (search) {
    query += ' AND (i.invoice_number LIKE ? OR u.name LIKE ? OR u.company_name LIKE ?)';
    const sTerm = `%${search}%`;
    params.push(sTerm, sTerm, sTerm);
  }

  query += ' ORDER BY i.id DESC';

  if (limit) {
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset || 0));
  }

  const invoices = db.prepare(query).all(...params);

  // Summary counts
  let countQuery = `
    SELECT 
      COUNT(*) as total_count,
      COALESCE(SUM(CASE WHEN status = 'Paid' THEN total_amount ELSE 0 END), 0) as total_paid,
      COALESCE(SUM(CASE WHEN status != 'Paid' AND status != 'Cancelled' THEN amount_due ELSE 0 END), 0) as total_outstanding,
      COALESCE(SUM(CASE WHEN status != 'Paid' AND status != 'Cancelled' AND due_date < ? THEN amount_due ELSE 0 END), 0) as total_overdue
    FROM invoices
    WHERE 1=1
  `;
  const countParams = [today];
  if (req.user.role === 'customer') {
    countQuery += ' AND customer_id = ?';
    countParams.push(req.user.id);
  } else if (customer_id) {
    countQuery += ' AND customer_id = ?';
    countParams.push(customer_id);
  }
  const summary = db.prepare(countQuery).get(...countParams);

  res.json({ invoices, summary });
});

// GET /api/invoices/:id - Detailed invoice view
router.get('/:id', authenticate, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  let query = `
    SELECT i.*, 
           u.name as customer_name, u.email as customer_email, u.company_name as customer_company,
           u.phone as customer_phone, u.address as customer_address,
           s.subscription_number, p.name as plan_name,
           CASE 
             WHEN i.status != 'Paid' AND i.status != 'Cancelled' AND i.due_date < ? THEN 1 
             ELSE 0 
           END as is_overdue,
           CAST(JULIANDAY(?) - JULIANDAY(i.due_date) AS INTEGER) as days_overdue
    FROM invoices i
    JOIN users u ON u.id = i.customer_id
    LEFT JOIN subscriptions s ON s.id = i.subscription_id
    LEFT JOIN plans p ON p.id = s.plan_id
    WHERE i.id = ?
  `;
  const params = [today, today, req.params.id];

  if (req.user.role === 'customer') {
    query += ' AND i.customer_id = ?';
    params.push(req.user.id);
  }

  const invoice = db.prepare(query).get(...params);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found.' });
  }

  const lines = db.prepare(`
    SELECT il.*, pr.name as product_name, pr.type as product_type,
           pv.variant_name
    FROM invoice_lines il
    LEFT JOIN products pr ON pr.id = il.product_id
    LEFT JOIN product_variants pv ON pv.id = il.variant_id
    WHERE il.invoice_id = ?
  `).all(invoice.id);

  const payments = db.prepare(`
    SELECT p.*, u.name as recorded_by_name
    FROM payments p
    LEFT JOIN users u ON u.id = p.recorded_by
    WHERE p.invoice_id = ?
    ORDER BY p.id DESC
  `).all(invoice.id);

  res.json({ invoice: { ...invoice, lines, payments } });
});

// POST /api/invoices/:id/confirm - Draft -> Confirmed
router.post('/:id/confirm', authenticate, requireStaffOrAdmin, (req, res) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  if (invoice.status !== 'Draft') {
    return res.status(400).json({ error: `Cannot confirm invoice with status '${invoice.status}'` });
  }

  db.prepare("UPDATE invoices SET status = 'Confirmed' WHERE id = ?").run(invoice.id);
  res.json({ message: 'Invoice confirmed', status: 'Confirmed' });
});

// POST /api/invoices/:id/cancel - Cancel invoice
router.post('/:id/cancel', authenticate, requireStaffOrAdmin, (req, res) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  if (invoice.status === 'Paid') {
    return res.status(400).json({ error: 'Cannot cancel an invoice that has already been paid.' });
  }

  db.prepare("UPDATE invoices SET status = 'Cancelled' WHERE id = ?").run(invoice.id);
  res.json({ message: 'Invoice cancelled', status: 'Cancelled' });
});

// POST /api/invoices/:id/send - Send invoice to customer
router.post('/:id/send', authenticate, requireStaffOrAdmin, (req, res) => {
  const invoice = db.prepare(`
    SELECT i.*, u.email as customer_email, u.name as customer_name
    FROM invoices i
    JOIN users u ON u.id = i.customer_id
    WHERE i.id = ?
  `).get(req.params.id);

  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const now = new Date().toISOString();
  db.prepare('UPDATE invoices SET sent_at = ? WHERE id = ?').run(now, invoice.id);

  db.prepare(`
    INSERT INTO audit_logs (type, recipient, subject, details)
    VALUES (?, ?, ?, ?)
  `).run(
    'invoice_sent',
    invoice.customer_email,
    `Invoice ${invoice.invoice_number} from Brightloop Software`,
    `Invoice for ₹${invoice.total_amount.toFixed(2)} dispatched to ${invoice.customer_name}. Due on ${invoice.due_date}.`
  );

  res.json({ message: `Invoice sent to ${invoice.customer_email}`, sent_at: now });
});

// POST /api/invoices/:id/chase - Chase overdue invoice
router.post('/:id/chase', authenticate, requireStaffOrAdmin, (req, res) => {
  const invoice = db.prepare(`
    SELECT i.*, u.email as customer_email, u.name as customer_name
    FROM invoices i
    JOIN users u ON u.id = i.customer_id
    WHERE i.id = ?
  `).get(req.params.id);

  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  if (invoice.status === 'Paid' || invoice.status === 'Cancelled') {
    return res.status(400).json({ error: 'Invoice is not overdue or outstanding.' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE invoices 
    SET last_chased_at = ?, chase_count = COALESCE(chase_count, 0) + 1 
    WHERE id = ?
  `).run(now, invoice.id);

  db.prepare(`
    INSERT INTO audit_logs (type, recipient, subject, details)
    VALUES (?, ?, ?, ?)
  `).run(
    'invoice_chase',
    invoice.customer_email,
    `Urgent: Overdue Payment Reminder for ${invoice.invoice_number}`,
    `Payment reminder sent to ${invoice.customer_name}. Outstanding amount: ₹${invoice.amount_due.toFixed(2)}.`
  );

  res.json({
    message: `Payment reminder chased to ${invoice.customer_email}`,
    last_chased_at: now,
    chase_count: (invoice.chase_count || 0) + 1
  });
});

module.exports = router;
