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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#11141b] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-[#212735] text-slate-200">
        
        <div className="px-6 py-4 border-b border-[#1c212c] flex items-center justify-between bg-[#151922]">
          <div>
            <h3 className="font-bold text-white text-base">Record Payment</h3>
            <p className="text-xs text-slate-400">Invoice: <span className="font-mono text-[#33ea6a]">{invoice.invoice_number}</span></p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Amount Due Card */}
          <div className="p-3.5 bg-[#171b26] rounded-2xl border border-[#262f42] flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Outstanding Balance:</span>
            <span className="text-lg font-black font-mono text-[#33ea6a]">
              {formatINR(invoice.amount_due)}
            </span>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Payment Amount
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
                className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-[#161a24] border border-[#262e3e] rounded-xl text-white focus:outline-hidden focus:border-[#33ea6a]"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Credit Card', 'Bank Transfer', 'Manual UPI'].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`py-2 px-2 rounded-xl text-[11px] font-semibold border text-center transition-all ${
                    method === m
                      ? 'border-[#33ea6a] bg-[#33ea6a]/15 text-[#33ea6a]'
                      : 'border-[#262e3e] bg-[#161a24] text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Transaction / Gate Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-[#161a24] border border-[#262e3e] rounded-xl text-white focus:outline-hidden focus:border-[#33ea6a]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#1c212c] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#161a24] text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-full bg-[#33ea6a] hover:bg-[#2fe064] text-black text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              {loading ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
