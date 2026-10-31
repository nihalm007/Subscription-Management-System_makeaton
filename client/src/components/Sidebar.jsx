import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Layers,
  CalendarCheck,
  Receipt,
  CreditCard,
  Package,
  Calendar,
  FileText,
  Tag,
  Percent,
  Users,
  UserCheck,
  Mail,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, role, isAdmin, isStaff, isCustomer } = useAuth();

  const navigation = [
    {
      group: 'Core Billing',
      items: [
        { id: 'dashboard', label: 'Finance Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
        { id: 'subscriptions', label: 'Subscriptions', icon: Layers, roles: ['admin', 'staff'] },
        { id: 'billing', label: 'Billing Day Runner', icon: CalendarCheck, roles: ['admin', 'staff'], badge: 'Auto' },
        { id: 'invoices', label: 'Invoices & Overdue', icon: Receipt, roles: ['admin', 'staff'] },
        { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'staff'] },
      ]
    },
    {
      group: 'Catalog & Templates',
      items: [
        { id: 'products', label: 'Products & Variants', icon: Package, roles: ['admin', 'staff'] },
        { id: 'plans', label: 'Subscription Plans', icon: Calendar, roles: ['admin', 'staff'] },
        { id: 'templates', label: 'Quotation Templates', icon: FileText, roles: ['admin', 'staff'] },
      ]
    },
    {
      group: 'Admin Control',
      items: [
        { id: 'discounts', label: 'Discount Rules', icon: Tag, roles: ['admin'], badge: 'Admin' },
        { id: 'taxes', label: 'Tax Rules', icon: Percent, roles: ['admin'], badge: 'Admin' },
        { id: 'staff', label: 'Staff Management', icon: Users, roles: ['admin'], badge: 'Admin' },
        { id: 'audit', label: 'Email & Audit Logs', icon: Mail, roles: ['admin', 'staff'] },
      ]
    },
    {
      group: 'Customer Experience',
      items: [
        { id: 'portal', label: 'Customer Portal', icon: ExternalLink, roles: ['customer', 'admin', 'staff'], badge: isCustomer ? 'My Account' : 'Preview' }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <div className="space-y-6">
        
        {/* User Card */}
        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Active Workspace
          </div>
          <div className="font-semibold text-white truncate text-sm">
            {role === 'customer' ? (user?.company_name || user?.name) : 'Brightloop Software'}
          </div>
          <div className="text-xs text-purple-300 font-mono mt-0.5">
            Role: {role.toUpperCase()}
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-6">
          {navigation.map((group, gIdx) => {
            const visibleItems = group.items.filter(item => item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3">
                  {group.group}
                </div>
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/40 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                            isActive
                              ? 'bg-purple-700 text-purple-100'
                              : item.badge === 'Admin'
                              ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        <p>Brightloop Subscriptions v2.0</p>
        <p className="text-[11px] text-slate-600">Engineered for Odoo Makeathon</p>
      </div>
    </aside>
  );
}

