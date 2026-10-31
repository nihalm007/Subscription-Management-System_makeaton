import React from 'react';
import { formatINR } from '../utils/format';

export default function CashflowSankey({ mrr = 5743.5, arr = 68922 }) {
  return (
    <div className="w-full h-44 relative select-none">
      <svg className="w-full h-full" viewBox="0 0 520 160" preserveAspectRatio="none">
        <defs>
          {/* Gradients for subscription cashflow ribbons */}
          <linearGradient id="streamMegaCorp" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e223d" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#252c56" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#2b356d" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="streamAcme" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1f422b" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#264e33" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#243d3b" stopOpacity="0.85" />
          </linearGradient>

          <linearGradient id="streamOutSoftware" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2b356d" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="streamOutOdoo" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#223f38" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#166534" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="streamOutAddons" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1d3056" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* --- Left Flow 1: MegaCorp Enterprise Contract into Invoiced --- */}
        <path
          d="M 90 20 C 170 20, 200 28, 260 30 L 260 84 C 200 82, 170 62, 90 62 Z"
          fill="url(#streamMegaCorp)"
        />

        {/* --- Left Flow 2: Acme Shop & SMBs into Invoiced --- */}
        <path
          d="M 90 98 C 170 98, 200 84, 260 84 L 260 138 C 170 138, 170 142, 90 142 Z"
          fill="url(#streamAcme)"
        />

        {/* --- Right Flow 1: Invoiced to Core Software Plans --- */}
        <path
          d="M 268 30 C 340 30, 390 38, 480 40 L 480 82 C 390 80, 340 70, 268 70 Z"
          fill="url(#streamOutSoftware)"
        />

        {/* --- Right Flow 2: Invoiced to Odoo Brand Variants (+₹560) --- */}
        <path
          d="M 268 70 C 340 70, 390 82, 480 82 L 480 120 C 390 120, 340 105, 268 105 Z"
          fill="url(#streamOutOdoo)"
        />

        {/* --- Right Flow 3: Invoiced to Add-ons & Taxes --- */}
        <path
          d="M 268 105 C 340 105, 390 120, 480 120 L 480 142 C 390 142, 340 138, 268 138 Z"
          fill="url(#streamOutAddons)"
        />

        {/* Vertical Center Divider Bar ("Invoiced") */}
        <rect x="260" y="32" width="7" height="106" rx="3.5" fill="#38bdf8" />
        <line x1="263.5" y1="36" x2="263.5" y2="134" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Right Vertical Bar ("Software / Odoo Brand / Addons") */}
        <rect x="480" y="40" width="6" height="42" rx="3" fill="#3b82f6" />
        <rect x="480" y="85" width="6" height="35" rx="3" fill="#22c55e" />
        <rect x="480" y="123" width="6" height="19" rx="3" fill="#0284c7" />

        {/* Center label */}
        <text x="263.5" y="88" fill="#38bdf8" fontSize="10" fontWeight="600" textAnchor="middle" transform="rotate(-90 263.5 88)">
          Invoiced
        </text>

        {/* Right branch labels */}
        <text x="466" y="58" fill="#93c5fd" fontSize="9" fontWeight="500" textAnchor="end">Software Plans</text>
        <text x="466" y="98" fill="#86efac" fontSize="9" fontWeight="500" textAnchor="end">Odoo Brand (+₹560)</text>
        <text x="466" y="132" fill="#7dd3fc" fontSize="9" fontWeight="500" textAnchor="end">Add-ons & Taxes</text>
      </svg>

      {/* Left Node 1: MegaCorp Enterprise */}
      <div className="absolute left-1 top-2 bg-[#171b30] border border-[#2b356d] rounded-lg px-2.5 py-1 text-left shadow-sm">
        <div className="text-[10px] text-slate-300 font-medium">MegaCorp (Yearly)</div>
        <div className="text-[11px] font-bold text-white tracking-tight">₹4,950/mo</div>
      </div>

      {/* Left Node 2: Acme Shop & SMBs */}
      <div className="absolute left-1 bottom-2 bg-[#172e20] border border-[#245435] rounded-lg px-2.5 py-1 text-left shadow-sm">
        <div className="text-[10px] text-emerald-300 font-medium">Acme Shop (Monthly)</div>
        <div className="text-[11px] font-bold text-emerald-200 tracking-tight">₹793/mo</div>
      </div>
    </div>
  );
}
