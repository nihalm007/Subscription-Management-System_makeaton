const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const planRoutes = require('./routes/plans');
const taxRoutes = require('./routes/taxes');
const discountRoutes = require('./routes/discounts');
const quotationTemplateRoutes = require('./routes/quotationTemplates');
const subscriptionRoutes = require('./routes/subscriptions');
const billingRoutes = require('./routes/billing');
const invoiceRoutes = require('./routes/invoices');
const paymentRoutes = require('./routes/payments');
const analyticsRoutes = require('./routes/analytics');
const auditLogRoutes = require('./routes/auditLogs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/quotation-templates', quotationTemplateRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Brightloop Subscription Management System',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend in production
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// Express 5 compatible SPA fallback
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send('Brightloop API running. Build frontend for UI.');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` Brightloop Subscription Management System Server`);
    console.log(` Running on: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
