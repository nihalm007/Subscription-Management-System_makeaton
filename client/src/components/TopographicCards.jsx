import React, { useState } from 'react';
import { MoreHorizontal, ArrowUpRight, RefreshCw, Layers, Zap } from 'lucide-react';
import { formatINR, formatINRCompact } from '../utils/format';

export default function TopographicCards({ liveMRR = 5743.5, liveARR = 68922 }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full relative select-none mt-4">
      {/* --- Top Lime Green Card: Monthly Recurring Revenue (MRR) --- */}
      <div className="relative z-10 w-full rounded-3xl p-5 overflow-hidden shadow-lg transition-all duration-300"
           style={{
             background: 'linear-gradient(135deg, #3df06d 0%, #17c853 60%, #0db846 100%)',
             color: '#08170c'
           }}>
        
        {/* Topographic Contour Lines SVG Texture */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" viewBox="0 0 340 180" fill="none">
          <path d="M-20,120 Q60,40 160,80 T360,60" stroke="#043d14" strokeWidth="1.2" fill="none" />
          <path d="M-20,90 Q80,20 180,60 T360,30" stroke="#043d14" strokeWidth="1.2" fill="none" />
          <path d="M-20,60 Q100,0 200,40 T360,10" stroke="#043d14" strokeWidth="1.2" fill="none" />
          <path d="M-20,150 Q50,70 140,110 T360,90" stroke="#043d14" strokeWidth="1.2" fill="none" />
          <path d="M20,170 Q110,90 220,120 T360,110" stroke="#043d14" strokeWidth="1.2" fill="none" />
          <path d="M120,180 Q190,120 280,140 T360,130" stroke="#043d14" strokeWidth="1.2" fill="none" />
          <ellipse cx="270" cy="80" rx="45" ry="25" stroke="#043d14" strokeWidth="1.2" fill="none" transform="rotate(-15 270 80)" />
          <ellipse cx="270" cy="80" rx="30" ry="16" stroke="#043d14" strokeWidth="1.2" fill="none" transform="rotate(-15 270 80)" />
        </svg>

        {/* Card Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-black/15 flex items-center justify-center text-black">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-black block leading-none">Monthly Recurring (MRR)</span>
              <span className="text-[10px] text-black/70 font-semibold">Active Subscriptions</span>
            </div>
          </div>

          <button className="w-7 h-7 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-black transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Card Balance */}
        <div className="mt-3.5 relative z-10">
          <div className="text-3xl font-black tracking-tight text-black font-mono">
            {formatINR(liveMRR)}
          </div>
          <div className="text-[11px] text-black/70 font-medium">Billed automatically every month</div>
        </div>

        {/* Card Footer */}
        <div className="mt-3 flex items-center justify-between relative z-10">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/40 text-[11px] font-bold text-black backdrop-blur-xs">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+14.2% MoM</span>
          </div>

          <div className="text-xs font-bold text-black/80 font-mono tracking-wider">
            *SUB-ACTIVE
          </div>
        </div>

        {/* Concave Center Bottom Notch */}
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center px-4 py-1 rounded-t-xl bg-[#090b10] text-[10px] font-semibold text-slate-300 hover:text-white transition-colors border-t border-x border-[#1c212c] shadow-md"
          >
            {expanded ? 'Hide ARR details' : 'Show ARR details'}
          </button>
        </div>
      </div>

      {/* --- Bottom Purple Card: Annual Run-Rate (ARR) --- */}
      <div
        className={`w-full rounded-3xl p-5 -mt-3.5 pt-7 relative z-0 transition-all duration-300 shadow-md ${
          expanded ? 'opacity-100 max-h-48' : 'opacity-90 max-h-24'
        }`}
        style={{
          background: 'linear-gradient(135deg, #8a3ffc 0%, #6f1fe0 50%, #5916b8 100%)',
          color: '#ffffff'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block leading-none">Annual Run-Rate (ARR)</span>
              <span className="text-[10px] text-purple-200">12-Month Contract Projection</span>
            </div>
          </div>

          <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {expanded && (
          <div className="mt-4 pt-2 border-t border-white/15 flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-200">Total Projected ARR</div>
              <div className="text-xl font-bold text-white font-mono">{formatINR(liveARR)}</div>
            </div>
            <div className="text-xs font-mono text-purple-200 tracking-wider">*CONTRACTS</div>
          </div>
        )}
      </div>
    </div>
  );
}
