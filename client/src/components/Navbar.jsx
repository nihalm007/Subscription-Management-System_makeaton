import React from 'react';
import { useAuth } from '../context/AuthContext';
import RoleBadge from './RoleBadge';
import { Layers, LogOut, ArrowRightLeft, Sparkles, UserCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, role, quickLogin, logout } = useAuth();

  const demoUsers = [
    { label: 'Admin', email: 'admin@brightloop.com', role: 'admin', desc: 'Full System Control' },
    { label: 'Sales Staff', email: 'sarah.sales@brightloop.com', role: 'staff', desc: 'Quotes & Subs' },
    { label: 'Customer (Acme)', email: 'john@acmeshop.com', role: 'customer', desc: 'Small Shop' },
    { label: 'Customer (MegaCorp)', email: 'lisa@megacorp.io', role: 'customer', desc: 'Enterprise Contract' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab(role === 'customer' ? 'portal' : 'dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-800 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-200">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Brightloop</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-semibold uppercase tracking-wider">
                  Subscriptions
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal">Recurring Billing & Revenue Management</p>
            </div>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 px-2 flex items-center gap-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
              Role:
            </span>
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
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                    isCurrent
                      ? 'bg-white text-purple-900 shadow-xs border border-slate-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title={`${u.email} (${u.desc})`}
                >
                  {u.label}
                </button>
              );
            })}
          </div>

          {/* Current User & Actions */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 justify-end">
                    {user.name}
                    <RoleBadge role={user.role} />
                  </div>
                  <div className="text-xs text-slate-500">
                    {user.company_name || user.email}
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

