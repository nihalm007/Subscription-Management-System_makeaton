import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { formatINR } from '../utils/format';
import {
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Play,
  Pause,
  RotateCw,
  XCircle,
  ArrowRight,
  FileText,
  DollarSign,
  Calendar,
  Sparkles,
  Info,
  Clock,
  Eye
} from 'lucide-react';

export default function Subscriptions({ onSelectInvoice }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [notice, setNotice] = useState(null);

  // Form data for creating subscription
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [products, setProducts] = useState([]);

  const [formCustomer, setFormCustomer] = useState('');
  const [formPlan, setFormPlan] = useState('');
  const [formTemplate, setFormTemplate] = useState('');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formPaymentTerms, setFormPaymentTerms] = useState('Net 30');
  const [formDiscountCode, setFormDiscountCode] = useState('');
  const [formLines, setFormLines] = useState([
    { product_id: '', variant_id: '', quantity: 1, unit_price: 0, tax_rate: 10 }
  ]);
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = `?status=${statusFilter}&search=${encodeURIComponent(search)}`;
      const res = await api.getSubscriptions(params);
      setSubscriptions(res.subscriptions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [cRes, pRes, tRes, prRes] = await Promise.all([
        api.getCustomers(),
        api.getPlans(),
        api.getTemplates(),
        api.getProducts()
      ]);
      setCustomers(cRes.customers || []);
      setPlans(pRes.plans || []);
      setTemplates(tRes.templates || []);
      setProducts(prRes.products || []);
    } catch (err) {
      console.error('Failed to load dependencies', err);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter, search]);

  useEffect(() => {
    loadDependencies();
  }, []);

  const handleApplyTemplate = (tmplId) => {
    const tmpl = templates.find(t => t.id === Number(tmplId));
    if (!tmpl) return;

    setFormTemplate(tmpl.id);
    if (tmpl.plan_id) setFormPlan(tmpl.plan_id);

    // Calculate expiry from validity days
    const exp = new Date();
    exp.setDate(exp.getDate() + (tmpl.validity_days || 30));
    setFormExpiryDate(exp.toISOString().split('T')[0]);

    if (tmpl.lines && tmpl.lines.length > 0) {
      setFormLines(
        tmpl.lines.map(l => ({
          product_id: l.product_id,
          variant_id: l.variant_id || '',
          quantity: l.quantity || 1,
          unit_price: l.unit_price,
          tax_rate: 10
        }))
      );
    }
  };

  const handleProductChange = (index, prodId) => {
    const prod = products.find(p => p.id === Number(prodId));
    if (!prod) return;

    const newLines = [...formLines];
    newLines[index].product_id = prod.id;
    newLines[index].variant_id = '';
    newLines[index].unit_price = prod.sales_price;
    setFormLines(newLines);
  };

  const handleVariantChange = (index, variantId) => {
    const line = formLines[index];
    const prod = products.find(p => p.id === Number(line.product_id));
    if (!prod) return;

    const variant = prod.variants?.find(v => v.id === Number(variantId));
    const extra = variant ? Number(variant.price_extra || 0) : 0;

    const newLines = [...formLines];
    newLines[index].variant_id = variantId;
    newLines[index].unit_price = prod.sales_price + extra;
    setFormLines(newLines);
  };

  const handleLineQtyChange = (index, qty) => {
    const newLines = [...formLines];
    newLines[index].quantity = Math.max(1, Number(qty));
    setFormLines(newLines);
  };

  const addLine = () => {
    setFormLines([
      ...formLines,
      { product_id: '', variant_id: '', quantity: 1, unit_price: 0, tax_rate: 10 }
    ]);
  };

  const removeLine = (idx) => {
    if (formLines.length > 1) {
      setFormLines(formLines.filter((_, i) => i !== idx));
    }
  };

  // State Machine Transitions
  const handleLifecycleAction = async (action, sub) => {
    try {
      let res;
      if (action === 'quote') res = await api.moveToQuote(sub.id);
      else if (action === 'confirm') res = await api.confirmSubscription(sub.id);
      else if (action === 'activate') res = await api.activateSubscription(sub.id);
      else if (action === 'pause') res = await api.pauseSubscription(sub.id);
      else if (action === 'resume') res = await api.resumeSubscription(sub.id);
      else if (action === 'renew') res = await api.renewSubscription(sub.id);
      else if (action === 'close') res = await api.closeSubscription(sub.id);
      else if (action === 'bill_now') {
        const bRes = await api.runSingleBilling(sub.id);
        setNotice(`Generated Invoice ${bRes.invoice.invoice_number} for ₹${bRes.invoice.total_amount.toFixed(2)}`);
        fetchSubscriptions();
        return;
      }

      setNotice(`${sub.subscription_number}: ${res.message}`);
      setTimeout(() => setNotice(null), 5000);
      fetchSubscriptions();
      if (selectedSub && selectedSub.id === sub.id) {
        const updated = await api.getSubscription(sub.id);
        setSelectedSub(updated.subscription);
      }
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await api.createSubscription({
        customer_id: Number(formCustomer),
        plan_id: Number(formPlan),
        template_id: formTemplate ? Number(formTemplate) : null,
        start_date: formStartDate,
        expiry_date: formExpiryDate || null,
        payment_terms: formPaymentTerms,
        applied_discount_code: formDiscountCode || null,
        notes: formNotes,
        lines: formLines.filter(l => l.product_id),
        from_template: !!formTemplate
      });

      setShowCreateModal(false);
      setNotice('New offer/subscription created successfully');
      setTimeout(() => setNotice(null), 5000);
      fetchSubscriptions();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openSubDetail = async (sub) => {
    try {
      const res = await api.getSubscription(sub.id);
      setSelectedSub(res.subscription);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Notice */}
      {notice && (
        <div className="p-3.5 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-purple-400 hover:text-purple-700">✕</button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-700" />
            Subscriptions & Quotations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full lifecycle: Draft → Quotation → Confirmed → Active → Closed
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          New Subscription / Quote
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by subscription #, customer name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'all' ? 'All Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading subscriptions...</div>
        ) : subscriptions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No subscriptions found</p>
            <p className="text-xs text-slate-400">Try adjusting search or create a new quote.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Subscription</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Plan & Frequency</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Start / Expiry</th>
                  <th className="py-3 px-4">Next Billing</th>
                  <th className="py-3 px-4 text-right">Recurring Total</th>
                  <th className="py-3 px-4 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                      <button
                        onClick={() => openSubDetail(sub)}
                        className="hover:underline flex items-center gap-1"
                      >
                        {sub.subscription_number}
                        <Eye className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{sub.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{sub.customer_company || sub.customer_email}</div>
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{sub.plan_name}</div>
                      <span className="text-[10px] uppercase font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                        {sub.billing_frequency}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={sub.status} />
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      <div>Start: {sub.start_date}</div>
                      <div className="text-slate-400">Exp: {sub.expiry_date || 'Ongoing'}</div>
                    </td>

                    {/* Next Billing */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {sub.status === 'Active' ? (
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          {sub.next_billing_date || 'Due Now'}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatINR(sub.total_amount)}
                      {sub.discount_amount > 0 && (
                        <div className="text-[10px] text-emerald-600 font-normal">
                          -{formatINR(sub.discount_amount)} disc.
                        </div>
                      )}
                    </td>

                    {/* Lifecycle Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Draft -> Quotation */}
                        {sub.status === 'Draft' && (
                          <button
                            onClick={() => handleLifecycleAction('quote', sub)}
                            className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium text-[11px] border border-amber-200 transition"
                          >
                            To Quote
                          </button>
                        )}

                        {/* Quotation -> Confirmed */}
                        {sub.status === 'Quotation' && (
                          <button
                            onClick={() => handleLifecycleAction('confirm', sub)}
                            className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-[11px] border border-blue-200 transition"
                          >
                            Confirm
                          </button>
                        )}

                        {/* Confirmed -> Active */}
                        {sub.status === 'Confirmed' && (
                          <button
                            onClick={() => handleLifecycleAction('activate', sub)}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-[11px] shadow-xs transition"
                          >
                            Activate
                          </button>
                        )}

                        {/* Active -> Pause (checks plan allow_pause) */}
                        {sub.status === 'Active' && sub.allow_pause === 1 && (
                          <button
                            onClick={() => handleLifecycleAction('pause', sub)}
                            className="p-1.5 rounded hover:bg-purple-100 text-purple-700 transition"
                            title="Pause Subscription"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Paused -> Resume */}
                        {sub.status === 'Paused' && (
                          <button
                            onClick={() => handleLifecycleAction('resume', sub)}
                            className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-[11px] border border-emerald-200 transition flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            Resume
                          </button>
                        )}

                        {/* Active -> Bill on demand */}
                        {sub.status === 'Active' && (
                          <button
                            onClick={() => handleLifecycleAction('bill_now', sub)}
                            className="px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium text-[11px] transition"
                            title="Generate invoice immediately"
                          >
                            Bill Now
                          </button>
                        )}

                        {/* Renew (checks plan allow_renew) */}
                        {(sub.status === 'Active' || sub.status === 'Closed') && sub.allow_renew === 1 && (
                          <button
                            onClick={() => handleLifecycleAction('renew', sub)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition"
                            title="Renew Subscription"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Close Early (checks plan allow_close_early) */}
                        {sub.status === 'Active' && sub.allow_close_early === 1 && (
                          <button
                            onClick={() => {
                              if (confirm(`Close subscription ${sub.subscription_number}?`)) {
                                handleLifecycleAction('close', sub);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-rose-50 text-rose-500 transition"
                            title="Close Subscription"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subscription Detail Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-6 border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedSub.subscription_number}</h3>
                  <StatusBadge status={selectedSub.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Customer: <strong className="text-slate-800">{selectedSub.customer_name}</strong> ({selectedSub.customer_company || selectedSub.customer_email})
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Plan rules info card */}
            <div className="p-3 bg-purple-50 rounded-xl text-xs space-y-1 text-purple-900">
              <div className="font-bold flex items-center justify-between">
                <span>Plan: {selectedSub.plan_name} ({selectedSub.billing_frequency})</span>
                <span>Payment Terms: {selectedSub.payment_terms}</span>
              </div>
              <div className="flex gap-4 text-purple-700 text-[11px] pt-1 border-t border-purple-100">
                <span>Allow Pause: {selectedSub.allow_pause ? 'Yes' : 'No'}</span>
                <span>Allow Renew: {selectedSub.allow_renew ? 'Yes' : 'No'}</span>
                <span>Close Early: {selectedSub.allow_close_early ? 'Yes' : 'No'}</span>
                <span>Auto-Close on End: {selectedSub.auto_close_on_end ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {/* Lines */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Subscribed Lines</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSub.lines?.map((line, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium text-slate-800">
                          {line.description}
                          {line.variant_name && (
                            <span className="block text-[10px] text-purple-700">
                              Variant: {line.variant_name} (+₹{line.price_extra})
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center text-slate-600">{line.quantity}</td>
                        <td className="p-2.5 text-right text-slate-600">{formatINR(line.unit_price)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatINR(line.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoices Generated History */}
            {selectedSub.invoices && selectedSub.invoices.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Invoices Generated</h4>
                <div className="space-y-2">
                  {selectedSub.invoices.map((inv) => (
                    <div key={inv.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200/80">
                      <div>
                        <span className="font-mono font-bold text-purple-700">{inv.invoice_number}</span> ({inv.invoice_date})
                        <div className="text-[11px] text-slate-500">Period: {inv.billing_period_start} to {inv.billing_period_end}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={inv.status} />
                        <span className="font-mono font-bold text-slate-900">{formatINR(inv.total_amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Create Subscription / Quotation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 space-y-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Prepare Offer / Subscription</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Start from a quotation template or build custom offer lines.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubscription} className="space-y-5">
              
              {/* Quotation Template Quick-Picker */}
              <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-100 space-y-2">
                <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Fast-Track: Start from Quotation Template
                </label>
                <select
                  value={formTemplate}
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                >
                  <option value="">-- Choose a quotation template or build from scratch --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Valid {t.validity_days} days, Plan: {t.plan_name || 'Standard'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer & Plan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Account *
                  </label>
                  <select
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company_name ? `(${c.company_name})` : ''} - {c.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subscription Plan *
                  </label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  >
                    <option value="">-- Select Plan --</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.price} / {p.billing_frequency}, Min Qty: {p.min_quantity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={formPaymentTerms}
                    onChange={(e) => setFormPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                  </select>
                </div>
              </div>

              {/* Product Lines */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Subscription Lines (Product, Variant, Seats)
                  </label>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-xs text-purple-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Line
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formLines.map((line, idx) => {
                    const selProd = products.find(p => p.id === Number(line.product_id));
                    const variants = selProd?.variants || [];

                    return (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2.5 items-center text-xs">
                        
                        {/* Product selection */}
                        <div className="col-span-5">
                          <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Product</label>
                          <select
                            value={line.product_id}
                            onChange={(e) => handleProductChange(idx, e.target.value)}
                            required
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:outline-hidden"
                          >
                            <option value="">-- Choose Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (₹{p.sales_price})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Variant Selection (e.g. Odoo brand +560) */}
                        <div className="col-span-3">
                          <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Variant</label>
                          <select
                            value={line.variant_id}
                            onChange={(e) => handleVariantChange(idx, e.target.value)}
                            disabled={variants.length === 0}
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-600 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            <option value="">Standard (+₹0)</option>
                            {variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.variant_name} (+₹{v.price_extra})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="col-span-2">
                          <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Qty / Seats</label>
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => handleLineQtyChange(idx, e.target.value)}
                            required
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold focus:ring-1 focus:ring-purple-600 focus:outline-hidden"
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="col-span-1 text-right">
                          <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Unit</label>
                          <span className="font-mono font-semibold">₹{Number(line.unit_price).toFixed(0)}</span>
                        </div>

                        {/* Remove */}
                        <div className="col-span-1 text-center pt-3">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            disabled={formLines.length === 1}
                            className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                          >
                            ✕
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Discount Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discount Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SEATS100, ENTERPRISE20, ODOOPROMO"
                    value={formDiscountCode}
                    onChange={(e) => setFormDiscountCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs uppercase font-mono tracking-wider focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Try <code className="text-purple-700">SEATS100</code> (₹100 off &ge;5 seats) or <code className="text-purple-700">ENTERPRISE20</code> (20% off &ge;₹1,000)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Annual contract special promotion"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submitting ? 'Creating...' : 'Create Subscription'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

