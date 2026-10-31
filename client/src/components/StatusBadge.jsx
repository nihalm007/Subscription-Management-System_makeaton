import React from 'react';

export default function StatusBadge({ status, isOverdue }) {
  if (isOverdue && status !== 'Paid' && status !== 'Cancelled') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse"></span>
        Overdue
      </span>
    );
  }

  const styles = {
    Draft: 'bg-slate-100 text-slate-700 border-slate-200',
    Quotation: 'bg-amber-50 text-amber-700 border-amber-200',
    Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Paused: 'bg-purple-50 text-purple-700 border-purple-200',
    Closed: 'bg-gray-100 text-gray-500 border-gray-200',
    Paid: 'bg-teal-50 text-teal-700 border-teal-200',
    Cancelled: 'bg-rose-50 text-rose-600 border-rose-200'
  };

  const dotColors = {
    Draft: 'bg-slate-400',
    Quotation: 'bg-amber-500',
    Confirmed: 'bg-blue-500',
    Active: 'bg-emerald-500',
    Paused: 'bg-purple-500',
    Closed: 'bg-gray-400',
    Paid: 'bg-teal-500',
    Cancelled: 'bg-rose-400'
  };

  const currentStyle = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  const dotColor = dotColors[status] || 'bg-slate-400';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`}></span>
      {status}
    </span>
  );
}

