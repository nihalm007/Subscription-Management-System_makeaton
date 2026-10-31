import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatINR, formatINRCompact } from '../utils/format';
import {
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  DollarSign,
  Activity,
  Zap,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
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
  Cell,
  LineChart,
  Line
} from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getDashboardAnalytics();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-[#33ea6a] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading CoinVex Revenue Analytics...</p>
      </div>
    );
  }

  const { metrics, planBreakdown, monthlyRevenue, performance } = data;
  const COLORS = ['#33ea6a', '#38bdf8', '#8a3ffc', '#f59e0b', '#f43f5e'];

  return (
    <div className="p-6 sm:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Revenue & Subscription Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deep financial metrics, recurring MRR trajectory, and plan distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#33ea6a]" />
            Telemetry: {performance?.query_time_ms}ms SLA
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#11141b] border border-[#1d222e] p-5 rounded-2xl">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Monthly Recurring (MRR)</div>
          <div className="text-3xl font-extrabold text-white font-mono">{formatINRCompact(metrics.mrr)}</div>
          <div className="text-xs text-[#33ea6a] mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>ARR: {formatINRCompact(metrics.arr)}</span>
          </div>
        </div>

        <div className="bg-[#11141b] border border-[#1d222e] p-5 rounded-2xl">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">All-Time Revenue</div>
          <div className="text-3xl font-extrabold text-white font-mono">{formatINRCompact(metrics.revenue_all_time)}</div>
          <div className="text-xs text-slate-400 mt-2">Total invoiced & settled</div>
        </div>

        <div className="bg-[#11141b] border border-[#1d222e] p-5 rounded-2xl">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Active Subscribers</div>
          <div className="text-3xl font-extrabold text-white">{metrics.active_customers}</div>
          <div className="text-xs text-slate-400 mt-2">Across {metrics.active_subscriptions} active subscriptions</div>
        </div>

        <div className="bg-[#11141b] border border-[#1d222e] p-5 rounded-2xl">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Outstanding Receivables</div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono">{formatINR(metrics.total_owed)}</div>
          <div className="text-xs text-rose-400 mt-2">{metrics.overdue_count} overdue invoices ({formatINR(metrics.overdue_amount)})</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Monthly Revenue Trend Bar Chart */}
        <div className="lg:col-span-8 bg-[#11141b] border border-[#1d222e] p-5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">
              Monthly Revenue Performance
            </h2>
            <span className="text-xs text-slate-400">Past 6 Months</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c212c" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#141822', borderColor: '#262e3e', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#33ea6a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Breakdown Pie Chart */}
        <div className="lg:col-span-4 bg-[#11141b] border border-[#1d222e] p-5 rounded-3xl space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">
            Subscription Plan Mix
          </h2>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="plan_name"
                >
                  {planBreakdown?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#141822', borderColor: '#262e3e', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#1c212c]">
            {planBreakdown?.map((item, idx) => (
              <div key={item.plan_name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-300">{item.plan_name}</span>
                </div>
                <span className="font-mono font-bold text-white">{item.count} subs</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

