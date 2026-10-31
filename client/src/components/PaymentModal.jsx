import React, { useState } from 'react';
import { api } from '../services/api';
import { formatINR } from '../utils/format';
import { X, DollarSign, CreditCard, Landmark, Check } from 'lucide-react';

export default function PaymentModal({ invoice, onClose, onPaymentRecorded }) {
  if (!invoice) return null;

  const [amount, setAmount] = useState(invoice.amount_due || invoice.total_amount);
  const [method, setMethod] = useState('Credit Card');
  const [reference, setReference] = useState(`REF-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.recordPayment({
        invoice_id: invoice.id,
        amount: Number(amount),
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: method,
        transaction_reference: reference,
        notes: notes || `Settlement for invoice ${invoice.invoice_number}`
      });

      if (onPaymentRecorded) onPaymentRecorded();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Record Payment</h3>
            <p className="text-xs text-slate-500">Invoice: {invoice.invoice_number}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Amount Due Card */}
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
            <span className="text-xs font-medium text-purple-900">Outstanding Balance:</span>
            <span className="text-lg font-black font-mono text-purple-900">
              {formatINR(invoice.amount_due)}
            </span>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={invoice.amount_due}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>
            {amount < invoice.amount_due && (
              <p className="text-[11px] text-amber-600 mt-1">
                Partial payment: {formatINR(invoice.amount_due - amount)} will remain due.
              </p>
            )}
          </div>

          {/* Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
            >
              <option value="Credit Card">Credit Card</option>
              <option value="Bank Transfer">Bank Transfer (ACH / Wire)</option>
              <option value="Stripe">Stripe Checkout</option>
              <option value="UPI">UPI</option>
              <option value="Check">Check</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction / Reference Number
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via portal or check number #4820"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

