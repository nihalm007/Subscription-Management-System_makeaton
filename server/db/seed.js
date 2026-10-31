const bcrypt = require('bcryptjs');
const db = require('./database');

function seed() {
  console.log('--- Seeding Brightloop Software Database ---');

  // Clear existing data in reverse dependency order
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM payments;
    DELETE FROM invoice_lines;
    DELETE FROM invoices;
    DELETE FROM subscription_lines;
    DELETE FROM subscriptions;
    DELETE FROM quotation_template_lines;
    DELETE FROM quotation_templates;
    DELETE FROM discount_rules;
    DELETE FROM tax_rules;
    DELETE FROM product_variants;
    DELETE FROM products;
    DELETE FROM plans;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);

  const salt = bcrypt.genSaltSync(10);
  const defaultPassword = 'BrightLoop2026!'; // Meets all criteria (>8 chars, uppercase, lowercase, special char)
  const passwordHash = bcrypt.hashSync(defaultPassword, salt);

  // 1. Seed Users (Admin, Staff, Customers)
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, company_name, phone, address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const adminId = insertUser.run(
    'Admin Brightloop',
    'admin@brightloop.com',
    passwordHash,
    'admin',
    'Brightloop Software Inc.',
    '+1 (555) 019-2834',
    '100 Tech Boulevard, Suite 400, San Francisco, CA'
  ).lastInsertRowid;

  const staff1Id = insertUser.run(
    'Sarah Jenkins (Sales Rep)',
    'sarah.sales@brightloop.com',
    passwordHash,
    'staff',
    'Brightloop Software Inc.',
    '+1 (555) 019-5821',
    '100 Tech Boulevard, Suite 400, San Francisco, CA'
  ).lastInsertRowid;

  const staff2Id = insertUser.run(
    'Tom Davies (Billing Lead)',
    'tom.support@brightloop.com',
    passwordHash,
    'staff',
    'Brightloop Software Inc.',
    '+1 (555) 019-7492',
    '100 Tech Boulevard, Suite 400, San Francisco, CA'
  ).lastInsertRowid;

  const cust1Id = insertUser.run(
    'John Smith',
    'john@acmeshop.com',
    passwordHash,
    'customer',
    'Acme Retail Shop',
    '+1 (555) 321-4820',
    '45 Market Street, Portland, OR'
  ).lastInsertRowid;

  const cust2Id = insertUser.run(
    'Lisa Wong',
    'lisa@megacorp.io',
    passwordHash,
    'customer',
    'MegaCorp International',
    '+1 (555) 789-1122',
    '1 Infinite Loop, Cupertino, CA'
  ).lastInsertRowid;

  const cust3Id = insertUser.run(
    'David Miller',
    'david@apextech.com',
    passwordHash,
    'customer',
    'Apex Technologies',
    '+1 (555) 432-8877',
    '88 Innovation Parkway, Austin, TX'
  ).lastInsertRowid;

  console.log('✓ Seeded Users (Admin, Staff, Customers)');

  // 2. Seed Products & Variants (with Odoo Brand +₹560 variant)
  const insertProduct = db.prepare(`
    INSERT INTO products (name, type, sales_price, cost_price, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertVariant = db.prepare(`
    INSERT INTO product_variants (product_id, variant_name, attribute_type, price_extra, sku)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Product 1: BrightDesk Core CRM
  const prod1Id = insertProduct.run(
    'BrightDesk Core CRM',
    'Software',
    120.00,
    35.00,
    'Unified CRM, customer pipelines, and contact automation platform.'
  ).lastInsertRowid;

  insertVariant.run(prod1Id, 'Standard Edition', 'brand', 0.00, 'BD-STD');
  const odooVariantId = insertVariant.run(prod1Id, 'Odoo Brand Edition', 'brand', 560.00, 'BD-ODOO').lastInsertRowid; // Prompt requirement: Odoo brand adds 560!
  insertVariant.run(prod1Id, 'Enterprise White-Label', 'brand', 850.00, 'BD-WHL');

  // Product 2: Cloud Analytics Pro
  const prod2Id = insertProduct.run(
    'Cloud Analytics Pro',
    'Software',
    350.00,
    90.00,
    'Deep cohort metrics, executive dashboards, and churn prediction engine.'
  ).lastInsertRowid;

  insertVariant.run(prod2Id, 'Multi-Tenant Cloud', 'tier', 0.00, 'CAP-MT');
  insertVariant.run(prod2Id, 'Dedicated Isolated Instance', 'tier', 250.00, 'CAP-DED');

  // Product 3: Priority 24/7 SLA Support
  const prod3Id = insertProduct.run(
    'Priority 24/7 SLA Support',
    'Add-on',
    150.00,
    45.00,
    'Dedicated Slack channel, 15-minute SLA guarantee and phone dispatch.'
  ).lastInsertRowid;

  // Product 4: Custom Brand Portal Add-on
  const prod4Id = insertProduct.run(
    'Custom Brand Portal Add-on',
    'Add-on',
    80.00,
    20.00,
    'Custom domain, whitelabeled client portal with custom themes.'
  ).lastInsertRowid;

  // Product 5: Implementation Consulting
  const prod5Id = insertProduct.run(
    'Enterprise Implementation Consulting',
    'Service',
    1200.00,
    500.00,
    'Turnkey onboarding, legacy spreadsheet data migration, and team training.'
  ).lastInsertRowid;

  console.log('✓ Seeded Products & Variants (including Odoo Brand +₹560)');

  // 3. Seed Plans (daily, weekly, monthly, yearly with lifecycle flags)
  const insertPlan = db.prepare(`
    INSERT INTO plans (
      name, billing_frequency, price, cost_price, min_quantity,
      start_date, end_date, auto_close_on_end, allow_close_early,
      allow_pause, allow_renew
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const planMonthlyId = insertPlan.run(
    'Monthly Business Plan',
    'monthly',
    199.00,
    40.00,
    1,
    '2026-01-01',
    '2028-12-31',
    0, // auto close
    1, // allow close early
    1, // allow pause
    1  // allow renew
  ).lastInsertRowid;

  const planYearlyId = insertPlan.run(
    'Yearly Enterprise Contract',
    'yearly',
    2190.00,
    400.00,
    5, // requires at least 5 seats!
    '2026-01-01',
    '2027-12-31',
    1, // auto close on end
    0, // cannot close early without penalty
    1, // allow pause
    1  // allow renew
  ).lastInsertRowid;

  const planWeeklyId = insertPlan.run(
    'Weekly Starter Flex',
    'weekly',
    59.00,
    15.00,
    1,
    '2026-01-01',
    '2028-12-31',
    0,
    1,
    0, // pause not allowed
    1
  ).lastInsertRowid;

  const planDailyId = insertPlan.run(
    'Daily High-Volume Flex',
    'daily',
    15.00,
    3.00,
    10, // requires min 10
    '2026-01-01',
    '2026-12-31',
    1, // auto close on end
    1,
    0,
    0
  ).lastInsertRowid;

  console.log('✓ Seeded Plans (Daily, Weekly, Monthly, Yearly with rules)');

  // 4. Seed Tax Rules
  const insertTax = db.prepare(`
    INSERT INTO tax_rules (name, rate, tax_type, is_active)
    VALUES (?, ?, ?, 1)
  `);

  insertTax.run('Standard VAT 10%', 10.00, 'percentage');
  insertTax.run('US Sales Tax 8.25%', 8.25, 'percentage');
  insertTax.run('GST 18%', 18.00, 'percentage');

  console.log('✓ Seeded Tax Rules');

  // 5. Seed Discount Rules (Admin only feature)
  const insertDiscount = db.prepare(`
    INSERT INTO discount_rules (
      code, name, discount_type, value, min_purchase_amount,
      min_quantity, start_date, end_date, usage_limit, usage_count,
      scope, product_id, is_active, created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1, ?)
  `);

  const discountSeatsId = insertDiscount.run(
    'SEATS100',
    'High Volume Seats Discount (₹100 Off)',
    'fixed',
    100.00,
    0,
    5, // Min 5 seats
    '2026-01-01',
    '2027-12-31',
    50,
    'whole_subscription',
    null,
    adminId
  ).lastInsertRowid;

  const discountEnterpriseId = insertDiscount.run(
    'ENTERPRISE20',
    'Enterprise Contract 20% Off',
    'percentage',
    20.00,
    1000.00, // Min purchase $1000
    0,
    '2026-01-01',
    '2027-12-31',
    30,
    'whole_subscription',
    null,
    adminId
  ).lastInsertRowid;

  const discountOdooId = insertDiscount.run(
    'ODOOPROMO',
    'Odoo Edition Special Launch 15%',
    'percentage',
    15.00,
    0,
    0,
    '2026-01-01',
    '2027-12-31',
    25,
    'specific_product',
    prod1Id,
    adminId
  ).lastInsertRowid;

  console.log('✓ Seeded Discount Rules');

  // 6. Seed Quotation Templates
  const insertTemplate = db.prepare(`
    INSERT INTO quotation_templates (name, plan_id, validity_days, notes)
    VALUES (?, ?, ?, ?)
  `);

  const insertTemplateLine = db.prepare(`
    INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, unit_price)
    VALUES (?, ?, ?, ?, ?)
  `);

  const tmpl1Id = insertTemplate.run(
    'Enterprise SaaS Suite Offer',
    planYearlyId,
    30,
    'Turnkey enterprise quotation template with Odoo Brand CRM, Analytics, and 24/7 SLA.'
  ).lastInsertRowid;

  insertTemplateLine.run(tmpl1Id, prod1Id, odooVariantId, 10, 680.00); // 120 + 560
  insertTemplateLine.run(tmpl1Id, prod2Id, null, 1, 350.00);
  insertTemplateLine.run(tmpl1Id, prod3Id, null, 1, 150.00);

  const tmpl2Id = insertTemplate.run(
    'Standard SMB Growth Package',
    planMonthlyId,
    15,
    'Ready-to-go monthly package for growing small businesses.'
  ).lastInsertRowid;

  insertTemplateLine.run(tmpl2Id, prod1Id, null, 3, 120.00);
  insertTemplateLine.run(tmpl2Id, prod4Id, null, 1, 80.00);

  console.log('✓ Seeded Quotation Templates');

  // 7. Seed Subscriptions
  const insertSub = db.prepare(`
    INSERT INTO subscriptions (
      subscription_number, customer_id, plan_id, template_id, status,
      start_date, expiry_date, next_billing_date, last_billed_date,
      payment_terms, subtotal, tax_amount, discount_amount, total_amount,
      applied_discount_id, created_by, notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSubLine = db.prepare(`
    INSERT INTO subscription_lines (
      subscription_id, product_id, variant_id, description,
      quantity, unit_price, tax_rate, tax_amount, subtotal, line_total
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Sub 1: Active Monthly for John (Acme)
  const sub1Id = insertSub.run(
    'SUB-2026-00001',
    cust1Id,
    planMonthlyId,
    tmpl2Id,
    'Active',
    '2026-09-01',
    '2027-09-01',
    '2026-11-01',
    '2026-10-01',
    'Net 15',
    440.00,
    44.00,
    0,
    484.00,
    null,
    staff1Id,
    'Acme 3-seat monthly CRM subscription'
  ).lastInsertRowid;

  insertSubLine.run(sub1Id, prod1Id, null, 'BrightDesk Core CRM (Standard)', 3, 120.00, 10.0, 36.0, 360.00, 396.00);
  insertSubLine.run(sub1Id, prod4Id, null, 'Custom Brand Portal Add-on', 1, 80.00, 10.0, 8.0, 80.00, 88.00);

  // Sub 2: Active Yearly Enterprise for Lisa (MegaCorp) with Odoo Brand
  const sub2Id = insertSub.run(
    'SUB-2026-00002',
    cust2Id,
    planYearlyId,
    tmpl1Id,
    'Active',
    '2026-01-15',
    '2027-01-15',
    '2027-01-15',
    '2026-01-15',
    'Net 30',
    7300.00,
    730.00,
    1460.00, // 20% discount applied
    6570.00,
    discountEnterpriseId, // ENTERPRISE20 discount
    adminId,
    'MegaCorp 10-seat Enterprise agreement with Odoo Brand edition'
  ).lastInsertRowid;

  insertSubLine.run(sub2Id, prod1Id, odooVariantId, 'BrightDesk Core CRM (Odoo Brand Edition +₹560)', 10, 680.00, 10.0, 680.0, 6800.00, 7480.00);
  insertSubLine.run(sub2Id, prod3Id, null, 'Priority 24/7 SLA Support', 1, 150.00, 10.0, 15.0, 150.00, 165.00);
  insertSubLine.run(sub2Id, prod2Id, null, 'Cloud Analytics Pro', 1, 350.00, 10.0, 35.0, 350.00, 385.00);

  // Sub 3: Paused Monthly for David (Apex)
  const sub3Id = insertSub.run(
    'SUB-2026-00003',
    cust3Id,
    planMonthlyId,
    null,
    'Paused',
    '2026-06-01',
    '2027-06-01',
    '2026-11-15',
    '2026-09-01',
    'Net 30',
    350.00,
    35.00,
    0,
    385.00,
    null,
    staff1Id,
    'Customer paused during system migration'
  ).lastInsertRowid;

  insertSubLine.run(sub3Id, prod2Id, null, 'Cloud Analytics Pro', 1, 350.00, 10.0, 35.0, 350.00, 385.00);

  // Sub 4: Quotation for John (Acme)
  const sub4Id = insertSub.run(
    'SUB-2026-00004',
    cust1Id,
    planYearlyId,
    null,
    'Quotation',
    '2026-11-01',
    '2027-11-01',
    null,
    null,
    'Net 30',
    3400.00,
    340.00,
    100.00,
    3640.00,
    discountSeatsId, // SEATS100 discount
    staff1Id,
    'Upcoming proposal for Acme expansion'
  ).lastInsertRowid;

  insertSubLine.run(sub4Id, prod1Id, null, 'BrightDesk Core CRM', 5, 120.00, 10.0, 60.0, 600.00, 660.00);
  insertSubLine.run(sub4Id, prod5Id, null, 'Enterprise Implementation Consulting', 1, 1200.00, 10.0, 120.0, 1200.00, 1320.00);

  // Sub 5: Confirmed for David (Apex)
  insertSub.run(
    'SUB-2026-00005',
    cust3Id,
    planWeeklyId,
    null,
    'Confirmed',
    '2026-11-01',
    '2027-05-01',
    null,
    null,
    'Net 15',
    200.00,
    20.00,
    0,
    220.00,
    null,
    staff2Id,
    'Confirmed agreement ready for activation'
  );

  console.log('✓ Seeded Subscriptions across Draft, Quotation, Confirmed, Active, Paused');

  // 8. Seed Invoices & Payments (including Paid, Confirmed, and Overdue)
  const insertInvoice = db.prepare(`
    INSERT INTO invoices (
      invoice_number, subscription_id, customer_id, invoice_date, due_date,
      status, billing_period_start, billing_period_end, subtotal, tax_amount,
      discount_amount, discount_notes, total_amount, amount_paid, amount_due,
      sent_at, last_chased_at, chase_count, notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertInvLine = db.prepare(`
    INSERT INTO invoice_lines (
      invoice_id, product_id, variant_id, description, quantity, unit_price, tax_rate, tax_amount, line_total
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPayment = db.prepare(`
    INSERT INTO payments (
      payment_number, invoice_id, customer_id, amount, payment_date, payment_method, transaction_reference, notes, recorded_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Invoice 1: Paid Invoice for John (Acme)
  const inv1Id = insertInvoice.run(
    'INV-2026-00001',
    sub1Id,
    cust1Id,
    '2026-09-01',
    '2026-09-15',
    'Paid',
    '2026-09-01',
    '2026-10-01',
    440.00,
    44.00,
    0,
    null,
    484.00,
    484.00,
    0.00,
    '2026-09-01T10:00:00Z',
    null,
    0,
    'Initial subscription billing for September'
  ).lastInsertRowid;

  insertInvLine.run(inv1Id, prod1Id, null, 'BrightDesk Core CRM (Standard)', 3, 120.00, 10.0, 36.0, 396.00);
  insertInvLine.run(inv1Id, prod4Id, null, 'Custom Brand Portal Add-on', 1, 80.00, 10.0, 8.0, 88.00);

  insertPayment.run(
    'PAY-2026-00001',
    inv1Id,
    cust1Id,
    484.00,
    '2026-09-05',
    'Credit Card',
    'CC-ACME-9021',
    'Full payment settled via customer portal',
    cust1Id
  );

  // Invoice 2: Paid Annual Invoice for MegaCorp
  const inv2Id = insertInvoice.run(
    'INV-2026-00002',
    sub2Id,
    cust2Id,
    '2026-01-15',
    '2026-02-15',
    'Paid',
    '2026-01-15',
    '2027-01-15',
    7300.00,
    730.00,
    1460.00,
    'Enterprise Contract 20% Off',
    6570.00,
    6570.00,
    0.00,
    '2026-01-15T14:30:00Z',
    null,
    0,
    'Annual enterprise contract billing'
  ).lastInsertRowid;

  insertInvLine.run(inv2Id, prod1Id, odooVariantId, 'BrightDesk Core CRM (Odoo Brand Edition +₹560)', 10, 680.00, 10.0, 680.0, 7480.00);
  insertInvLine.run(inv2Id, prod3Id, null, 'Priority 24/7 SLA Support', 1, 150.00, 10.0, 15.0, 165.00);

  insertPayment.run(
    'PAY-2026-00002',
    inv2Id,
    cust2Id,
    6570.00,
    '2026-01-20',
    'Bank Transfer',
    'WIRE-MC-20260120',
    'Wire transfer matched from bank statement',
    staff2Id
  );

  // Invoice 3: OVERDUE Invoice for John (Acme) - due Oct 15!
  const inv3Id = insertInvoice.run(
    'INV-2026-00003',
    sub1Id,
    cust1Id,
    '2026-10-01',
    '2026-10-15',
    'Confirmed',
    '2026-10-01',
    '2026-11-01',
    440.00,
    44.00,
    0,
    null,
    484.00,
    0.00,
    484.00,
    '2026-10-01T09:15:00Z',
    '2026-10-25T11:00:00Z',
    1,
    'October monthly renewal - Overdue'
  ).lastInsertRowid;

  insertInvLine.run(inv3Id, prod1Id, null, 'BrightDesk Core CRM (Standard)', 3, 120.00, 10.0, 36.0, 396.00);
  insertInvLine.run(inv3Id, prod4Id, null, 'Custom Brand Portal Add-on', 1, 80.00, 10.0, 8.0, 88.00);

  // Invoice 4: Another Overdue Invoice for David (Apex) - due Oct 10!
  const inv4Id = insertInvoice.run(
    'INV-2026-00004',
    sub3Id,
    cust3Id,
    '2026-09-10',
    '2026-10-10',
    'Confirmed',
    '2026-09-10',
    '2026-10-10',
    350.00,
    35.00,
    0,
    null,
    385.00,
    100.00, // Partial payment
    285.00, // Outstanding balance!
    '2026-09-10T16:00:00Z',
    '2026-10-22T09:00:00Z',
    2,
    'Cloud Analytics September term - partially paid & overdue'
  ).lastInsertRowid;

  insertInvLine.run(inv4Id, prod2Id, null, 'Cloud Analytics Pro', 1, 350.00, 10.0, 35.0, 385.00);

  insertPayment.run(
    'PAY-2026-00003',
    inv4Id,
    cust3Id,
    100.00,
    '2026-09-28',
    'Stripe',
    'STRIPE_CH_98231',
    'Partial deposit payment',
    cust3Id
  );

  // Invoice 5: Draft Invoice
  const inv5Id = insertInvoice.run(
    'INV-2026-00005',
    sub1Id,
    cust1Id,
    '2026-10-31',
    '2026-11-15',
    'Draft',
    '2026-11-01',
    '2026-12-01',
    440.00,
    44.00,
    0,
    null,
    484.00,
    0.00,
    484.00,
    null,
    null,
    0,
    'November billing generated in advance'
  ).lastInsertRowid;

  insertInvLine.run(inv5Id, prod1Id, null, 'BrightDesk Core CRM (Standard)', 3, 120.00, 10.0, 36.0, 396.00);

  // Seed sample audit log
  db.prepare(`
    INSERT INTO audit_logs (type, recipient, subject, details)
    VALUES (?, ?, ?, ?)
  `).run(
    'invoice_sent',
    'john@acmeshop.com',
    'Invoice INV-2026-00003 from Brightloop Software',
    'Dispatched recurring monthly invoice for ₹484.00'
  );

  console.log('✓ Seeded Invoices & Payments (with Overdue aging, partial payments, and full audit trail)');
  console.log('--- Database seeding completed successfully! ---');
}

seed();
