import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { formatINR } from '../utils/format';
import {
  CalendarCheck,
  Zap,
  CheckCircle,
  AlertTriangle,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

export default function BillingDay({ setActiveTab, onSelectInvoice }) {
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueData, setDueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  const fetchDue = async (targetDate) => {
    try {
      setLoading(true);
      const res = await api.getDueBilling(targetDate || billingDate);
      setDueData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDue(billingDate);
  }, [billingDate]);

  const handleRunBilling = async () => {
    try {
      setRunning(true);
      setBatchResult(null);
      const res = await api.runBilling(billingDate);
      setBatchResult(res);
      fetchDue(billingDate);
    } catch (err) {
      alert('Billing batch failed: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-purple-700" />
            Billing Day Recurring Runner
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            "Nobody should be typing invoices by hand." Automated batch recurring billing with anti-duplicate idempotency.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 pl-1">
            <Calendar className="w-4 h-4 text-purple-600" />
            Billing Target Date:
          </span>
          <input
            type="date"
            value={billingDate}
            onChange={(e) => setBillingDate(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg font-mono font-medium focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Hero Action Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/30">
            <Zap className="w-3.5 h-3.5 text-purple-300" />
            Recurring Invoicing Engine
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ready to generate invoices for {dueData?.count || 0} due subscriptions
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
            Invoices are pre-filled with customer details, product lines, active tax rules, and automatic volume discounts. The system enforces strict idempotency: nothing is billed twice or skipped.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleRunBilling}
              disabled={running || !dueData || dueData.count === 0}
              className="px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-sm font-bold shadow-lg shadow-purple-900/50 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4" />
              {running ? 'Executing Billing Run...' : `Run Billing Batch for ${dueData?.count || 0} Subscriptions`}
            </button>

            {dueData?.count === 0 && (
              <span className="text-xs text-purple-300 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                All active subscriptions are up to date for this date!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Batch Result Report if just executed */}
      {batchResult && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <h3 className="text-base font-bold text-emerald-950">Billing Run Complete</h3>
            </div>
            <button onClick={() => setBatchResult(null)} className="text-emerald-700 text-xs font-bold hover:underline">
              Dismiss
            </button>
          </div>
          <p className="text-xs text-emerald-800">
            {batchResult.message}
          </p>

          {batchResult.invoices && batchResult.invoices.length > 0 && (
            <div className="bg-white rounded-xl border border-emerald-200 p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Invoices Generated in this Batch
              </span>
              <div className="divide-y divide-slate-100 text-xs">
                {batchResult.invoices.map((inv) => (
                  <div key={inv.invoice_id} className="py-2 flex justify-between items-center">
                    <span className="font-mono font-bold text-purple-700">
                      {inv.invoice_number} ({inv.subscription_number})
                    </span>
                    <span className="font-mono font-bold text-slate-900">{formatINR(inv.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 text-right">
                <button
                  onClick={() => setActiveTab('invoices')}
                  className="text-xs text-purple-700 font-bold hover:underline flex items-center gap-1 ml-auto"
                >
                  View all in Invoices Manager <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Due Subscriptions Preview List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Subscriptions Due for Invoicing on {billingDate} ({dueData?.count || 0})
            </h3>
            <p className="text-xs text-slate-500">Preview what will be billed when the batch is executed</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-mono text-xs font-bold">
            {dueData?.count || 0} subscriptions
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Checking billing schedules...</div>
        ) : dueData?.subscriptions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No subscriptions due for billing on {billingDate}</p>
            <p className="text-xs text-slate-400">All recurring contracts are invoiced for this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Subscription #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4">Next Billing Date</th>
                  <th className="py-3 px-4 text-right">Recurring Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dueData.subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{sub.subscription_number}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{sub.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{sub.customer_company || sub.customer_email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">{sub.plan_name}</td>
                    <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-purple-700">
                      {sub.billing_frequency}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {sub.next_billing_date || 'Due Now'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatINR(sub.total_amount)}
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

