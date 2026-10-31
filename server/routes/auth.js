const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/database');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

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

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, company_name, phone, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  // Check unique email
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);

  try {
    const info = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, company_name, phone, address)
      VALUES (?, ?, ?, 'customer', ?, ?, ?)
    `).run(name.trim(), normalizedEmail, password_hash, company_name || null, phone || null, address || null);

    const user = db.prepare('SELECT id, name, email, role, company_name, phone, address FROM users WHERE id = ?').get(info.lastInsertRowid);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully',
      user,
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    company_name: user.company_name,
    phone: user.phone,
    address: user.address
  };

  res.json({
    message: 'Login successful',
    user: safeUser,
    token
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

  if (!user) {
    // Return friendly generic message or confirm for security
    return res.status(404).json({ error: 'No account found with this email address.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?')
    .run(token, expiry, user.id);

  const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

  // Log in audit/email logs
  db.prepare(`
    INSERT INTO audit_logs (type, recipient, subject, details)
    VALUES (?, ?, ?, ?)
  `).run(
    'password_reset',
    user.email,
    'Reset your Brightloop Software password',
    `A password reset link was requested. Token: ${token}. Direct URL: ${resetUrl}`
  );

  res.json({
    message: 'A password reset link has been dispatched to your registered email.',
    resetToken: token,
    resetUrl
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  const user = db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token);
  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired password reset link.' });
  }

  if (new Date(user.reset_token_expiry) < new Date()) {
    return res.status(400).json({ error: 'Password reset link has expired. Please request a new one.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);

  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?')
    .run(password_hash, user.id);

  res.json({ message: 'Password has been reset successfully. You can now log in.' });
});

// GET /api/auth/demo-accounts
router.get('/demo-accounts', (req, res) => {
  const accounts = db.prepare(`
    SELECT id, name, email, role, company_name
    FROM users
    WHERE email IN ('admin@brightloop.com', 'sarah.sales@brightloop.com', 'john@acmeshop.com', 'lisa@megacorp.io')
    ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'staff' THEN 2 ELSE 3 END
  `).all();
  res.json({ accounts });
});

module.exports = router;

