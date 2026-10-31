import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PrintInvoiceModal from '../components/PrintInvoiceModal';
import PaymentModal from '../components/PaymentModal';
import { formatINR } from '../utils/format';
import {
  Receipt,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Send,
  Printer,
  CreditCard,
  AlertCircle,
  DollarSign,
  Clock,
  Eye
} from 'lucide-react';

export default function Invoices({ initialInvoiceId }) {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // Modals
  const [viewInvoice, setViewInvoice] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [notice, setNotice] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = `?status=${statusFilter}&search=${encodeURIComponent(search)}`;
      const res = await api.getInvoices(params);
      setInvoices(res.invoices);
      setSummary(res.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, search]);

  useEffect(() => {
    if (initialInvoiceId) {
      handleOpenInvoice(initialInvoiceId);
    }
  }, [initialInvoiceId]);

  const handleOpenInvoice = async (invOrId) => {
    const id = typeof invOrId === 'object' ? invOrId.id : invOrId;
    try {
      const res = await api.getInvoice(id);
      setViewInvoice(res.invoice);
    } catch (err) {
      alert('Failed to load invoice: ' + err.message);
    }
  };

  const handleConfirm = async (inv) => {
    try {
      setActionLoading(inv.id);
      await api.confirmInvoice(inv.id);
      setNotice(`Invoice ${inv.invoice_number} confirmed!`);
      setTimeout(() => setNotice(null), 4000);
      fetchInvoices();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (inv) => {
    if (!confirm(`Are you sure you want to cancel invoice ${inv.invoice_number}?`)) return;
    try {
      setActionLoading(inv.id);
      await api.cancelInvoice(inv.id);
      setNotice(`Invoice ${inv.invoice_number} cancelled.`);
      setTimeout(() => setNotice(null), 4000);
      fetchInvoices();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSend = async (inv) => {
    try {
      setActionLoading(inv.id);
      await api.sendInvoice(inv.id);
      setNotice(`Invoice ${inv.invoice_number} dispatched to ${inv.customer_email}`);
      setTimeout(() => setNotice(null), 4000);
      fetchInvoices();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleChase = async (inv) => {
    try {
      setActionLoading(inv.id);
      const res = await api.chaseInvoice(inv.id);
      setNotice(`Payment reminder dispatched to ${inv.customer_email} (${res.chase_count} reminders sent)`);
      setTimeout(() => setNotice(null), 4000);
      fetchInvoices();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
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
            <Receipt className="w-6 h-6 text-purple-700" />
            Invoices & Receivables
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage billing lifecycle: Draft → Confirmed → Paid (with Overdue chasing & Print / PDF)
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Paid</div>
            <div className="text-2xl font-extrabold text-teal-700 font-mono">
              {formatINR(summary.total_paid)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Successfully collected payments</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Outstanding</div>
            <div className="text-2xl font-extrabold text-amber-700 font-mono">
              {formatINR(summary.total_outstanding)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Pending customer settlement</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-rose-200 shadow-xs bg-rose-50/30">
            <div className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Overdue Receivables</div>
            <div className="text-2xl font-extrabold text-rose-600 font-mono">
              {formatINR(summary.total_overdue)}
            </div>
            <div className="text-[11px] text-rose-600 mt-1">Past due terms - requires chasing</div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'Draft', 'Confirmed', 'Paid', 'Overdue', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'all' ? 'All Invoices' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No invoices match your filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date / Due Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Invoice # */}
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                      <button
                        onClick={() => handleOpenInvoice(inv)}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        {inv.invoice_number}
                        <Eye className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{inv.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{inv.customer_company || inv.customer_email}</div>
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div>{inv.invoice_date}</div>
                      <div className={inv.is_overdue ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                        Due: {inv.due_date} {inv.is_overdue ? `(${inv.days_overdue}d ago)` : ''}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={inv.status} isOverdue={inv.is_overdue} />
                      {inv.sent_at && (
                        <span className="block text-[9px] text-slate-400 mt-0.5">Sent</span>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatINR(inv.total_amount)}
                    </td>

                    {/* Balance Due */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                      <span className={inv.amount_due > 0 ? (inv.is_overdue ? 'text-rose-600' : 'text-amber-700') : 'text-teal-600'}>
                        {formatINR(inv.amount_due)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        
                        {/* Draft -> Confirm */}
                        {inv.status === 'Draft' && (
                          <button
                            onClick={() => handleConfirm(inv)}
                            disabled={actionLoading === inv.id}
                            className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-[11px] border border-blue-200 transition"
                          >
                            Confirm
                          </button>
                        )}

                        {/* Send Email */}
                        {inv.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleSend(inv)}
                            disabled={actionLoading === inv.id}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition"
                            title="Dispatch / Send invoice email"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Register Payment */}
                        {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                          <button
                            onClick={() => setPaymentInvoice(inv)}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-[11px] shadow-xs transition flex items-center gap-1"
                          >
                            <DollarSign className="w-3 h-3" />
                            Pay
                          </button>
                        )}

                        {/* Chase Overdue */}
                        {inv.is_overdue === 1 && (
                          <button
                            onClick={() => handleChase(inv)}
                            disabled={actionLoading === inv.id}
                            className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-medium text-[11px] transition"
                            title="Send overdue reminder to customer"
                          >
                            Chase
                          </button>
                        )}

                        {/* Print / PDF */}
                        <button
                          onClick={() => handleOpenInvoice(inv)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition"
                          title="Print / Save PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Cancel */}
                        {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleCancel(inv)}
                            disabled={actionLoading === inv.id}
                            className="p-1.5 rounded hover:bg-rose-50 text-rose-400 transition"
                            title="Cancel Invoice"
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

      {/* Print / View Modal */}
      {viewInvoice && (
        <PrintInvoiceModal
          invoice={viewInvoice}
          onClose={() => setViewInvoice(null)}
          onRegisterPayment={(inv) => {
            setViewInvoice(null);
            setPaymentInvoice(inv);
          }}
        />
      )}

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <PaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onPaymentRecorded={() => {
            setNotice(`Payment recorded successfully for invoice ${paymentInvoice.invoice_number}`);
            setTimeout(() => setNotice(null), 4000);
            fetchInvoices();
          }}
        />
      )}

    </div>
  );
}

