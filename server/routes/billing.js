const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate, requireStaffOrAdmin } = require('../middleware/auth');

function addPeriodToDate(dateStr, frequency) {
  const d = new Date(dateStr);
  if (frequency === 'daily') d.setDate(d.getDate() + 1);
  else if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

function calculateDueDate(fromDate, terms) {
  const d = new Date(fromDate);
  if (terms === 'Immediate') {
    return fromDate;
  } else if (terms === 'Net 15') {
    d.setDate(d.getDate() + 15);
  } else if (terms === 'Net 60') {
    d.setDate(d.getDate() + 60);
  } else {
    // Default Net 30
    d.setDate(d.getDate() + 30);
  }
  return d.toISOString().split('T')[0];
}

function generateInvoiceNumber() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM invoices').get();
  const nextNum = (countRow.count + 1).toString().padStart(5, '0');
  const year = new Date().getFullYear();
  return `INV-${year}-${nextNum}`;
}

// Helper: Bill a single subscription
function billSubscription(sub, invoiceDate, dbInstance) {
  const periodStart = sub.last_billed_date || sub.start_date || invoiceDate;
  const periodEnd = addPeriodToDate(periodStart, sub.billing_frequency);
  const dueDate = calculateDueDate(invoiceDate, sub.payment_terms);

  // Prevent duplicate billing for the exact same period
  const existingInvoice = dbInstance.prepare(`
    SELECT id FROM invoices 
    WHERE subscription_id = ? AND billing_period_start = ? AND status != 'Cancelled'
  `).get(sub.id, periodStart);

  if (existingInvoice) {
    return { skipped: true, reason: 'Already billed for this period', subscription_id: sub.id };
  }

  // Get subscription lines
  const lines = dbInstance.prepare(`
    SELECT sl.*, pr.name as product_name
    FROM subscription_lines sl
    JOIN products pr ON pr.id = sl.product_id
    WHERE sl.subscription_id = ?
  `).all(sub.id);

  // Calculate taxes from admin tax rules
  const activeTaxes = dbInstance.prepare('SELECT * FROM tax_rules WHERE is_active = 1').all();
  const defaultTaxRate = activeTaxes.length > 0 ? activeTaxes[0].rate : 10.0;

  let subtotal = 0;
  let taxTotal = 0;
  let processedLines = [];
  let totalQuantity = 0;

  for (const line of lines) {
    const qty = Number(line.quantity || 1);
    totalQuantity += qty;
    const unitPrice = Number(line.unit_price);
    const lineSub = qty * unitPrice;
    const taxRate = Number(line.tax_rate !== undefined ? line.tax_rate : defaultTaxRate);
    const lineTax = (lineSub * taxRate) / 100;

    subtotal += lineSub;
    taxTotal += lineTax;

    processedLines.push({
      product_id: line.product_id,
      variant_id: line.variant_id,
      description: line.description || line.product_name,
      quantity: qty,
      unit_price: unitPrice,
      tax_rate: taxRate,
      tax_amount: lineTax,
      line_total: lineSub + lineTax
    });
  }

  // Check and apply discount rule automatically!
  let discountAmount = 0;
  let discountNotes = '';
  if (sub.applied_discount_id) {
    const discount = dbInstance.prepare('SELECT * FROM discount_rules WHERE id = ?').get(sub.applied_discount_id);
    const today = invoiceDate;

    // Check if discount is still valid (not expired, under usage limit)
    let isDiscountValid = discount && discount.is_active;
    if (isDiscountValid && discount.start_date && today < discount.start_date) isDiscountValid = false;
    if (isDiscountValid && discount.end_date && today > discount.end_date) isDiscountValid = false;
    if (isDiscountValid && discount.usage_limit > 0 && discount.usage_count >= discount.usage_limit) isDiscountValid = false;
    if (isDiscountValid && discount.min_quantity > 0 && totalQuantity < discount.min_quantity) isDiscountValid = false;
    if (isDiscountValid && discount.min_purchase_amount > 0 && subtotal < discount.min_purchase_amount) isDiscountValid = false;

    if (isDiscountValid) {
      let eligibleSubtotal = subtotal;
      if (discount.scope === 'specific_product' && discount.product_id) {
        eligibleSubtotal = lines
          .filter(l => l.product_id === discount.product_id)
          .reduce((sum, l) => sum + (l.quantity * l.unit_price), 0);
      }

      if (discount.discount_type === 'percentage') {
        discountAmount = (eligibleSubtotal * discount.value) / 100;
        discountNotes = `${discount.name} (${discount.value}%)`;
      } else {
        discountAmount = Math.min(discount.value, eligibleSubtotal);
        discountNotes = `${discount.name} (₹${discount.value} off)`;
      }

      // Increment usage count
      dbInstance.prepare('UPDATE discount_rules SET usage_count = usage_count + 1 WHERE id = ?').run(discount.id);
    }
  }

  const totalAmount = Math.max(0, subtotal + taxTotal - discountAmount);
  const invNumber = generateInvoiceNumber();

  // Insert invoice
  const invInfo = dbInstance.prepare(`
    INSERT INTO invoices (
      invoice_number, subscription_id, customer_id, invoice_date, due_date,
      status, billing_period_start, billing_period_end, subtotal, tax_amount,
      discount_amount, discount_notes, total_amount, amount_paid, amount_due, notes
    )
    VALUES (?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    invNumber,
    sub.id,
    sub.customer_id,
    invoiceDate,
    dueDate,
    periodStart,
    periodEnd,
    subtotal,
    taxTotal,
    discountAmount,
    discountNotes,
    totalAmount,
    totalAmount,
    `Recurring billing for ${sub.subscription_number} (${sub.plan_name})`
  );

  const invoiceId = invInfo.lastInsertRowid;

  // Insert invoice lines
  const insertLine = dbInstance.prepare(`
    INSERT INTO invoice_lines (
      invoice_id, product_id, variant_id, description,
      quantity, unit_price, tax_rate, tax_amount, line_total
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const pl of processedLines) {
    insertLine.run(
      invoiceId,
      pl.product_id,
      pl.variant_id,
      pl.description,
      pl.quantity,
      pl.unit_price,
      pl.tax_rate,
      pl.tax_amount,
      pl.line_total
    );
  }

  // Update subscription billing dates
  const nextBilling = addPeriodToDate(invoiceDate, sub.billing_frequency);
  dbInstance.prepare(`
    UPDATE subscriptions
    SET last_billed_date = ?, next_billing_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(invoiceDate, nextBilling, sub.id);

  // Auto-close check if plan has auto_close_on_end and expiry date reached
  if (sub.auto_close_on_end && sub.expiry_date && invoiceDate >= sub.expiry_date) {
    dbInstance.prepare("UPDATE subscriptions SET status = 'Closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(sub.id);
  }

  return {
    skipped: false,
    invoice_id: invoiceId,
    invoice_number: invNumber,
    customer_id: sub.customer_id,
    amount: totalAmount,
    subscription_number: sub.subscription_number
  };
}

// GET /api/billing/due - Preview subscriptions due for billing
router.get('/due', authenticate, requireStaffOrAdmin, (req, res) => {
  const targetDate = req.query.date || new Date().toISOString().split('T')[0];

  const dueSubscriptions = db.prepare(`
    SELECT s.*, 
           u.name as customer_name, u.email as customer_email, u.company_name as customer_company,
           p.name as plan_name, p.billing_frequency, p.auto_close_on_end
    FROM subscriptions s
    JOIN users u ON u.id = s.customer_id
    JOIN plans p ON p.id = s.plan_id
    WHERE s.status = 'Active'
      AND (s.next_billing_date IS NULL OR s.next_billing_date <= ?)
    ORDER BY s.next_billing_date ASC
  `).all(targetDate);

  res.json({ targetDate, count: dueSubscriptions.length, subscriptions: dueSubscriptions });
});

// POST /api/billing/run - Execute Billing Day batch
router.post('/run', authenticate, requireStaffOrAdmin, (req, res) => {
  const targetDate = req.body.date || new Date().toISOString().split('T')[0];

  const dueSubscriptions = db.prepare(`
    SELECT s.*, 
           u.name as customer_name, u.email as customer_email, u.company_name as customer_company,
           p.name as plan_name, p.billing_frequency, p.auto_close_on_end
    FROM subscriptions s
    JOIN users u ON u.id = s.customer_id
    JOIN plans p ON p.id = s.plan_id
    WHERE s.status = 'Active'
      AND (s.next_billing_date IS NULL OR s.next_billing_date <= ?)
  `).all(targetDate);

  if (dueSubscriptions.length === 0) {
    return res.json({
      message: 'No subscriptions are due for billing on ' + targetDate,
      processed_count: 0,
      invoices_created: 0,
      total_amount: 0,
      invoices: []
    });
  }

  const results = [];
  let totalBilled = 0;

  const runBatch = db.transaction(() => {
    for (const sub of dueSubscriptions) {
      const result = billSubscription(sub, targetDate, db);
      if (!result.skipped) {
        results.push(result);
        totalBilled += result.amount;
      }
    }
  });

  try {
    runBatch();

    // Log the billing run in audit logs
    db.prepare(`
      INSERT INTO audit_logs (type, recipient, subject, details)
      VALUES (?, ?, ?, ?)
    `).run(
      'billing_run',
      req.user.email,
      `Billing Run Executed for ${targetDate}`,
      `Generated ${results.length} invoices totaling ₹${totalBilled.toFixed(2)}.`
    );

    res.json({
      message: `Billing run complete! Generated ${results.length} invoices totaling ₹${totalBilled.toFixed(2)}.`,
      targetDate,
      processed_count: dueSubscriptions.length,
      invoices_created: results.length,
      total_amount: totalBilled,
      invoices: results
    });
  } catch (err) {
    res.status(500).json({ error: 'Billing run failed: ' + err.message });
  }
});

// POST /api/billing/run-single/:id - Generate invoice on demand for one subscription
router.post('/run-single/:id', authenticate, requireStaffOrAdmin, (req, res) => {
  const sub = db.prepare(`
    SELECT s.*, 
           u.name as customer_name, u.email as customer_email, u.company_name as customer_company,
           p.name as plan_name, p.billing_frequency, p.auto_close_on_end
    FROM subscriptions s
    JOIN users u ON u.id = s.customer_id
    JOIN plans p ON p.id = s.plan_id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!sub) {
    return res.status(404).json({ error: 'Subscription not found.' });
  }

  const today = new Date().toISOString().split('T')[0];

  const transaction = db.transaction(() => {
    return billSubscription(sub, today, db);
  });

  try {
    const result = transaction();
    if (result.skipped) {
      return res.status(400).json({ error: result.reason });
    }
    const createdInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(result.invoice_id);
    res.status(201).json({ message: 'Invoice generated successfully', invoice: createdInvoice });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate invoice: ' + err.message });
  }
});

module.exports = router;
