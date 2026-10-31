import React from 'react';
import { Tag, ArrowRight } from 'lucide-react';

export default function EarnMoreBanner({ onAction }) {
  return (
    <div className="bg-[#11141b] border border-[#1d222e] rounded-3xl p-5 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#33ea6a]/5 rounded-full blur-2xl pointer-events-none" />

      <h3 className="text-base font-bold text-white tracking-tight flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#33ea6a]" />
          Tiered Seat Discounts
        </span>
      </h3>

      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
        Configure automated volume discounts: fixed or %, min seats, usage limits, and auto-expiry on billing.
      </p>

      <div className="mt-4 flex items-center justify-start">
        <button
          onClick={onAction}
          className="px-5 py-2 rounded-full bg-[#33ea6a] hover:bg-[#2fe064] text-black text-xs font-extrabold uppercase tracking-wider transition-all duration-200 transform hover:scale-[1.02] shadow-sm flex items-center gap-1.5"
        >
          <span>MANAGE RULES</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
