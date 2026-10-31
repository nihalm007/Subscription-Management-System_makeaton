import React, { useState } from 'react';
import { ArrowUpRight, Plus, Send, CheckCircle2, Calendar, Receipt } from 'lucide-react';
import { api } from '../services/api';

export default function QuickSendWidget({ onSelectTarget, onRunBilling }) {
  const [sentNotice, setSentNotice] = useState(null);
  const [chasing, setChasing] = useState(false);

  const customers = [
    {
      id: 1,
      name: 'John',
      company: 'Acme Shop',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      glow: 'border-amber-400'
    },
    {
      id: 2,
      name: 'Lisa',
      company: 'MegaCorp Enterprise',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
      glow: 'border-purple-500'
    },
    {
      id: 3,
      name: 'Sarah',
      company: 'Sales Team',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      glow: 'border-emerald-400'
    }
  ];

  const handleChaseQuick = async (email, invNum) => {
    setChasing(true);
    setSentNotice(`Overdue reminder dispatched to ${email} for invoice ${invNum}`);
    setTimeout(() => setSentNotice(null), 4000);
    setChasing(false);
  };

  return (
    <div className="space-y-4">
      {sentNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#33ea6a] flex-shrink-0" />
          <span>{sentNotice}</span>
        </div>
      )}

      {/* Quick Chase & Customer Accounts Container */}
      <div className="bg-[#11141b] border border-[#1d222e] rounded-3xl p-5">
        <h3 className="text-base font-bold text-white tracking-tight mb-3 flex items-center justify-between">
          <span>Active Customers</span>
          <span className="text-[11px] text-slate-400 font-normal">Quick Action</span>
        </h3>

        {/* Customer Avatars */}
        <div className="flex items-center gap-2.5 pb-2">
          {customers.map((c) => (
            <div
              key={c.id}
              onClick={() => handleChaseQuick(c.company, 'INV-2026-00001')}
              className={`w-11 h-11 rounded-full p-0.5 border-2 ${c.glow} cursor-pointer hover:scale-105 transition-transform flex-shrink-0`}
              title={`${c.name} (${c.company})`}
            >
              <img
                src={c.avatar}
                alt={c.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          ))}

          <button
            onClick={() => onSelectTarget && onSelectTarget()}
            className="w-11 h-11 rounded-full bg-[#181d28] border border-[#262e3e] hover:border-slate-500 flex items-center justify-center text-slate-300 hover:text-white transition-colors flex-shrink-0"
            title="Add customer offer or view subscribers"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Invoice & AR Quick Chase Card */}
        <div className="mt-3 bg-[#151922] border border-[#212735] rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>AR Chase Queue</span>
            <span className="font-bold text-[#33ea6a]">2 Overdue</span>
          </div>

          {/* Item 1: Acme Shop */}
          <div
            onClick={() => handleChaseQuick('john@acmeshop.com', 'INV-2026-00001')}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1a202c] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800 flex items-center justify-center">
                <Send className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Acme Shop</div>
                <div className="text-[10px] text-rose-400 font-medium">35 days overdue</div>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-400 font-mono">₹450.00</span>
          </div>

          {/* Item 2: Odoo Brand Variant add-on */}
          <div
            onClick={() => handleChaseQuick('sarah.sales@brightloop.com', 'INV-2026-00002')}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1a202c] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#33ea6a]/15 text-[#33ea6a] flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Odoo Brand License</div>
                <div className="text-[10px] text-slate-400">Variant (+₹560)</div>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-300 font-mono">₹319.00</span>
          </div>
        </div>
      </div>

      {/* Billing Day Automated Batch Card */}
      <div className="bg-[#11141b] border border-[#1d222e] rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono font-semibold text-slate-200">
            Billing Batch #4-554
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#33ea6a] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#33ea6a] animate-pulse" />
            <span>Recurring Engine</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            Automated Generation
          </div>
          <div className="text-2xl font-extrabold text-white font-mono mt-0.5">
            ₹29,125.00
          </div>
        </div>

        <button
          onClick={() => onRunBilling ? onRunBilling() : onSelectTarget()}
          className="w-full mt-4 py-2.5 rounded-full bg-[#33ea6a] hover:bg-[#2fe064] text-black text-xs font-extrabold uppercase tracking-wider transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
        >
          <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>EXECUTE BILLING DAY</span>
        </button>
      </div>
    </div>
  );
}
