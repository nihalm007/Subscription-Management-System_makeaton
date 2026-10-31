import React from 'react';
import { Shield, Briefcase, User } from 'lucide-react';

export default function RoleBadge({ role }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
        <Shield className="w-3 h-3 text-purple-600" />
        Admin
      </span>
    );
  }
  if (role === 'staff') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
        <Briefcase className="w-3 h-3 text-indigo-600" />
        Staff
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
      <User className="w-3 h-3 text-sky-600" />
      Customer
    </span>
  );
}

