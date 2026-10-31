import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import RoleBadge from './RoleBadge';
import {
  LayoutGrid,
  PieChart,
  Calendar,
  MessageSquare,
  ChevronDown,
  Layers,
  Receipt,
  CalendarCheck,
  CreditCard,
  Package,
  FileText,
  Tag,
  Percent,
  Users,
  LogOut,
  ArrowRightLeft,
  ExternalLink,
  Shield,
  Sparkles
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, role, quickLogin, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const menuRef = useRef(null);
  const appsRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowRoleMenu(false);
      }
      if (appsRef.current && !appsRef.current.contains(event.target)) {
        setShowAppsMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const demoUsers = [
    { label: 'Admin (David)', email: 'admin@brightloop.com', role: 'admin', desc: 'Full System Control' },
    { label: 'Sarah (Sales Rep)', email: 'sarah.sales@brightloop.com', role: 'staff', desc: 'Quotes & Subs' },
    { label: 'John (Acme Shop)', email: 'john@acmeshop.com', role: 'customer', desc: 'Small Shop Monthly' },
    { label: 'Lisa (MegaCorp)', email: 'lisa@megacorp.io', role: 'customer', desc: 'Enterprise Yearly' },
  ];

  const appModules = [
    { id: 'subscriptions', label: 'Subscriptions', icon: Layers, desc: 'Lifecycle & Contract States' },
    { id: 'billing', label: 'Billing Day Runner', icon: CalendarCheck, desc: 'Recurring Batch Invoicing' },
    { id: 'invoices', label: 'Invoices & Overdue', icon: Receipt, desc: 'AR Tracking & Chase Center' },
    { id: 'payments', label: 'Payments', icon: CreditCard, desc: 'Payment Transactions' },
    { id: 'products', label: 'Products & Variants', icon: Package, desc: 'Catalog & Odoo Brand Variant' },
    { id: 'plans', label: 'Subscription Plans', icon: Calendar, desc: 'Daily, Weekly, Monthly, Yearly' },
    { id: 'templates', label: 'Quotation Templates', icon: FileText, desc: 'Pre-set Product Bundles' },
    { id: 'discounts', label: 'Discount Rules', icon: Tag, desc: 'Tiered & Percentage Codes' },
    { id: 'taxes', label: 'Tax Rules', icon: Percent, desc: 'Jurisdiction Rates' },
    { id: 'portal', label: 'Customer Portal', icon: ExternalLink, desc: 'Client Self-Service View' },
    { id: 'audit', label: 'Audit Logs', icon: Shield, desc: 'Email Dispatch & System Trail' },
  ];

  const firstName = user?.name ? user.name.split(' ')[0] : 'David';

  return (
    <header className="w-full bg-[#08090d]/85 backdrop-blur-md border-b border-[#161a23] sticky top-0 z-40 px-4 sm:px-8 py-3">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
        
        {/* --- Left: Brightloop Subscriptions Brand Logo --- */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#33ea6a] to-[#0ea5e9] flex items-center justify-center p-0.5 shadow-sm group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#08090d] rounded-[10px] flex items-center justify-center">
              <span className="text-[#33ea6a] font-extrabold text-sm tracking-tighter">BL</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl text-white tracking-tight leading-none">
                Brightloop
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#33ea6a]/15 text-[#33ea6a] font-bold border border-[#33ea6a]/30">
                Odoo
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Subscription Management System</p>
          </div>
        </div>

        {/* --- Center: Futuristic Navigation Island --- */}
        <nav className="flex items-center gap-1.5 bg-[#12151d] p-1.5 rounded-full border border-[#1e2330] shadow-inner">
          
          {/* Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'border border-[#33ea6a] bg-[#33ea6a]/10 text-[#33ea6a] shadow-[0_0_12px_rgba(51,234,106,0.25)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          {/* Subscriptions Tab */}
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'subscriptions'
                ? 'border border-[#33ea6a] bg-[#33ea6a]/10 text-[#33ea6a] shadow-[0_0_12px_rgba(51,234,106,0.25)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Subscriptions</span>
          </button>

          {/* Billing Day Tab */}
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'billing'
                ? 'border border-[#33ea6a] bg-[#33ea6a]/10 text-[#33ea6a] shadow-[0_0_12px_rgba(51,234,106,0.25)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Billing Day</span>
          </button>

          {/* Invoices & Overdue Tab */}
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'invoices'
                ? 'border border-[#33ea6a] bg-[#33ea6a]/10 text-[#33ea6a] shadow-[0_0_12px_rgba(51,234,106,0.25)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Invoices</span>
          </button>

          {/* Analytics Tab */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'border border-[#33ea6a] bg-[#33ea6a]/10 text-[#33ea6a] shadow-[0_0_12px_rgba(51,234,106,0.25)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>

          {/* All Features Dropdown Menu */}
          <div className="relative" ref={appsRef}>
            <button
              onClick={() => setShowAppsMenu(!showAppsMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                !['dashboard', 'subscriptions', 'billing', 'invoices', 'analytics'].includes(activeTab)
                  ? 'border border-[#33ea6a] bg-[#33ea6a]/10 text-[#33ea6a]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>More</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showAppsMenu && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#11141b] border border-[#202636] rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5 border-b border-white/5 mb-1">
                  Brightloop Modules
                </div>
                <div className="max-h-80 overflow-y-auto space-y-1">
                  {appModules.map((mod) => {
                    const Icon = mod.icon;
                    const isModActive = activeTab === mod.id;
                    return (
                      <button
                        key={mod.id}
                        onClick={() => {
                          setActiveTab(mod.id);
                          setShowAppsMenu(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
                          isModActive
                            ? 'bg-[#33ea6a]/15 text-[#33ea6a] font-semibold'
                            : 'text-slate-300 hover:bg-[#1a202c] hover:text-white'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${isModActive ? 'bg-[#33ea6a] text-black' : 'bg-[#181d28] text-slate-400'}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs leading-none">{mod.label}</div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">{mod.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* --- Right: User Profile & Role Switcher --- */}
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          
          <div
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 cursor-pointer bg-[#12151d] hover:bg-[#181c26] border border-[#1e2330] rounded-full pl-3.5 pr-1.5 py-1 transition-all"
          >
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-200">
                Hi, 👋 {firstName}
              </span>
            </div>

            {/* Glowing Avatar */}
            <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-sm flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                alt="David"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>

          {/* Role Switcher & Account Dropdown */}
          {showRoleMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#11141b] border border-[#202636] rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="pb-3 border-b border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    {user?.name || 'David'}
                    <RoleBadge role={user?.role} />
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">
                    {user?.email || 'admin@brightloop.com'}
                  </div>
                </div>
              </div>

              {/* Demo 1-Click Role Switcher */}
              <div className="mt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1 mb-2 flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3 text-[#33ea6a]" />
                  <span>Switch Demo Role (1-Click)</span>
                </div>
                <div className="space-y-1">
                  {demoUsers.map((u) => {
                    const isCurrent = user?.email === u.email;
                    return (
                      <button
                        key={u.email}
                        onClick={async () => {
                          await quickLogin(u.email);
                          if (u.role === 'customer') {
                            setActiveTab('portal');
                          } else if (activeTab === 'portal') {
                            setActiveTab('dashboard');
                          }
                          setShowRoleMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                          isCurrent
                            ? 'bg-[#33ea6a]/15 text-[#33ea6a] font-semibold border border-[#33ea6a]/30'
                            : 'text-slate-300 hover:bg-[#181d28] hover:text-white'
                        }`}
                      >
                        <div className="text-left">
                          <div className="font-medium">{u.label}</div>
                          <div className="text-[10px] text-slate-500">{u.desc}</div>
                        </div>
                        {isCurrent && <span className="text-[10px] text-[#33ea6a] font-bold">Active</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logout Action */}
              <div className="mt-3 pt-2 border-t border-white/5">
                <button
                  onClick={() => {
                    logout();
                    setShowRoleMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
