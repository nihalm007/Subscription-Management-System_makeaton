import React from 'react';
import { Shield, Briefcase, User } from 'lucide-react';

export default function RoleBadge({ role }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#33ea6a]/15 text-[#33ea6a] border border-[#33ea6a]/30">
        <Shield className="w-2.5 h-2.5 text-[#33ea6a]" />
        Admin
      </span>
    );
  }
  if (role === 'staff') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800">
        <Briefcase className="w-2.5 h-2.5 text-purple-400" />
        Staff
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950/80 text-sky-300 border border-sky-800">
      <User className="w-2.5 h-2.5 text-sky-400" />
      Customer
    </span>
  );
}
