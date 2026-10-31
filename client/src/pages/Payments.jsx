import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatINR } from '../utils/format';
import { CreditCard, Search, DollarSign, Landmark, Calendar, User } from 'lucide-react';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.getPayments();
      setPayments(res.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = payments.filter((p) => {
    const matchSearch =
      p.payment_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.customer_company?.toLowerCase().includes(search.toLowerCase());
    const matchMethod = methodFilter === 'all' || p.payment_method === methodFilter;
    return matchSearch && matchMethod;
  });

  const totalCollected = filtered.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-purple-700" />
            Payment Collections & Audit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Matched directly to invoices with method, amount, date and notes
          </p>
        </div>

        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3">
          <span className="text-xs font-semibold text-teal-800">Total Collected:</span>
          <span className="text-lg font-black font-mono text-teal-900">
            {formatINR(totalCollected)}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search payments by #, invoice #, customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {['all', 'Credit Card', 'Bank Transfer', 'Stripe', 'UPI', 'Cash', 'Check'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                methodFilter === m
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {m === 'all' ? 'All Methods' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading payments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No payment records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Payment #</th>
                  <th className="py-3 px-4">Invoice Matched</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Method & Reference</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.payment_number}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{p.invoice_number}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{p.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{p.customer_company || p.customer_email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">{p.payment_method}</span>
                      <div className="text-[11px] text-slate-400 font-mono">{p.transaction_reference}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{p.payment_date}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-teal-700 text-sm">
                      +{formatINR(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {p.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

