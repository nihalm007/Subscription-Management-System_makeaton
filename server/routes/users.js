const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authenticate, requireAdmin, requireStaffOrAdmin } = require('../middleware/auth');

function validatePassword(password) {
  if (!password || password.length <= 8) {
    return 'Password must be more than 8 characters (at least 9 characters).';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character.';
  }
  return null;
}

// GET /api/users/customers - Staff or Admin can view customers
router.get('/customers', authenticate, requireStaffOrAdmin, (req, res) => {
  const customers = db.prepare(`
    SELECT u.id, u.name, u.email, u.company_name, u.phone, u.address, u.created_at,
           COUNT(DISTINCT s.id) as active_subscriptions_count,
           COALESCE(SUM(CASE WHEN i.status != 'Paid' THEN i.amount_due ELSE 0 END), 0) as outstanding_balance
    FROM users u
    LEFT JOIN subscriptions s ON s.customer_id = u.id AND s.status = 'Active'
    LEFT JOIN invoices i ON i.customer_id = u.id AND i.status != 'Paid'
    WHERE u.role = 'customer'
    GROUP BY u.id
    ORDER BY u.name ASC
  `).all();
  res.json({ customers });
});

// GET /api/users/staff - Admin only: view all staff members
router.get('/staff', authenticate, requireAdmin, (req, res) => {
  const staff = db.prepare(`
    SELECT id, name, email, role, phone, created_at
    FROM users
    WHERE role = 'staff'
    ORDER BY name ASC
  `).all();
  res.json({ staff });
});

// POST /api/users/staff - ONLY Admin can add a new member of staff!
router.post('/staff', authenticate, requireAdmin, (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and temporary password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(400).json({ error: 'A user with this email already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);

  try {
    const info = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES (?, ?, ?, 'staff', ?)
    `).run(name.trim(), normalizedEmail, password_hash, phone || null);

    const newStaff = db.prepare('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ message: 'Staff member added successfully', staff: newStaff });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add staff member: ' + err.message });
  }
});

// POST /api/users/customers - Staff or Admin can add a customer
router.post('/customers', authenticate, requireStaffOrAdmin, (req, res) => {
  const { name, email, password, company_name, phone, address } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const defaultPassword = password || 'BrightLoop2026!';
  const passwordError = validatePassword(defaultPassword);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(400).json({ error: 'A customer with this email already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(defaultPassword, salt);

  try {
    const info = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, company_name, phone, address)
      VALUES (?, ?, ?, 'customer', ?, ?, ?)
    `).run(name.trim(), normalizedEmail, password_hash, company_name || null, phone || null, address || null);

    const customer = db.prepare('SELECT id, name, email, role, company_name, phone, address, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ message: 'Customer registered successfully', customer });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add customer: ' + err.message });
  }
});

module.exports = router;

