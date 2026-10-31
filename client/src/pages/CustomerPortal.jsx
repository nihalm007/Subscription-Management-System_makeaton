import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PrintInvoiceModal from '../components/PrintInvoiceModal';
import PaymentModal from '../components/PaymentModal';
import { formatINR } from '../utils/format';
import {
  Layers,
  Receipt,
  CreditCard,
  DollarSign,
  Play,
  Pause,
  RotateCw,
  XCircle,
  Printer,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building
} from 'lucide-react';

export default function CustomerPortal() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  // Modals
  const [printInvoice, setPrintInvoice] = useState(null);
  const [payInvoice, setPayInvoice] = useState(null);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const [sRes, iRes] = await Promise.all([
        api.getSubscriptions(),
        api.getInvoices()
      ]);
      setSubscriptions(sRes.subscriptions || []);
      setInvoices(iRes.invoices || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleSelfServiceAction = async (action, sub) => {
    try {
      let res;
      if (action === 'pause') res = await api.pauseSubscription(sub.id);
      else if (action === 'resume') res = await api.resumeSubscription(sub.id);
      else if (action === 'renew') res = await api.renewSubscription(sub.id);
      else if (action === 'close') {
        if (!confirm('Are you sure you want to cancel your subscription early?')) return;
        res = await api.closeSubscription(sub.id);
      }

      setNotice(res.message);
      setTimeout(() => setNotice(null), 5000);
      fetchPortalData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewInvoice = async (inv) => {
    try {
      const res = await api.getInvoice(inv.id);
      setPrintInvoice(res.invoice);
    } catch (err) {
      alert('Failed to load invoice: ' + err.message);
    }
  };

  const totalOwed = invoices
    .filter(i => i.status !== 'Paid' && i.status !== 'Cancelled')
    .reduce((sum, i) => sum + Number(i.amount_due), 0);

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Toast Notice */}
      {notice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-emerald-700">✕</button>
        </div>
      )}

      {/* Customer Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 px-3 py-1 rounded-full inline-block">
              Customer Self-Serve Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user?.name || 'Customer'}
            </h1>
            <p className="text-xs sm:text-sm text-purple-200 flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-300" />
              <span>{user?.company_name || 'Independent Account'} • {user?.email}</span>
            </p>
          </div>

          {/* Account Balance Widget */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 min-w-[200px]">
            <span className="text-xs text-purple-200 block mb-1">Outstanding Balance</span>
            <div className="text-2xl font-black font-mono">
              {formatINR(totalOwed)}
            </div>
            <div className="text-[11px] text-purple-300 mt-1">
              {totalOwed > 0 ? 'Payment required' : 'Account is fully paid'}
            </div>
          </div>
        </div>
      </div>

      {/* 1. My Subscriptions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-700" />
              My Active Subscriptions
            </h2>
            <p className="text-xs text-slate-500">
              Manage your renewals, pausing, and services self-serve without emailing support
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {subscriptions.length} Contract(s)
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            Loading your subscriptions...
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No active subscriptions found</p>
            <p className="text-xs text-slate-400">Contact Brightloop sales to activate your business plan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                      {sub.subscription_number}
                    </span>
                    <StatusBadge status={sub.status} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{sub.plan_name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-slate-900">
                      {formatINR(sub.total_amount)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/{sub.billing_frequency}</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Renewal Date</span>
                      <strong className="text-slate-700">{sub.next_billing_date || sub.expiry_date || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Payment Terms</span>
                      <strong className="text-slate-700">{sub.payment_terms}</strong>
                    </div>
                  </div>
                </div>

                {/* Self-service Action Buttons (strictly obeying plan rules!) */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    Self-Serve Controls
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Pause (allowed only if plan.allow_pause) */}
                    {sub.status === 'Active' && sub.allow_pause === 1 && (
                      <button
                        onClick={() => handleSelfServiceAction('pause', sub)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition flex items-center gap-1"
                        title="Pause recurring billing"
                      >
                        <Pause className="w-3 h-3 text-slate-500" />
                        Pause
                      </button>
                    )}

                    {/* Resume */}
                    {sub.status === 'Paused' && (
                      <button
                        onClick={() => handleSelfServiceAction('resume', sub)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1 shadow-xs"
                      >
                        <Play className="w-3 h-3" />
                        Resume
                      </button>
                    )}

                    {/* Renew (allowed only if plan.allow_renew) */}
                    {sub.allow_renew === 1 && (
                      <button
                        onClick={() => handleSelfServiceAction('renew', sub)}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium border border-purple-200 transition flex items-center gap-1"
                        title="Extend contract renewal"
                      >
                        <RotateCw className="w-3 h-3 text-purple-600" />
                        Renew
                      </button>
                    )}

                    {/* Cancel Early (allowed only if plan.allow_close_early) */}
                    {sub.status === 'Active' && sub.allow_close_early === 1 && (
                      <button
                        onClick={() => handleSelfServiceAction('close', sub)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition"
                        title="Cancel subscription"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. My Invoices & Payments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-purple-700" />
              My Invoices & Receipts
            </h2>
            <p className="text-xs text-slate-500">
              Download invoices, print receipts and settle balances securely online
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No invoices generated yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{inv.invoice_date}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        <span className={inv.is_overdue ? 'text-rose-600 font-bold' : ''}>
                          {inv.due_date} {inv.is_overdue ? `(Overdue)` : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={inv.status} isOverdue={inv.is_overdue} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatINR(inv.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                        <span className={inv.amount_due > 0 ? 'text-rose-600' : 'text-teal-600'}>
                          {formatINR(inv.amount_due)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                            <button
                              onClick={() => setPayInvoice(inv)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 text-xs shadow-xs transition flex items-center gap-1"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Pay Now
                            </button>
                          )}
                          <button
                            onClick={() => handleViewInvoice(inv)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                            title="Print / PDF Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {printInvoice && (
        <PrintInvoiceModal
          invoice={printInvoice}
          onClose={() => setPrintInvoice(null)}
          onRegisterPayment={(inv) => {
            setPrintInvoice(null);
            setPayInvoice(inv);
          }}
        />
      )}

      {payInvoice && (
        <PaymentModal
          invoice={payInvoice}
          onClose={() => setPayInvoice(null)}
          onPaymentRecorded={() => {
            setNotice(`Payment of ₹${Number(payInvoice.amount_due).toFixed(2)} processed successfully!`);
            setTimeout(() => setNotice(null), 5000);
            fetchPortalData();
          }}
        />
      )}

    </div>
  );
}

