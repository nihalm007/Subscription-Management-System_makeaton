import React from 'react';

export default function AnalyticsHeatmap() {
  // Matrix data simulating the pill activity blocks seen in the reference UI
  const columns = [
    [
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
      { label: '3k', bg: 'bg-[#1c325c]', border: 'border-[#26447c]', text: 'text-sky-300' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
    ],
    [
      { label: '4k', bg: 'bg-[#559b32]', border: 'border-[#71c944]', text: 'text-white' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
    ],
    [
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
      { label: '3k', bg: 'bg-[#1c325c]', border: 'border-[#26447c]', text: 'text-sky-300' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
    ],
    [
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
      { label: '2k', bg: 'bg-[#3b8c2c]', border: 'border-[#4ec938]', text: 'text-white' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
    ],
    [
      { label: '4k', bg: 'bg-[#1f3f78]', border: 'border-[#2a58a6]', text: 'text-blue-200' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
    ],
    [
      { label: '5k', bg: 'bg-[#6ab335]', border: 'border-[#8ae845]', text: 'text-black font-extrabold' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
    ],
    [
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
      { label: '3k', bg: 'bg-[#1c325c]', border: 'border-[#26447c]', text: 'text-sky-300' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
      { label: '', bg: 'bg-[#151a24]', border: 'border-[#1f2636]' },
    ],
  ];

  return (
    <div className="w-full flex items-center justify-between gap-2.5 py-2">
      {columns.map((col, colIdx) => (
        <div key={colIdx} className="flex-1 flex flex-col gap-2">
          {col.map((cell, rowIdx) => (
            <div
              key={rowIdx}
              className={`h-7 rounded-xl flex items-center justify-center text-[10px] font-semibold border transition-all hover:scale-105 cursor-pointer ${cell.bg} ${cell.border} ${cell.text || 'text-transparent'}`}
            >
              {cell.label}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

