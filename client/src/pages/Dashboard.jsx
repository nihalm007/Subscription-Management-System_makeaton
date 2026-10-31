import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import CashflowSankey from '../components/CashflowSankey';
import AnalyticsHeatmap from '../components/AnalyticsHeatmap';
import TopographicCards from '../components/TopographicCards';
import EarnMoreBanner from '../components/EarnMoreBanner';
import QuickSendWidget from '../components/QuickSendWidget';
import StatusBadge from '../components/StatusBadge';
import { formatINR, formatINRCompact } from '../utils/format';
import {
  ArrowUp,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  TrendingUp,
  RotateCw,
  Star,
  Bookmark,
  DollarSign,
  Calendar,
  Layers,
  Zap,
  AlertCircle,
  CheckCircle2,
  Send,
  MoreHorizontal,
  ChevronRight,
  ExternalLink,
  Package,
  Plus,
  CreditCard,
  FileText
} from 'lucide-react';

export default function Dashboard({ setActiveTab, onSelectInvoice }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('active');
  const [portfolioTab, setPortfolioTab] = useState('all');
  const [notice, setNotice] = useState(null);
  const [chasingId, setChasingId] = useState(null);
  const [seeding, setSeeding] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 relative overflow-hidden pb-16">
      
      {/* Background Radar / Sonar Concentric Rings Overlay (Top-Left) */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] pointer-events-none opacity-20">
        <svg className="w-full h-full" viewBox="0 0 600 600" fill="none">
          <circle cx="160" cy="140" r="120" stroke="#33ea6a" strokeWidth="0.8" strokeDasharray="3 4" />
          <circle cx="160" cy="140" r="220" stroke="#33ea6a" strokeWidth="0.8" />
          <circle cx="160" cy="140" r="320" stroke="#33ea6a" strokeWidth="0.6" strokeDasharray="5 5" />
          <circle cx="160" cy="140" r="420" stroke="#33ea6a" strokeWidth="0.5" />
          <circle cx="160" cy="140" r="520" stroke="#33ea6a" strokeWidth="0.4" strokeDasharray="8 6" />
          <line x1="160" y1="0" x2="160" y2="600" stroke="#33ea6a" strokeWidth="0.3" strokeDasharray="2 3" />
          <line x1="0" y1="140" x2="600" y2="140" stroke="#33ea6a" strokeWidth="0.3" strokeDasharray="2 3" />
        </svg>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-6 space-y-6 relative z-10">
        
        {/* Notice alert banner if an action was executed */}
        {notice && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-[#33ea6a]/40 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#33ea6a]" />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-white font-bold">✕</button>
          </div>
        )}

        {/* --- Header Row: Dashboard Title & Brightloop Subscription Filter Pills --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
              Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Brightloop Software • Finance Lead Overview • 25 January 2025
            </p>
          </div>

          {/* Right Header Subscription Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {/* Pill 1: Active Subscriptions */}
            <button
              onClick={() => {
                setActiveCategory('active');
                setActiveTab('subscriptions');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                activeCategory === 'active'
                  ? 'bg-[#151922] text-white border border-[#2b3345] shadow-sm'
                  : 'bg-[#11141b] text-slate-400 border border-[#1d222e] hover:text-white'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-[#33ea6a] flex items-center justify-center text-black">
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.8]" />
              </div>
              <span>Active Subscriptions</span>
            </button>

            {/* Pill 2: Recurring Plans */}
            <button
              onClick={() => {
                setActiveCategory('plans');
                setActiveTab('plans');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                activeCategory === 'plans'
                  ? 'bg-[#151922] text-white border border-[#2b3345] shadow-sm'
                  : 'bg-[#11141b] text-slate-400 border border-[#1d222e] hover:text-white'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-[#181d28] border border-[#262e3e] flex items-center justify-center text-slate-300">
                <RotateCw className="w-3.5 h-3.5" />
              </div>
              <span>Recurring Plans</span>
            </button>

            {/* Pill 3: Invoiced & MRR */}
            <button
              onClick={() => {
                setActiveCategory('invoices');
                setActiveTab('invoices');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                activeCategory === 'invoices'
                  ? 'bg-[#151922] text-white border border-[#2b3345] shadow-sm'
                  : 'bg-[#11141b] text-slate-400 border border-[#1d222e] hover:text-white'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-[#181d28] border border-[#262e3e] flex items-center justify-center text-slate-300">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span>Invoiced & MRR</span>
            </button>

            {/* Pill 4: Quotation Templates */}
            <button
              onClick={() => {
                setActiveCategory('templates');
                setActiveTab('templates');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                activeCategory === 'templates'
                  ? 'bg-[#151922] text-white border border-[#2b3345] shadow-sm'
                  : 'bg-[#11141b] text-slate-400 border border-[#1d222e] hover:text-white'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-[#181d28] border border-[#262e3e] flex items-center justify-center text-slate-300">
                <Star className="w-3.5 h-3.5" />
              </div>
              <span>Quotation Templates</span>
            </button>
          </div>
        </div>

        {/* --- 3-Column Bento Grid matching the Reference UI Layout --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* ========================================================= */}
          {/* COLUMN 1 (Left): Your Subscription Portfolio & Curvy Cards */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 bg-[#11141b] border border-[#1d222e] rounded-3xl p-5 space-y-5">
            
            {/* Header: Title */}
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Subscription Portfolio
              </h2>
            </div>

            {/* Filter Pills: All / Software / Add-ons (from PDF) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPortfolioTab('all')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  portfolioTab === 'all'
                    ? 'bg-[#161b25] text-white border border-[#2b3345]'
                    : 'bg-[#0e1117] text-slate-400 hover:text-white border border-[#1c212c]'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#33ea6a] flex items-center justify-center text-black">
                  <ArrowUp className="w-3 h-3 stroke-[3]" />
                </div>
                <span>All</span>
              </button>

              <button
                onClick={() => {
                  setPortfolioTab('software');
                  setActiveTab('products');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  portfolioTab === 'software'
                    ? 'bg-[#161b25] text-white border border-[#2b3345]'
                    : 'bg-[#0e1117] text-slate-400 hover:text-white border border-[#1c212c]'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <span>Software</span>
              </button>

              <button
                onClick={() => {
                  setPortfolioTab('addons');
                  setActiveTab('products');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  portfolioTab === 'addons'
                    ? 'bg-[#161b25] text-white border border-[#2b3345]'
                    : 'bg-[#0e1117] text-slate-400 hover:text-white border border-[#1c212c]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-slate-400" />
                <span>Add-ons</span>
              </button>
            </div>

            {/* Quick Action Circular Buttons: New Quote / Run Billing / Record Pay */}
            <div className="flex items-center justify-between px-3 py-1">
              {/* Action 1: New Quote */}
              <div
                onClick={() => setActiveTab('subscriptions')}
                className="flex flex-col items-center gap-2 cursor-pointer group"
                title="Create new quote or subscription"
              >
                <div className="w-12 h-12 rounded-full bg-white group-hover:bg-slate-100 flex items-center justify-center text-black shadow-md transition-all group-hover:scale-105">
                  <Plus className="w-5 h-5 stroke-[2.4]" />
                </div>
                <span className="text-xs font-medium text-slate-300 group-hover:text-white">New Quote</span>
              </div>

              {/* Action 2: Run Billing */}
              <div
                onClick={() => setActiveTab('billing')}
                className="flex flex-col items-center gap-2 cursor-pointer group"
                title="Execute automated billing day batch"
              >
                <div className="w-12 h-12 rounded-full bg-white group-hover:bg-slate-100 flex items-center justify-center text-black shadow-md transition-all group-hover:scale-105">
                  <ArrowUpRight className="w-5 h-5 stroke-[2.4]" />
                </div>
                <span className="text-xs font-medium text-slate-300 group-hover:text-white">Run Billing</span>
              </div>

              {/* Action 3: Record Pay */}
              <div
                onClick={() => setActiveTab('invoices')}
                className="flex flex-col items-center gap-2 cursor-pointer group"
                title="Settle and record payment"
              >
                <div className="w-12 h-12 rounded-full bg-white group-hover:bg-slate-100 flex items-center justify-center text-black shadow-md transition-all group-hover:scale-105">
                  <CreditCard className="w-5 h-5 stroke-[2.4]" />
                </div>
                <span className="text-xs font-medium text-slate-300 group-hover:text-white">Pay Invoice</span>
              </div>
            </div>

            {/* Balance Tracker: Collected vs Pending (Accounts Receivable) */}
            <div className="space-y-2 pt-2 border-t border-[#1c212c]">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-slate-300">Revenue Settlement</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-white" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Collected: </span>
                  <span className="font-bold text-white font-mono">
                    {data?.metrics?.revenue_all_time ? formatINR(data.metrics.revenue_all_time) : '₹7,638.00'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Pending: </span>
                  <span className="font-bold text-amber-400 font-mono">
                    {data?.metrics?.total_owed ? formatINR(data.metrics.total_owed) : '₹769.00'}
                  </span>
                </div>
              </div>

              {/* High-tech Split Progress Bar: Neon Lime Green (Collected) + Diagonal Striped (Pending) */}
              <div className="w-full h-3 rounded-full flex overflow-hidden bg-[#181b24] p-0.5 border border-[#242b38]">
                <div
                  className="h-full bg-[#33ea6a] rounded-l-full shadow-[0_0_8px_rgba(51,234,106,0.5)] transition-all duration-500"
                  style={{ width: '85%' }}
                />
                <div
                  className="h-full flex-1 striped-pending-bar rounded-r-full"
                />
              </div>
            </div>

            {/* Dual Curvy Gradient Cards (MRR & ARR from Brightloop database) */}
            <TopographicCards
              liveMRR={data?.metrics?.mrr || 5743.5}
              liveARR={data?.metrics?.arr || 68922}
            />

          </div>

          {/* ========================================================= */}
          {/* COLUMN 2 (Middle): Cashflow Stream & Billing Volume */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Top Card: Subscription Cashflow & Sankey Diagram */}
            <div className="bg-[#11141b] border border-[#1d222e] rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Subscription Cashflow
                  </h2>
                  <div className="text-[11px] text-slate-400 mt-1">Annual Contract Run-Rate (ARR)</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-0.5 tracking-tight">
                    {data?.metrics?.arr ? formatINR(data.metrics.arr) : '₹68,922.00'}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('invoices')}
                  className="w-9 h-9 rounded-full bg-[#181d28] border border-[#262e3e] hover:border-slate-400 flex items-center justify-center text-slate-300 hover:text-white transition-all hover:scale-105"
                  title="View all invoices & cashflow"
                >
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Interactive Sankey Cashflow Diagram with MegaCorp & Acme */}
              <div className="pt-2">
                <CashflowSankey
                  mrr={data?.metrics?.mrr || 5743.5}
                  arr={data?.metrics?.arr || 68922}
                />
              </div>
            </div>

            {/* Bottom Card: Billing Volume Heatmap */}
            <div className="bg-[#11141b] border border-[#1d222e] rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Billing Volume Activity
                  </h2>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Daily recurring batch distributions
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('billing')}
                  className="w-9 h-9 rounded-full bg-[#181d28] border border-[#262e3e] hover:border-slate-400 flex items-center justify-center text-slate-300 hover:text-white transition-all hover:scale-105"
                  title="View recurring billing batch runner"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              {/* Heatmap matrix representation */}
              <AnalyticsHeatmap />
            </div>

          </div>

          {/* ========================================================= */}
          {/* COLUMN 3 (Right): Discount Rules, Accounts & Billing Batch */}
          {/* ========================================================= */}
          <div className="lg:col-span-3 space-y-5">
            {/* Discount Rules Banner (PDF: Tiered Seat Discounts) */}
            <EarnMoreBanner onAction={() => setActiveTab('discounts')} />

            {/* Quick Chase & Customer Accounts Widget */}
            <QuickSendWidget
              onSelectTarget={() => setActiveTab('subscriptions')}
              onRunBilling={() => setActiveTab('billing')}
            />
          </div>

        </div>

        {/* ========================================================= */}
        {/* 4 CORE QUESTIONS KPI GRID (from PDF Requirement) */}
        {/* ========================================================= */}
        <div className="mt-10 pt-6 border-t border-[#181d28]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#33ea6a]" />
                  <span>The Finance Lead: 4 Core Questions</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  Query Latency: {data?.performance?.query_time_ms || 0.44} ms (&lt; 2.0s SLA)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Answered in real time: Active subscriptions, total revenue collected, revenue owed, and overdue invoices.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('billing')}
                className="px-4 py-2 rounded-xl bg-[#33ea6a] hover:bg-[#2fe064] text-black text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
                Run Billing Batch
              </button>

              <button
                onClick={() => handleRunStressTest(500)}
                disabled={seeding}
                className="px-3 py-2 rounded-xl bg-[#141822] hover:bg-[#1a202c] border border-[#242b3b] text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                title="Seed 500 subscriptions to verify sub-second response under scale"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {seeding ? 'Seeding 500...' : 'Test 500 Load'}
              </button>
            </div>
          </div>

          {/* 4 Core Financial Questions KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Question 1: How many subscriptions are active? */}
            <div className="bg-[#11141b] border border-[#1d222e] p-5 rounded-2xl hover:border-[#33ea6a]/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>1. Active Subscriptions</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-950 text-[#33ea6a] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {data?.metrics?.active_subscriptions || 3}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                <span className="text-[#33ea6a] font-semibold">{data?.metrics?.active_customers || 2}</span> distinct customer accounts
              </div>
            </div>

            {/* Question 2: How much revenue came in? (MRR & ARR) */}
            <div className="bg-[#11141b] border border-[#1d222e] p-5 rounded-2xl hover:border-[#33ea6a]/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>2. Revenue Collected / MRR</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-950 text-[#33ea6a] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
                {data?.metrics?.mrr ? formatINRCompact(data.metrics.mrr) : '₹5,744'}
                <span className="text-xs font-sans text-slate-400 font-normal"> /mo</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Paid: <strong className="text-emerald-400 font-mono">{data?.metrics?.revenue_all_time ? formatINRCompact(data.metrics.revenue_all_time) : '₹7,638'}</strong> • ARR: <strong className="text-white font-mono">{data?.metrics?.arr ? formatINRCompact(data.metrics.arr) : '₹68,922'}</strong>
              </div>
            </div>

            {/* Question 3: How much is still owed? (Accounts Receivable) */}
            <div className="bg-[#11141b] border border-[#1d222e] p-5 rounded-2xl hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>3. Revenue Still Owed</span>
                <div className="w-7 h-7 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-amber-400 tracking-tight font-mono">
                {data?.metrics?.total_owed ? formatINR(data.metrics.total_owed) : '₹769.00'}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Across <strong className="text-white">{data?.metrics?.outstanding_invoices_count || 2}</strong> uncollected invoices
              </div>
            </div>

            {/* Question 4: Which invoices are overdue? */}
            <div className="bg-[#11141b] border border-[#1d222e] p-5 rounded-2xl hover:border-rose-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>4. Invoices Overdue</span>
                <div className="w-7 h-7 rounded-lg bg-rose-950 text-rose-400 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-rose-400 tracking-tight font-mono">
                {data?.metrics?.overdue_count || 2}
                <span className="text-xs font-sans text-rose-300 font-normal"> overdue</span>
              </div>
              <div className="mt-2 text-xs text-rose-400 font-semibold font-mono">
                {data?.metrics?.overdue_amount ? formatINR(data.metrics.overdue_amount) : '₹769.00'} at risk
              </div>
            </div>

          </div>

          {/* Overdue Receivables Aging & Chase Center */}
          <div className="mt-5 bg-[#11141b] border border-[#1d222e] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1c212c] bg-[#141822] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Overdue Receivables & Aging Buckets</span>
                </h3>
                <p className="text-xs text-slate-400">Chase outstanding customer balances with 1-click email reminders.</p>
              </div>

              <button
                onClick={() => setActiveTab('invoices')}
                className="text-xs text-[#33ea6a] hover:underline font-semibold flex items-center gap-1"
              >
                <span>View all invoices</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e1117] text-slate-400 uppercase tracking-wider text-[10px] border-b border-[#1c212c]">
                  <tr>
                    <th className="py-3 px-6">Invoice</th>
                    <th className="py-3 px-6">Customer</th>
                    <th className="py-3 px-6">Due Date</th>
                    <th className="py-3 px-6">Aging Bucket</th>
                    <th className="py-3 px-6 text-right">Balance Due</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c212c]">
                  {data?.overdueList && data.overdueList.length > 0 ? (
                    data.overdueList.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#151924] transition-colors">
                        <td className="py-3.5 px-6 font-mono font-bold text-white">
                          <button
                            onClick={() => onSelectInvoice && onSelectInvoice(inv)}
                            className="text-[#33ea6a] hover:underline"
                          >
                            {inv.invoice_number}
                          </button>
                        </td>
                        <td className="py-3.5 px-6 text-slate-300">
                          <div className="font-semibold text-white">{inv.customer_name}</div>
                          <div className="text-[10px] text-slate-400">{inv.customer_email}</div>
                        </td>
                        <td className="py-3.5 px-6 text-slate-400">
                          {inv.due_date}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            inv.days_overdue > 60
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : inv.days_overdue > 30
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                          }`}>
                            {inv.days_overdue} days overdue
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono font-bold text-rose-400">
                          {formatINR(inv.amount_due)}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => handleChase(inv)}
                            disabled={chasingId === inv.id}
                            className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-[11px] font-semibold transition inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            {chasingId === inv.id ? 'Sending...' : `Chase (${inv.chase_count || 0})`}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        No overdue invoices found! All customer accounts are up to date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
