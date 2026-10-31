const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'brightloop.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency & performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'staff', 'customer')),
      company_name TEXT,
      phone TEXT,
      address TEXT,
      reset_token TEXT,
      reset_token_expiry TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Software', 'Add-on', 'Service', 'Physical')),
      sales_price REAL NOT NULL,
      cost_price REAL NOT NULL DEFAULT 0,
      notes TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variant_name TEXT NOT NULL,
      attribute_type TEXT NOT NULL DEFAULT 'brand',
      price_extra REAL NOT NULL DEFAULT 0,
      sku TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      billing_frequency TEXT NOT NULL CHECK(billing_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
      price REAL NOT NULL,
      cost_price REAL NOT NULL DEFAULT 0,
      min_quantity INTEGER NOT NULL DEFAULT 1,
      start_date TEXT,
      end_date TEXT,
      auto_close_on_end INTEGER NOT NULL DEFAULT 0,
      allow_close_early INTEGER NOT NULL DEFAULT 1,
      allow_pause INTEGER NOT NULL DEFAULT 1,
      allow_renew INTEGER NOT NULL DEFAULT 1,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotation_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      plan_id INTEGER REFERENCES plans(id),
      validity_days INTEGER NOT NULL DEFAULT 30,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotation_template_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL REFERENCES quotation_templates(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      variant_id INTEGER REFERENCES product_variants(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      discount_percent REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tax_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rate REAL NOT NULL,
      tax_type TEXT NOT NULL DEFAULT 'percentage',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS discount_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('fixed', 'percentage')),
      value REAL NOT NULL,
      min_purchase_amount REAL DEFAULT 0,
      min_quantity INTEGER DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      usage_limit INTEGER DEFAULT 0,
      usage_count INTEGER DEFAULT 0,
      scope TEXT NOT NULL CHECK(scope IN ('whole_subscription', 'specific_product')),
      product_id INTEGER REFERENCES products(id),
      is_active INTEGER DEFAULT 1,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES users(id),
      plan_id INTEGER NOT NULL REFERENCES plans(id),
      template_id INTEGER REFERENCES quotation_templates(id),
      status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed')),
      start_date TEXT NOT NULL,
      expiry_date TEXT,
      next_billing_date TEXT,
      last_billed_date TEXT,
      payment_terms TEXT NOT NULL DEFAULT 'Net 30',
      subtotal REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      applied_discount_id INTEGER REFERENCES discount_rules(id),
      created_by INTEGER REFERENCES users(id),
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscription_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      variant_id INTEGER REFERENCES product_variants(id),
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      subtotal REAL NOT NULL,
      line_total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
      customer_id INTEGER NOT NULL REFERENCES users(id),
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft', 'Confirmed', 'Paid', 'Cancelled')),
      billing_period_start TEXT,
      billing_period_end TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      discount_notes TEXT,
      total_amount REAL NOT NULL DEFAULT 0,
      amount_paid REAL NOT NULL DEFAULT 0,
      amount_due REAL NOT NULL DEFAULT 0,
      sent_at TEXT,
      last_chased_at TEXT,
      chase_count INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoice_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      variant_id INTEGER REFERENCES product_variants(id),
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      line_total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_number TEXT UNIQUE NOT NULL,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_reference TEXT,
      notes TEXT,
      recorded_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      recipient TEXT,
      subject TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Create Indexes for performance under 2 seconds with thousands of records
    CREATE INDEX IF NOT EXISTS idx_subs_customer ON subscriptions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_subs_next_billing ON subscriptions(next_billing_date);
    CREATE INDEX IF NOT EXISTS idx_inv_customer ON invoices(customer_id);
    CREATE INDEX IF NOT EXISTS idx_inv_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_inv_due_date ON invoices(due_date);
    CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
  `);
}

initDb();

module.exports = db;

