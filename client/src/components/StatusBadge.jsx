import React from 'react';

export default function StatusBadge({ status, isOverdue }) {
  if (isOverdue && status !== 'Paid' && status !== 'Cancelled') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5 animate-pulse"></span>
        Overdue
      </span>
    );
  }

  const styles = {
    Draft: 'bg-[#181d28] text-slate-300 border-[#262e3e]',
    Quotation: 'bg-amber-950/70 text-amber-300 border-amber-800',
    Confirmed: 'bg-sky-950/70 text-sky-300 border-sky-800',
    Active: 'bg-emerald-950/80 text-[#33ea6a] border-[#33ea6a]/40 shadow-[0_0_8px_rgba(51,234,106,0.15)]',
    Paused: 'bg-purple-950/70 text-purple-300 border-purple-800',
    Closed: 'bg-[#141720] text-slate-500 border-[#202532]',
    Paid: 'bg-teal-950/70 text-teal-300 border-teal-800',
    Cancelled: 'bg-rose-950/70 text-rose-300 border-rose-800'
  };

  const dotColors = {
    Draft: 'bg-slate-400',
    Quotation: 'bg-amber-400',
    Confirmed: 'bg-sky-400',
    Active: 'bg-[#33ea6a]',
    Paused: 'bg-purple-400',
    Closed: 'bg-slate-600',
    Paid: 'bg-teal-400',
    Cancelled: 'bg-rose-400'
  };

  const currentStyle = styles[status] || 'bg-[#181d28] text-slate-300 border-[#262e3e]';
  const dotColor = dotColors[status] || 'bg-slate-400';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${currentStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`}></span>
      {status}
    </span>
  );
}
