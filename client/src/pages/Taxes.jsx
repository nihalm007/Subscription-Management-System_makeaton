import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Percent, Plus, Shield, CheckCircle } from 'lucide-react';

export default function Taxes() {
  const { isAdmin } = useAuth();
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const res = await api.getTaxes();
      setTaxes(res.taxes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createTax({ name, rate: Number(rate), tax_type: 'percentage' });
      setShowModal(false);
      setNotice(`Tax rule "${name}" created.`);
      setTimeout(() => setNotice(null), 4000);
      setName('');
      setRate('');
      fetchTaxes();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {notice && (
        <div className="p-3.5 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)}>✕</button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tax Rules Configuration</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            "Taxes are calculated automatically from rules the admin has set."
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Tax Rule
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {taxes.map((t) => (
          <div key={t.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">Active</span>
            </div>
            <div className="mt-3 text-3xl font-black text-purple-900 font-mono">
              {t.rate}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Auto-applied to line subtotals</div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-slate-900 text-base">New Tax Rule</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Standard VAT 10%"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="10.0"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-slate-600">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-purple-700 text-white font-bold rounded-lg">
                  {submitting ? 'Saving...' : 'Save Tax'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

