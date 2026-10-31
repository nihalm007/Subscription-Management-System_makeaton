import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/format';
import {
  Calendar,
  Plus,
  CheckCircle,
  XCircle,
  Pause,
  RotateCw,
  Clock,
  Shield,
  Layers
} from 'lucide-react';

export default function Plans() {
  const { isAdmin } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState(null);

  // Form
  const [name, setName] = useState('');
  const [billingFrequency, setBillingFrequency] = useState('monthly');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [minQuantity, setMinQuantity] = useState(1);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2028-12-31');
  const [autoClose, setAutoClose] = useState(false);
  const [allowCloseEarly, setAllowCloseEarly] = useState(true);
  const [allowPause, setAllowPause] = useState(true);
  const [allowRenew, setAllowRenew] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.getPlans();
      setPlans(res.plans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.createPlan({
        name,
        billing_frequency: billingFrequency,
        price: Number(price),
        cost_price: Number(costPrice || 0),
        min_quantity: Number(minQuantity || 1),
        start_date: startDate || null,
        end_date: endDate || null,
        auto_close_on_end: autoClose ? 1 : 0,
        allow_close_early: allowCloseEarly ? 1 : 0,
        allow_pause: allowPause ? 1 : 0,
        allow_renew: allowRenew ? 1 : 0
      });

      setShowModal(false);
      setNotice(`Subscription plan "${name}" configured successfully!`);
      setTimeout(() => setNotice(null), 5000);
      setName('');
      setPrice('');
      fetchPlans();
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-700" />
            Subscription Plans & Recurrence Rules
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily, Weekly, Monthly, or Yearly billing cadences with fine-grained plan lifecycle policies
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Configure New Plan
          </button>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                  {p.billing_frequency}
                </span>
                <span className="text-xs text-slate-400">Min: {p.min_quantity} seat(s)</span>
              </div>

              <h3 className="text-base font-bold text-slate-900">{p.name}</h3>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {formatINR(p.price, 0)}
                </span>
                <span className="text-xs text-slate-500 font-medium">/{p.billing_frequency}</span>
              </div>

              <div className="mt-3 text-[11px] text-slate-400 space-y-0.5 font-mono">
                <div>Active from: {p.start_date || 'Inception'}</div>
                <div>Valid to: {p.end_date || 'Open-ended'}</div>
              </div>

              {/* Lifecycle Policy Rules */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Plan Lifecycle Rules
                </span>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Auto-Close on End:</span>
                  <span className={p.auto_close_on_end ? 'text-purple-700 font-semibold' : 'text-slate-400'}>
                    {p.auto_close_on_end ? 'Yes (Automatic)' : 'No (Ongoing)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Allow Pause:</span>
                  <span className={p.allow_pause ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                    {p.allow_pause ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Allow Renew:</span>
                  <span className={p.allow_renew ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                    {p.allow_renew ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Close Early:</span>
                  <span className={p.allow_close_early ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                    {p.allow_close_early ? 'Allowed' : 'Locked (Contract)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 border border-slate-200">
            
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Configure Subscription Plan</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define cadence, price, seat limits and lifecycle behavior
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

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Enterprise Tier"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Frequency *</label>
                  <select
                    value={billingFrequency}
                    onChange={(e) => setBillingFrequency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden font-semibold"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="199.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden font-bold"
                  />
                </div>

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
              </div>

              {/* Lifecycle Checkboxes */}
              <div className="pt-2 border-t border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                  Plan Lifecycle Rules (Admin Decides Plan-by-Plan)
                </span>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoClose}
                    onChange={(e) => setAutoClose(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span><strong>Auto-close on end:</strong> Subscription closes on its own when validity ends</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCloseEarly}
                    onChange={(e) => setAllowCloseEarly(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span><strong>Allow close early:</strong> Customer or staff can cancel before contract term</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPause}
                    onChange={(e) => setAllowPause(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span><strong>Allow pause:</strong> Customer or staff can temporarily pause recurring billing</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowRenew}
                    onChange={(e) => setAllowRenew(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span><strong>Allow renew:</strong> Can be renewed for successive billing cycles</span>
                </label>
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
                  {submitting ? 'Saving...' : 'Save Plan'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

