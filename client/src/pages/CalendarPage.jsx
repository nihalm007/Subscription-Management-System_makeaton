import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Calendar, ChevronLeft, ChevronRight, Clock, Zap, Layers, CheckCircle2 } from 'lucide-react';
import { formatINR } from '../utils/format';

export default function CalendarPage({ setActiveTab }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('2026-11-05');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getSubscriptions();
        setSubscriptions(res.subscriptions || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = [
    { day: 1, active: false, events: 0 },
    { day: 2, active: false, events: 0 },
    { day: 3, active: false, events: 1, type: 'quote' },
    { day: 4, active: false, events: 0 },
    { day: 5, active: true, events: 3, type: 'billing', label: 'Billing Run' },
    { day: 6, active: false, events: 0 },
    { day: 7, active: false, events: 0 },
    { day: 8, active: false, events: 1, type: 'renewal' },
    { day: 9, active: false, events: 0 },
    { day: 10, active: false, events: 2, type: 'invoice' },
    { day: 11, active: false, events: 0 },
    { day: 12, active: false, events: 0 },
    { day: 13, active: false, events: 0 },
    { day: 14, active: false, events: 1, type: 'billing' },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Recurring Billing & Renewal Calendar
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated invoice batch schedule, contract milestones, and upcoming customer renewals.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('billing')}
          className="px-4 py-2 rounded-full bg-[#33ea6a] hover:bg-[#2fe064] text-black text-xs font-bold transition flex items-center gap-2 self-start"
        >
          <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Execute Billing Day</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Calendar Grid */}
        <div className="lg:col-span-8 bg-[#11141b] border border-[#1d222e] rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#33ea6a]" />
              <span className="font-bold text-white text-base">November 2026</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button className="p-1.5 rounded-lg bg-[#181d28] border border-[#242b3b] text-slate-300 hover:text-white">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg bg-[#181d28] border border-[#242b3b] text-slate-300 hover:text-white">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {daysOfWeek.map((d) => (
              <div key={d} className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-1">
                {d}
              </div>
            ))}

            {calendarDays.map((c, idx) => (
              <div
                key={idx}
                className={`h-20 rounded-2xl p-2 text-left border transition-all flex flex-col justify-between cursor-pointer ${
                  c.active
                    ? 'bg-[#33ea6a]/10 border-[#33ea6a] shadow-[0_0_12px_rgba(51,234,106,0.15)]'
                    : 'bg-[#151922] border-[#1e2432] hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${c.active ? 'text-[#33ea6a]' : 'text-slate-300'}`}>
                    {c.day}
                  </span>
                  {c.events > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#33ea6a]" />
                  )}
                </div>

                {c.label && (
                  <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#33ea6a] text-black truncate">
                    {c.label}
                  </div>
                )}
                {c.type === 'quote' && (
                  <div className="text-[9px] font-semibold text-slate-400 truncate">
                    1 Expiring
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Milestone Schedule */}
        <div className="lg:col-span-4 bg-[#11141b] border border-[#1d222e] rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#33ea6a]" />
            <span>Upcoming Milestones</span>
          </h2>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#151922] border border-[#212735] space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Next Automated Billing Batch</span>
                <span className="text-[#33ea6a] font-mono">05 Nov 2026</span>
              </div>
              <p className="text-[11px] text-slate-400">
                1 active subscription queued for automatic invoice generation & dispatch.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#151922] border border-[#212735] space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>MegaCorp Enterprise Annual Renewal</span>
                <span className="text-sky-400 font-mono">2027-10-31</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Annual renewal contract with 10% auto-discount applied.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#151922] border border-[#212735] space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Overdue Invoices Follow-up</span>
                <span className="text-rose-400 font-mono">Daily automated</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automated chase reminders dispatched at 09:00 UTC.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

