const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('brightloop_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('brightloop_token', token);
  } else {
    localStorage.removeItem('brightloop_token');
  }
}

export function getStoredUser() {
  const user = localStorage.getItem('brightloop_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('brightloop_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('brightloop_user');
  }
}

export async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => apiRequest('/auth/login', 'POST', { email, password }),
  register: (payload) => apiRequest('/auth/register', 'POST', payload),
  getMe: () => apiRequest('/auth/me'),
  forgotPassword: (email) => apiRequest('/auth/forgot-password', 'POST', { email }),
  resetPassword: (token, password) => apiRequest('/auth/reset-password', 'POST', { token, password }),
  getDemoAccounts: () => apiRequest('/auth/demo-accounts'),

  // Users & Staff
  getCustomers: () => apiRequest('/users/customers'),
  addCustomer: (data) => apiRequest('/users/customers', 'POST', data),
  getStaff: () => apiRequest('/users/staff'),
  addStaff: (data) => apiRequest('/users/staff', 'POST', data),

  // Products
  getProducts: () => apiRequest('/products'),
  getProduct: (id) => apiRequest(`/products/${id}`),
  createProduct: (data) => apiRequest('/products', 'POST', data),
  updateProduct: (id, data) => apiRequest(`/products/${id}`, 'PUT', data),
  deleteProduct: (id) => apiRequest(`/products/${id}`, 'DELETE'),

  // Plans
  getPlans: () => apiRequest('/plans'),
  getPlan: (id) => apiRequest(`/plans/${id}`),
  createPlan: (data) => apiRequest('/plans', 'POST', data),
  updatePlan: (id, data) => apiRequest(`/plans/${id}`, 'PUT', data),
  deletePlan: (id) => apiRequest(`/plans/${id}`, 'DELETE'),

  // Quotation Templates
  getTemplates: () => apiRequest('/quotation-templates'),
  getTemplate: (id) => apiRequest(`/quotation-templates/${id}`),
  createTemplate: (data) => apiRequest('/quotation-templates', 'POST', data),
  deleteTemplate: (id) => apiRequest(`/quotation-templates/${id}`, 'DELETE'),

  // Subscriptions
  getSubscriptions: (params = '') => apiRequest(`/subscriptions${params}`),
  getSubscription: (id) => apiRequest(`/subscriptions/${id}`),
  createSubscription: (data) => apiRequest('/subscriptions', 'POST', data),
  moveToQuote: (id) => apiRequest(`/subscriptions/${id}/move-to-quote`, 'POST'),
  confirmSubscription: (id) => apiRequest(`/subscriptions/${id}/confirm`, 'POST'),
  activateSubscription: (id) => apiRequest(`/subscriptions/${id}/activate`, 'POST'),
  pauseSubscription: (id) => apiRequest(`/subscriptions/${id}/pause`, 'POST'),
  resumeSubscription: (id) => apiRequest(`/subscriptions/${id}/resume`, 'POST'),
  renewSubscription: (id) => apiRequest(`/subscriptions/${id}/renew`, 'POST'),
  closeSubscription: (id) => apiRequest(`/subscriptions/${id}/close`, 'POST'),

  // Invoices & Billing
  getInvoices: (params = '') => apiRequest(`/invoices${params}`),
  getInvoice: (id) => apiRequest(`/invoices/${id}`),
  confirmInvoice: (id) => apiRequest(`/invoices/${id}/confirm`, 'POST'),
  cancelInvoice: (id) => apiRequest(`/invoices/${id}/cancel`, 'POST'),
  sendInvoice: (id) => apiRequest(`/invoices/${id}/send`, 'POST'),
  chaseInvoice: (id) => apiRequest(`/invoices/${id}/chase`, 'POST'),
  getDueBilling: (date) => apiRequest(`/billing/due?date=${date || ''}`),
  runBilling: (date) => apiRequest('/billing/run', 'POST', { date }),
  runSingleBilling: (subId) => apiRequest(`/billing/run-single/${subId}`, 'POST'),

  // Taxes & Discounts
  getTaxes: () => apiRequest('/taxes'),
  createTax: (data) => apiRequest('/taxes', 'POST', data),
  getDiscounts: () => apiRequest('/discounts'),
  createDiscount: (data) => apiRequest('/discounts', 'POST', data),
  deleteDiscount: (id) => apiRequest(`/discounts/${id}`, 'DELETE'),

  // Payments
  getPayments: () => apiRequest('/payments'),
  recordPayment: (data) => apiRequest('/payments', 'POST', data),

  // Analytics & Audits
  getDashboardAnalytics: () => apiRequest('/analytics/dashboard'),
  seedStressTest: (count) => apiRequest('/analytics/seed-stress-test', 'POST', { count }),
  getAuditLogs: () => apiRequest('/audit-logs'),
};

