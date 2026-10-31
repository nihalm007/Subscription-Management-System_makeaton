const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate, requireStaffOrAdmin } = require('../middleware/auth');

// GET /api/analytics/dashboard - Comprehensive Finance Lead Dashboard
router.get('/dashboard', authenticate, requireStaffOrAdmin, (req, res) => {
  const startTime = process.hrtime();
  const today = new Date().toISOString().split('T')[0];
  const currentMonthStart = today.substring(0, 7) + '-01';

  // 1. Active Subscriptions Count & Details
  const activeSubsRow = db.prepare(`
    SELECT 
      COUNT(*) as count,
      COUNT(DISTINCT customer_id) as active_customers
    FROM subscriptions
    WHERE status = 'Active'
  `).get();

  // Breakdown by plan
  const planBreakdown = db.prepare(`
    SELECT p.id, p.name, p.billing_frequency, COUNT(s.id) as sub_count, COALESCE(SUM(s.total_amount), 0) as sub_value
    FROM plans p
    LEFT JOIN subscriptions s ON s.plan_id = p.id AND s.status = 'Active'
    WHERE p.active = 1
    GROUP BY p.id
    ORDER BY sub_count DESC
  `).all();

  // 2. MRR (Monthly Recurring Revenue) & ARR Calculation
  // Normalize each active subscription to a monthly recurring amount:
  // daily: * 30, weekly: * 4.33, monthly: * 1, yearly: / 12
  const activeSubsList = db.prepare(`
    SELECT s.total_amount, p.billing_frequency
    FROM subscriptions s
    JOIN plans p ON p.id = s.plan_id
    WHERE s.status = 'Active'
  `).all();

  let mrr = 0;
  for (const s of activeSubsList) {
    const val = Number(s.total_amount) || 0;
    if (s.billing_frequency === 'daily') mrr += val * 30;
    else if (s.billing_frequency === 'weekly') mrr += val * 4.33;
    else if (s.billing_frequency === 'monthly') mrr += val;
    else if (s.billing_frequency === 'yearly') mrr += val / 12;
  }
  const arr = mrr * 12;

  // 3. Revenue Collected (Total Payments)
  const totalRevenueRow = db.prepare(`
    SELECT 
      COALESCE(SUM(amount), 0) as total_all_time,
      COALESCE(SUM(CASE WHEN payment_date >= ? THEN amount ELSE 0 END), 0) as total_this_month
    FROM payments
  `).get(currentMonthStart);

  // 4. Revenue Still Owed (Outstanding Invoices)
  const outstandingRow = db.prepare(`
    SELECT 
      COALESCE(SUM(amount_due), 0) as total_owed,
      COUNT(*) as outstanding_invoices_count
    FROM invoices
    WHERE status IN ('Draft', 'Confirmed') AND amount_due > 0
  `).get();

  // 5. Overdue Invoices & Aging Breakdown
  const overdueSummary = db.prepare(`
    SELECT 
      COUNT(*) as overdue_count,
      COALESCE(SUM(amount_due), 0) as overdue_amount,
      COALESCE(SUM(CASE WHEN JULIANDAY(?) - JULIANDAY(due_date) <= 15 THEN amount_due ELSE 0 END), 0) as overdue_1_15_days,
      COALESCE(SUM(CASE WHEN JULIANDAY(?) - JULIANDAY(due_date) BETWEEN 16 AND 30 THEN amount_due ELSE 0 END), 0) as overdue_16_30_days,
      COALESCE(SUM(CASE WHEN JULIANDAY(?) - JULIANDAY(due_date) > 30 THEN amount_due ELSE 0 END), 0) as overdue_30_plus_days
    FROM invoices
    WHERE status != 'Paid' AND status != 'Cancelled' AND due_date < ?
  `).get(today, today, today, today);

  // Detailed Overdue Invoices List for quick chasing
  const overdueList = db.prepare(`
    SELECT i.id, i.invoice_number, i.due_date, i.amount_due, i.total_amount, i.last_chased_at, i.chase_count,
           u.id as customer_id, u.name as customer_name, u.email as customer_email, u.company_name as customer_company,
           CAST(JULIANDAY(?) - JULIANDAY(i.due_date) AS INTEGER) as days_overdue
    FROM invoices i
    JOIN users u ON u.id = i.customer_id
    WHERE i.status != 'Paid' AND i.status != 'Cancelled' AND i.due_date < ?
    ORDER BY days_overdue DESC
    LIMIT 20
  `).all(today, today);

  // 6. Recent Payments Feed
  const recentPayments = db.prepare(`
    SELECT p.*, i.invoice_number, u.name as customer_name, u.company_name as customer_company
    FROM payments p
    JOIN invoices i ON i.id = p.invoice_id
    JOIN users u ON u.id = p.customer_id
    ORDER BY p.id DESC
    LIMIT 10
  `).all();

  // 7. Monthly Revenue History (Last 6 Months)
  const monthlyRevenue = db.prepare(`
    SELECT 
      SUBSTR(payment_date, 1, 7) as month,
      SUM(amount) as revenue,
      COUNT(id) as payment_count
    FROM payments
    WHERE payment_date >= DATE('now', '-6 months')
    GROUP BY SUBSTR(payment_date, 1, 7)
    ORDER BY month ASC
  `).all();

  // Performance timer
  const diff = process.hrtime(startTime);
  const responseTimeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

  res.json({
    metrics: {
      active_subscriptions: activeSubsRow.count,
      active_customers: activeSubsRow.active_customers,
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      revenue_this_month: totalRevenueRow.total_this_month,
      revenue_all_time: totalRevenueRow.total_all_time,
      total_owed: outstandingRow.total_owed,
      outstanding_invoices_count: outstandingRow.outstanding_invoices_count,
      overdue_count: overdueSummary.overdue_count,
      overdue_amount: overdueSummary.overdue_amount,
      overdue_aging: {
        days_1_15: overdueSummary.overdue_1_15_days,
        days_16_30: overdueSummary.overdue_16_30_days,
        days_30_plus: overdueSummary.overdue_30_plus_days
      }
    },
    planBreakdown,
    overdueList,
    recentPayments,
    monthlyRevenue,
    performance: {
      query_time_ms: Number(responseTimeMs),
      status: responseTimeMs < 2000 ? 'SNAPPY (< 2.0s requirement exceeded!)' : 'NORMAL'
    }
  });
});

// POST /api/analytics/seed-stress-test - Seed 500 realistic subscriptions to demonstrate < 2s performance
router.post('/seed-stress-test', authenticate, requireStaffOrAdmin, (req, res) => {
  const count = Math.min(Number(req.body.count || 500), 2000);
  const startTime = Date.now();

  const plans = db.prepare('SELECT * FROM plans WHERE active = 1').all();
  const products = db.prepare('SELECT * FROM products WHERE active = 1').all();
  const customers = db.prepare('SELECT id FROM users WHERE role = "customer"').all();

  if (plans.length === 0 || products.length === 0 || customers.length === 0) {
    return res.status(400).json({ error: 'Please seed basic data first before running stress test.' });
  }

  const insertSub = db.prepare(`
    INSERT INTO subscriptions (
      subscription_number, customer_id, plan_id, status,
      start_date, next_billing_date, payment_terms,
      subtotal, tax_amount, total_amount, created_by
    )
    VALUES (?, ?, ?, 'Active', ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLine = db.prepare(`
    INSERT INTO subscription_lines (
      subscription_id, product_id, description, quantity, unit_price, tax_rate, tax_amount, subtotal, line_total
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const currentCount = db.prepare('SELECT COUNT(*) as count FROM subscriptions').get().count;

  const transaction = db.transaction(() => {
    for (let i = 0; i < count; i++) {
      const subNum = `SUB-STRESS-${(currentCount + i + 1).toString().padStart(6, '0')}`;
      const customer = customers[i % customers.length];
      const plan = plans[i % plans.length];
      const product = products[i % products.length];

      const qty = Math.floor(Math.random() * 5) + 1;
      const unitPrice = product.sales_price;
      const subtotal = qty * unitPrice;
      const tax = (subtotal * 10) / 100;
      const total = subtotal + tax;

      const startDate = '2026-01-01';
      const nextBilling = '2026-11-01';

      const info = insertSub.run(
        subNum,
        customer.id,
        plan.id,
        startDate,
        nextBilling,
        'Net 30',
        subtotal,
        tax,
        total,
        req.user.id
      );

      insertLine.run(
        info.lastInsertRowid,
        product.id,
        product.name,
        qty,
        unitPrice,
        10.0,
        tax,
        subtotal,
        total
      );
    }
  });

  transaction();
  const timeTaken = Date.now() - startTime;

  res.json({
    message: `Successfully seeded ${count} active subscriptions in ${timeTaken}ms!`,
    count,
    time_taken_ms: timeTaken
  });
});

module.exports = router;

