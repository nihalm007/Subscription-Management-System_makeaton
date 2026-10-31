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

function generateSubNumber() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM subscriptions').get();
  const nextNum = (countRow.count + 1).toString().padStart(5, '0');
  const year = new Date().getFullYear();
  return `SUB-${year}-${nextNum}`;
}

// GET /api/subscriptions - List subscriptions with filtering & search
// Anyone on team can see all subscriptions; customers see only their own.
router.get('/', authenticate, (req, res) => {
  const { status, plan_id, customer_id, search, limit, offset } = req.query;

  let query = `
    SELECT s.*, 
           u.name as customer_name, u.email as customer_email, u.company_name as customer_company,
           p.name as plan_name, p.billing_frequency, p.allow_pause, p.allow_renew, p.allow_close_early, p.auto_close_on_end,
           d.code as discount_code, d.name as discount_name
    FROM subscriptions s
    JOIN users u ON u.id = s.customer_id
    JOIN plans p ON p.id = s.plan_id
    LEFT JOIN discount_rules d ON d.id = s.applied_discount_id
    WHERE 1=1
  `;
  const params = [];

  // Role filtering: Customers see only their own subscriptions!
  if (req.user.role === 'customer') {
    query += ' AND s.customer_id = ?';
    params.push(req.user.id);
  } else if (customer_id) {
    query += ' AND s.customer_id = ?';
    params.push(customer_id);
  }

  if (status && status !== 'all') {
    query += ' AND s.status = ?';
    params.push(status);
  }

  if (plan_id) {
    query += ' AND s.plan_id = ?';
    params.push(plan_id);
  }

  if (search) {
    query += ' AND (s.subscription_number LIKE ? OR u.name LIKE ? OR u.company_name LIKE ?)';
    const sTerm = `%${search}%`;
    params.push(sTerm, sTerm, sTerm);
  }

  query += ' ORDER BY s.id DESC';

  if (limit) {
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset || 0));
  }

  const subscriptions = db.prepare(query).all(...params);

  // Quick count for pagination
  let countQuery = `
    SELECT COUNT(*) as total
    FROM subscriptions s
    JOIN users u ON u.id = s.customer_id
    WHERE 1=1
  `;
  const countParams = [];
  if (req.user.role === 'customer') {
    countQuery += ' AND s.customer_id = ?';
    countParams.push(req.user.id);
  } else if (customer_id) {
    countQuery += ' AND s.customer_id = ?';
    countParams.push(customer_id);
  }
  if (status && status !== 'all') {
    countQuery += ' AND s.status = ?';
    countParams.push(status);
  }
  if (search) {
    countQuery += ' AND (s.subscription_number LIKE ? OR u.name LIKE ? OR u.company_name LIKE ?)';
    const sTerm = `%${search}%`;
    countParams.push(sTerm, sTerm, sTerm);
  }
  const totalCount = db.prepare(countQuery).get(...countParams).total;

  res.json({ subscriptions, total: totalCount });
});

// GET /api/subscriptions/:id - Get subscription details with lines
router.get('/:id', authenticate, (req, res) => {
  let query = `
    SELECT s.*, 
           u.name as customer_name, u.email as customer_email, u.company_name as customer_company, u.phone as customer_phone, u.address as customer_address,
           p.name as plan_name, p.billing_frequency, p.min_quantity as plan_min_quantity,
           p.allow_pause, p.allow_renew, p.allow_close_early, p.auto_close_on_end,
           d.code as discount_code, d.name as discount_name, d.discount_type, d.value as discount_value
    FROM subscriptions s
    JOIN users u ON u.id = s.customer_id
    JOIN plans p ON p.id = s.plan_id
    LEFT JOIN discount_rules d ON d.id = s.applied_discount_id
    WHERE s.id = ?
  `;
  const params = [req.params.id];

  if (req.user.role === 'customer') {
    query += ' AND s.customer_id = ?';
    params.push(req.user.id);
  }

  const subscription = db.prepare(query).get(...params);
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found.' });
  }

  const lines = db.prepare(`
    SELECT sl.*, pr.name as product_name, pr.type as product_type,
           pv.variant_name, pv.price_extra
    FROM subscription_lines sl
    JOIN products pr ON pr.id = sl.product_id
    LEFT JOIN product_variants pv ON pv.id = sl.variant_id
    WHERE sl.subscription_id = ?
  `).all(subscription.id);

  const invoices = db.prepare(`
    SELECT * FROM invoices WHERE subscription_id = ? ORDER BY id DESC
  `).all(subscription.id);

  res.json({ subscription: { ...subscription, lines, invoices } });
});

// POST /api/subscriptions - Create subscription / quote
// Staff or Admin can create for any customer; customers can self-subscribe.
router.post('/', authenticate, (req, res) => {
  const {
    customer_id,
    plan_id,
    template_id,
    start_date,
    expiry_date,
    payment_terms,
    notes,
    applied_discount_code,
    lines,
    status: initialStatus
  } = req.body;

  const targetCustomerId = req.user.role === 'customer' ? req.user.id : customer_id;
  if (!targetCustomerId || !plan_id) {
    return res.status(400).json({ error: 'Customer and Plan are required.' });
  }

  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(plan_id);
  if (!plan) {
    return res.status(404).json({ error: 'Selected plan not found.' });
  }

  const today = new Date().toISOString().split('T')[0];
  const sDate = start_date || today;
  let expDate = expiry_date || null;
  if (!expDate && plan.end_date) {
    expDate = plan.end_date;
  }

  // Calculate total seat count to verify minimum quantity
  let totalQuantity = 0;
  if (Array.isArray(lines)) {
    totalQuantity = lines.reduce((acc, l) => acc + Number(l.quantity || 1), 0);
  }
  if (totalQuantity < plan.min_quantity) {
    return res.status(400).json({
      error: `Plan requires a minimum quantity of ${plan.min_quantity} (you entered ${totalQuantity}).`
    });
  }

  // Check discount code if provided
  let discountRule = null;
  if (applied_discount_code) {
    discountRule = db.prepare(`
      SELECT * FROM discount_rules 
      WHERE code = ? AND is_active = 1
    `).get(applied_discount_code.trim().toUpperCase());

    if (!discountRule) {
      return res.status(400).json({ error: 'Invalid or inactive discount code.' });
    }
    // Check usage limit
    if (discountRule.usage_limit > 0 && discountRule.usage_count >= discountRule.usage_limit) {
      return res.status(400).json({ error: 'Discount code usage limit reached.' });
    }
    // Check dates
    if (discountRule.start_date && today < discountRule.start_date) {
      return res.status(400).json({ error: 'Discount code is not active yet.' });
    }
    if (discountRule.end_date && today > discountRule.end_date) {
      return res.status(400).json({ error: 'Discount code has expired.' });
    }
    // Check minimum quantity condition
    if (discountRule.min_quantity > 0 && totalQuantity < discountRule.min_quantity) {
      return res.status(400).json({
        error: `Discount requires a minimum quantity of ${discountRule.min_quantity} items/seats.`
      });
    }
  }

  const subNumber = generateSubNumber();
  const subStatus = initialStatus || (req.body.from_template ? 'Quotation' : 'Draft');

  const transaction = db.transaction(() => {
    let subtotal = 0;
    let taxTotal = 0;
    let eligibleDiscountBase = 0;

    const processedLines = [];

    if (Array.isArray(lines) && lines.length > 0) {
      for (const line of lines) {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(line.product_id);
        if (!product) continue;

        let unitPrice = Number(line.unit_price !== undefined ? line.unit_price : product.sales_price);
        if (line.variant_id) {
          const variant = db.prepare('SELECT * FROM product_variants WHERE id = ?').get(line.variant_id);
          if (variant) {
            unitPrice += Number(variant.price_extra || 0);
          }
        }

        const qty = Number(line.quantity || 1);
        const lineSubtotal = qty * unitPrice;
        const taxRate = Number(line.tax_rate !== undefined ? line.tax_rate : 10.0); // default tax
        const lineTax = (lineSubtotal * taxRate) / 100;
        const lineTotal = lineSubtotal + lineTax;

        subtotal += lineSubtotal;
        taxTotal += lineTax;

        // Discount scope check
        if (discountRule) {
          if (discountRule.scope === 'whole_subscription') {
            eligibleDiscountBase += lineSubtotal;
          } else if (discountRule.scope === 'specific_product' && discountRule.product_id === product.id) {
            eligibleDiscountBase += lineSubtotal;
          }
        }

        processedLines.push({
          product_id: product.id,
          variant_id: line.variant_id || null,
          description: line.description || product.name,
          quantity: qty,
          unit_price: unitPrice,
          tax_rate: taxRate,
          tax_amount: lineTax,
          subtotal: lineSubtotal,
          line_total: lineTotal
        });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discountRule) {
      // Check min purchase amount
      if (discountRule.min_purchase_amount > 0 && subtotal < discountRule.min_purchase_amount) {
        throw new Error(`Discount requires a minimum purchase amount of ₹${discountRule.min_purchase_amount}`);
      }
      if (discountRule.discount_type === 'percentage') {
        discountAmount = (eligibleDiscountBase * discountRule.value) / 100;
      } else {
        discountAmount = Math.min(discountRule.value, eligibleDiscountBase);
      }
    }

    const totalAmount = Math.max(0, subtotal + taxTotal - discountAmount);

    const nextBillingDate = (subStatus === 'Active') ? addPeriodToDate(sDate, plan.billing_frequency) : null;

    const info = db.prepare(`
      INSERT INTO subscriptions (
        subscription_number, customer_id, plan_id, template_id, status,
        start_date, expiry_date, next_billing_date, payment_terms,
        subtotal, tax_amount, discount_amount, total_amount,
        applied_discount_id, created_by, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      subNumber,
      targetCustomerId,
      plan.id,
      template_id || null,
      subStatus,
      sDate,
      expDate,
      nextBillingDate,
      payment_terms || 'Net 30',
      subtotal,
      taxTotal,
      discountAmount,
      totalAmount,
      discountRule ? discountRule.id : null,
      req.user.id,
      notes || null
    );

    const subscriptionId = info.lastInsertRowid;

    const insertLine = db.prepare(`
      INSERT INTO subscription_lines (
        subscription_id, product_id, variant_id, description,
        quantity, unit_price, tax_rate, tax_amount, subtotal, line_total
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const pl of processedLines) {
      insertLine.run(
        subscriptionId,
        pl.product_id,
        pl.variant_id,
        pl.description,
        pl.quantity,
        pl.unit_price,
        pl.tax_rate,
        pl.tax_amount,
        pl.subtotal,
        pl.line_total
      );
    }

    if (discountRule) {
      db.prepare('UPDATE discount_rules SET usage_count = usage_count + 1 WHERE id = ?').run(discountRule.id);
    }

    return subscriptionId;
  });

  try {
    const subscriptionId = transaction();
    const created = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subscriptionId);
    res.status(201).json({ message: 'Subscription/Quote created successfully', subscription: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// State Machine transitions:
// Draft -> Quotation -> Confirmed -> Active -> Closed

// 1. Move to Quotation
router.post('/:id/move-to-quote', authenticate, requireStaffOrAdmin, (req, res) => {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });
  if (sub.status !== 'Draft') {
    return res.status(400).json({ error: `Cannot move to Quotation from status '${sub.status}'` });
  }

  db.prepare("UPDATE subscriptions SET status = 'Quotation', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(sub.id);
  res.json({ message: 'Moved to Quotation', status: 'Quotation' });
});

// 2. Confirm (Quotation -> Confirmed)
router.post('/:id/confirm', authenticate, (req, res) => {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  // Customer can confirm their quote or staff/admin can confirm
  if (req.user.role === 'customer' && sub.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  if (sub.status !== 'Draft' && sub.status !== 'Quotation') {
    return res.status(400).json({ error: `Cannot confirm subscription in status '${sub.status}'` });
  }

  db.prepare("UPDATE subscriptions SET status = 'Confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(sub.id);
  res.json({ message: 'Quotation confirmed', status: 'Confirmed' });
});

// 3. Activate (Confirmed -> Active)
router.post('/:id/activate', authenticate, (req, res) => {
  const sub = db.prepare('SELECT s.*, p.billing_frequency FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  if (req.user.role === 'customer' && sub.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  if (sub.status !== 'Confirmed') {
    return res.status(400).json({ error: `Cannot activate subscription from status '${sub.status}'. Must be Confirmed first.` });
  }

  const today = new Date().toISOString().split('T')[0];
  const nextBilling = addPeriodToDate(sub.start_date || today, sub.billing_frequency);

  db.prepare(`
    UPDATE subscriptions 
    SET status = 'Active', next_billing_date = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(nextBilling, sub.id);

  res.json({ message: 'Subscription activated', status: 'Active', next_billing_date: nextBilling });
});

// 4. Pause (Active -> Paused) - checks plan.allow_pause!
router.post('/:id/pause', authenticate, (req, res) => {
  const sub = db.prepare('SELECT s.*, p.allow_pause FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  if (req.user.role === 'customer' && sub.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  if (sub.status !== 'Active') {
    return res.status(400).json({ error: `Only active subscriptions can be paused. Current: '${sub.status}'` });
  }

  if (!sub.allow_pause) {
    return res.status(400).json({ error: 'This subscription plan does not allow pausing.' });
  }

  db.prepare("UPDATE subscriptions SET status = 'Paused', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(sub.id);
  res.json({ message: 'Subscription paused', status: 'Paused' });
});

// 5. Resume (Paused -> Active)
router.post('/:id/resume', authenticate, (req, res) => {
  const sub = db.prepare('SELECT s.*, p.billing_frequency FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  if (req.user.role === 'customer' && sub.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  if (sub.status !== 'Paused') {
    return res.status(400).json({ error: `Only paused subscriptions can be resumed. Current: '${sub.status}'` });
  }

  const today = new Date().toISOString().split('T')[0];
  const nextBilling = addPeriodToDate(today, sub.billing_frequency);

  db.prepare("UPDATE subscriptions SET status = 'Active', next_billing_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(nextBilling, sub.id);
  res.json({ message: 'Subscription resumed', status: 'Active', next_billing_date: nextBilling });
});

// 6. Renew - checks plan.allow_renew!
router.post('/:id/renew', authenticate, (req, res) => {
  const sub = db.prepare('SELECT s.*, p.allow_renew, p.billing_frequency FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  if (req.user.role === 'customer' && sub.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  if (!sub.allow_renew) {
    return res.status(400).json({ error: 'This subscription plan does not allow renewals.' });
  }

  const baseDate = sub.expiry_date || new Date().toISOString().split('T')[0];
  const newExpiry = addPeriodToDate(baseDate, sub.billing_frequency);

  db.prepare(`
    UPDATE subscriptions 
    SET status = 'Active', expiry_date = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(newExpiry, sub.id);

  res.json({ message: 'Subscription renewed successfully', status: 'Active', expiry_date: newExpiry });
});

// 7. Close (Active / Paused -> Closed) - checks plan.allow_close_early!
router.post('/:id/close', authenticate, (req, res) => {
  const sub = db.prepare('SELECT s.*, p.allow_close_early FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  if (req.user.role === 'customer' && sub.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  if (sub.status === 'Closed') {
    return res.status(400).json({ error: 'Subscription is already closed.' });
  }

  // If customer is closing early and plan doesn't allow early closure
  if (req.user.role === 'customer' && !sub.allow_close_early) {
    return res.status(400).json({ error: 'This subscription plan does not permit early cancellation.' });
  }

  db.prepare("UPDATE subscriptions SET status = 'Closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(sub.id);
  res.json({ message: 'Subscription closed', status: 'Closed' });
});

module.exports = router;
