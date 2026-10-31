import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { formatINR, formatINRCompact } from '../utils/format';
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  Users,
  DollarSign,
  Activity,
  Zap,
  Send,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Dashboard({ setActiveTab, onSelectInvoice }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [chasingId, setChasingId] = useState(null);
  const [notice, setNotice] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardAnalytics();
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleChase = async (inv) => {
    try {
      setChasingId(inv.id);
      const res = await api.chaseInvoice(inv.id);
      setNotice(`Overdue reminder dispatched to ${inv.customer_email} (${res.chase_count} reminders sent)`);
      setTimeout(() => setNotice(null), 5000);
      fetchDashboard();
    } catch (err) {
      alert('Failed to send chase reminder: ' + err.message);
    } finally {
      setChasingId(null);
    }
  };

  const handleRunStressTest = async (count = 500) => {
    try {
      setSeeding(true);
      const res = await api.seedStressTest(count);
      setNotice(`Stress test complete! Seeded ${res.count} active subscriptions in ${res.time_taken_ms}ms.`);
      setTimeout(() => setNotice(null), 6000);
      fetchDashboard();
    } catch (err) {
      alert('Stress test failed: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-slate-500">Loading Finance Lead metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm">
          Failed to load dashboard: {error}
        </div>
      </div>
    );
  }

  const { metrics, planBreakdown, overdueList, monthlyRevenue, performance } = data;

  const COLORS = ['#7c3aed', '#0284c7', '#059669', '#d97706', '#dc2626'];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Notice Banner */}
      {notice && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-purple-400 hover:text-purple-700 font-bold">✕</button>
        </div>
      )}

      {/* Header & Performance SLA Meter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Finance & Revenue Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              Response: {performance?.query_time_ms} ms (&lt; 2.0s SLA)
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time monthly close overview for the Brightloop Software finance lead.
          </p>
        </div>

        {/* Actions: Run Billing & Stress Test */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setActiveTab('billing')}
            className="px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition flex items-center gap-2 shadow-xs"
          >
            <Calendar className="w-4 h-4" />
            Run Billing Day Batch
          </button>

          <button
            onClick={() => handleRunStressTest(500)}
            disabled={seeding}
            className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-200 transition flex items-center gap-1.5 disabled:opacity-50"
            title="Seed 500 subscriptions to verify sub-second response under scale"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            {seeding ? 'Seeding 500...' : 'Test 500 Load'}
          </button>
        </div>
      </div>

      {/* 4 Core Questions KPI Grid */}
      {/*
        1. How many subscriptions are active?
        2. How much revenue came in? (MRR/ARR + collected)
        3. How much is still owed?
        4. Which invoices are overdue?
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Active Subscriptions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>1. Active Subscriptions</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {metrics.active_subscriptions}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">{metrics.active_customers}</span> distinct customer accounts
          </div>
        </div>

        {/* Metric 2: Revenue Collected / MRR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>2. MRR & ARR Run-Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {formatINRCompact(metrics.mrr)}
            <span className="text-xs font-sans text-slate-400 font-normal"> /mo</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span>ARR: <strong className="text-slate-800 font-mono">{formatINRCompact(metrics.arr)}</strong></span>
            <span>• Paid: <strong className="text-emerald-700 font-mono">{formatINRCompact(metrics.revenue_all_time)}</strong></span>
          </div>
        </div>

        {/* Metric 3: Total Owed (Accounts Receivable) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>3. Revenue Still Owed</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono text-amber-900">
            {formatINR(metrics.total_owed)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Across <strong className="text-slate-800">{metrics.outstanding_invoices_count}</strong> open / uncollected invoices
          </div>
        </div>

        {/* Metric 4: Overdue Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>4. Invoices Overdue</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 tracking-tight font-mono">
            {metrics.overdue_count}
            <span className="text-xs font-sans text-rose-400 font-normal"> overdue</span>
          </div>
          <div className="mt-2 text-xs text-rose-700 font-semibold font-mono">
            {formatINR(metrics.overdue_amount)} at risk
          </div>
        </div>

      </div>

      {/* Overdue Aging Analysis & Chase Action Center */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              Overdue Receivables & Aging Buckets
            </h2>
            <p className="text-xs text-slate-500">Chase outstanding balances before they turn into lost revenue.</p>
          </div>

          {/* Aging Summary Badges */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-mono">
              1-15d: {formatINRCompact(metrics.overdue_aging?.days_1_15 || 0)}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-800 border border-orange-200 font-mono">
              16-30d: {formatINRCompact(metrics.overdue_aging?.days_16_30 || 0)}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-mono font-bold">
              30d+: {formatINRCompact(metrics.overdue_aging?.days_30_plus || 0)}
            </span>
          </div>
        </div>

        {overdueList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            No overdue invoices at this time! All receivables are in good standing.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-center">Overdue Days</th>
                  <th className="py-3 px-4 text-right">Amount Owed</th>
                  <th className="py-3 px-4 text-center">Chase Reminders</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueList.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                      <button
                        onClick={() => onSelectInvoice && onSelectInvoice(inv)}
                        className="hover:underline flex items-center gap-1"
                      >
                        {inv.invoice_number}
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{inv.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{inv.customer_company || inv.customer_email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">{inv.due_date}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        {inv.days_overdue} days
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700 text-sm">
                      {formatINR(inv.amount_due)}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500">
                      {inv.chase_count > 0 ? (
                        <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                          {inv.chase_count} sent
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">None yet</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleChase(inv)}
                        disabled={chasingId === inv.id}
                        className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200 text-xs font-semibold transition flex items-center gap-1.5 ml-auto disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        {chasingId === inv.id ? 'Dispatching...' : 'Chase Now'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visual Analytics: Monthly Revenue & Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Revenue Collections Trajectory</h3>
              <p className="text-xs text-slate-500">Payments collected over past billing months</p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
              Total: {formatINRCompact(metrics.revenue_all_time)}
            </span>
          </div>

          <div className="h-64">
            {monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => formatINR(val, 0)} />
                  <Tooltip
                    formatter={(val) => [formatINR(val), 'Revenue']}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="revenue" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No monthly revenue entries recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Active Plans Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Subscription distribution by recurrence</p>

          <div className="space-y-3.5">
            {planBreakdown.map((plan, idx) => (
              <div key={plan.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-800">{plan.name}</span>
                  <span className="font-semibold text-purple-700 uppercase tracking-wider text-[10px] bg-purple-100 px-2 py-0.5 rounded">
                    {plan.billing_frequency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{plan.sub_count} active subscriptions</span>
                  <span className="font-mono font-bold text-slate-700">{formatINR(plan.sub_value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

