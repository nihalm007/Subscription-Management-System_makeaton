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
  Shield,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, role, isCustomer } = useAuth();

  const navigation = [
    {
      group: 'Core Billing',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
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
        { id: 'audit', label: 'Audit Logs', icon: Shield, roles: ['admin', 'staff'] },
      ]
    },
    {
      group: 'Client Portal',
      items: [
        { id: 'portal', label: 'Customer Portal', icon: ExternalLink, roles: ['customer', 'admin', 'staff'], badge: isCustomer ? 'My Account' : 'Preview' }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#0a0d13] text-slate-300 flex-shrink-0 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 border-r border-[#161a23]">
      <div className="space-y-6">
        
        {/* Workspace Card */}
        <div className="p-3 bg-[#11141c] rounded-2xl border border-[#1d222e]">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Active Workspace
          </div>
          <div className="font-bold text-white truncate text-sm">
            {role === 'customer' ? (user?.company_name || user?.name) : 'Brightloop Software'}
          </div>
          <div className="text-[11px] text-[#33ea6a] font-mono mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#33ea6a] animate-pulse" />
            <span>ROLE: {role?.toUpperCase()}</span>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-6">
          {navigation.map((group, gIdx) => {
            const visibleItems = group.items.filter(item => item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
                  {group.group}
                </div>
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#33ea6a] text-black shadow-sm font-bold'
                          : 'text-slate-300 hover:bg-[#131720] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                          isActive
                            ? 'bg-black/20 text-black'
                            : 'bg-[#181d28] text-slate-400 border border-[#262e3e]'
                        }`}>
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

      <div className="p-3 bg-[#11141b] rounded-2xl border border-[#1d222e] text-[11px] text-slate-400 text-center">
        Brightloop Subscriptions Engine
      </div>
    </aside>
  );
}
