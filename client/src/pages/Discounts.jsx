import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Tag,
  Plus,
  Shield,
  CheckCircle,
  Percent,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function Discounts() {
  const { isAdmin } = useAuth();
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState(null);

  // Form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [value, setValue] = useState('');
  const [scope, setScope] = useState('whole_subscription');
  const [productId, setProductId] = useState('');
  const [minPurchase, setMinPurchase] = useState('0');
  const [minQuantity, setMinQuantity] = useState('0');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2027-12-31');
  const [usageLimit, setUsageLimit] = useState('50');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const [dRes, pRes] = await Promise.all([api.getDiscounts(), api.getProducts()]);
      setDiscounts(dRes.discounts || []);
      setProducts(pRes.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.createDiscount({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        discount_type: discountType,
        value: Number(value),
        scope,
        product_id: scope === 'specific_product' ? Number(productId) : null,
        min_purchase_amount: Number(minPurchase || 0),
        min_quantity: Number(minQuantity || 0),
        start_date: startDate || null,
        end_date: endDate || null,
        usage_limit: Number(usageLimit || 0)
      });

      setShowModal(false);
      setNotice(`Discount rule ${code.toUpperCase()} established successfully!`);
      setTimeout(() => setNotice(null), 5000);
      setCode('');
      setName('');
      setValue('');
      fetchDiscounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Discount Rules Engine
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <Shield className="w-3.5 h-3.5" />
              Admin-Only Privilege
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            "Only the admin can create discount rules... once it applies, it appears on the next invoice on its own without anyone having to remember it, and stops when it expires."
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create Discount Rule
          </button>
        ) : (
          <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500 text-xs font-medium border border-slate-200">
            View-only: Only Administrators can create discount rules
          </div>
        )}
      </div>

      {/* Discounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {discounts.map((d) => {
          const isExhausted = d.usage_limit > 0 && d.usage_count >= d.usage_limit;
          const isExpired = d.end_date && new Date().toISOString().split('T')[0] > d.end_date;

          return (
            <div
              key={d.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-black font-mono tracking-wider bg-purple-100 text-purple-900 px-3 py-1 rounded-lg border border-purple-200">
                    {d.code}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    isExhausted || isExpired
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isExhausted ? 'Limit Reached' : isExpired ? 'Expired' : 'Active'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{d.name}</h3>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-purple-900 font-mono">
                    {d.discount_type === 'percentage' ? `${d.value}%` : `₹${d.value}`}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">OFF</span>
                </div>

                {/* Scope & Thresholds */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Applicable Scope:</span>
                    <strong className="text-slate-800">
                      {d.scope === 'whole_subscription' ? 'Whole Subscription' : `Specific: ${d.product_name || 'Product'}`}
                    </strong>
                  </div>

                  {d.min_quantity > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Min Seats Threshold:</span>
                      <strong className="text-purple-700">&ge; {d.min_quantity} seats</strong>
                    </div>
                  )}

                  {d.min_purchase_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Min Purchase Threshold:</span>
                      <strong className="text-purple-700">&ge; ₹{d.min_purchase_amount}</strong>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-slate-500">Validity Window:</span>
                    <span className="text-slate-600 font-mono text-[11px]">{d.start_date || 'Any'} to {d.end_date || 'Any'}</span>
                  </div>
                </div>
              </div>

              {/* Usage Progress */}
              <div className="mt-5 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Redemptions:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {d.usage_count} / {d.usage_limit > 0 ? d.usage_limit : 'Unlimited'}
                  </span>
                </div>
                {d.usage_limit > 0 && (
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (d.usage_count / d.usage_limit) * 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Discount Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 border border-slate-200">
            
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create Admin Discount Rule</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated rule that applies onto recurring invoices once conditions are satisfied
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Coupon / Rule Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. SEATS100"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs uppercase font-mono font-bold focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Friendly Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. High Volume Seats (₹100 Off)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Type *</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden font-semibold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Value ({discountType === 'percentage' ? '%' : '₹'}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={discountType === 'percentage' ? '15' : '100'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scope *</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                >
                  <option value="whole_subscription">Whole Subscription (Entire subtotal)</option>
                  <option value="specific_product">Specific Product Line Only</option>
                </select>
              </div>

              {scope === 'specific_product' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Target Product *</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Quantity (Seats Threshold)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Purchase Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 1000.00"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-purple-700 text-white font-semibold hover:bg-purple-800 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submitting ? 'Creating...' : 'Create Rule'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

