const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

function generatePaymentNumber() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM payments').get();
  const nextNum = (countRow.count + 1).toString().padStart(5, '0');
  const year = new Date().getFullYear();
  return `PAY-${year}-${nextNum}`;
}

// GET /api/payments - List payments
router.get('/', authenticate, (req, res) => {
  let query = `
    SELECT p.*, 
           i.invoice_number, i.total_amount as invoice_total,
           u.name as customer_name, u.email as customer_email, u.company_name as customer_company,
           rec.name as recorded_by_name
    FROM payments p
    JOIN invoices i ON i.id = p.invoice_id
    JOIN users u ON u.id = p.customer_id
    LEFT JOIN users rec ON rec.id = p.recorded_by
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'customer') {
    query += ' AND p.customer_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY p.id DESC';

  const payments = db.prepare(query).all(...params);
  res.json({ payments });
});

// POST /api/payments - Record a payment against an invoice
router.post('/', authenticate, (req, res) => {
  const {
    invoice_id,
    amount,
    payment_date,
    payment_method,
    transaction_reference,
    notes
  } = req.body;

  if (!invoice_id || amount === undefined || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invoice ID and a positive payment amount are required.' });
  }

  const validMethods = ['Bank Transfer', 'Credit Card', 'Stripe', 'Cash', 'Check', 'UPI'];
  const method = validMethods.includes(payment_method) ? payment_method : 'Bank Transfer';

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice_id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found.' });
  }

  // If customer is paying, ensure it is their own invoice
  if (req.user.role === 'customer' && invoice.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized. You can only pay your own invoices.' });
  }

  if (invoice.status === 'Cancelled') {
    return res.status(400).json({ error: 'Cannot record payment for a cancelled invoice.' });
  }

  const pAmount = Number(amount);
  const today = payment_date || new Date().toISOString().split('T')[0];
  const payNumber = generatePaymentNumber();

  const transaction = db.transaction(() => {
    // Insert payment
    const info = db.prepare(`
      INSERT INTO payments (
        payment_number, invoice_id, customer_id, amount,
        payment_date, payment_method, transaction_reference,
        notes, recorded_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payNumber,
      invoice.id,
      invoice.customer_id,
      pAmount,
      today,
      method,
      transaction_reference || `REF-${Date.now()}`,
      notes || null,
      req.user.id
    );

    const paymentId = info.lastInsertRowid;

    // Recalculate invoice paid amount
    const totalPaidRow = db.prepare('SELECT COALESCE(SUM(amount), 0) as paid FROM payments WHERE invoice_id = ?').get(invoice.id);
    const totalPaid = totalPaidRow.paid;
    const remainingDue = Math.max(0, invoice.total_amount - totalPaid);
    const newStatus = (remainingDue <= 0.001) ? 'Paid' : 'Confirmed';

    db.prepare(`
      UPDATE invoices
      SET amount_paid = ?, amount_due = ?, status = ?
      WHERE id = ?
    `).run(totalPaid, remainingDue, newStatus, invoice.id);

    return paymentId;
  });

  try {
    const paymentId = transaction();
    const createdPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
    const updatedInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice.id);

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment: createdPayment,
      invoice: updatedInvoice
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record payment: ' + err.message });
  }
});

module.exports = router;

