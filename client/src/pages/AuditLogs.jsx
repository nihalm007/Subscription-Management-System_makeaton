import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Mail, Clock, Shield, Bell, CheckCircle } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs();
      setLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const typeBadges = {
    password_reset: 'bg-amber-100 text-amber-800 border-amber-200',
    invoice_sent: 'bg-blue-100 text-blue-800 border-blue-200',
    invoice_chase: 'bg-rose-100 text-rose-800 border-rose-200',
    billing_run: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Mail className="w-6 h-6 text-purple-700" />
          Email Notifications & System Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time log of dispatched emails, password reset tokens, overdue payment chase alerts, and automated billing runs
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No email or audit events recorded yet.</div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${typeBadges[log.type] || 'bg-slate-100 text-slate-700'}`}>
                      {log.type.replace('_', ' ')}
                    </span>
                    <h4 className="font-bold text-slate-900">{log.subject}</h4>
                  </div>
                  <p className="text-slate-600 text-xs font-mono bg-slate-50 p-2 rounded-lg border border-slate-200/60 break-all">
                    {log.details}
                  </p>
                  <div className="text-[11px] text-slate-400">
                    Recipient: <strong className="text-slate-700">{log.recipient}</strong>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400 font-mono whitespace-nowrap">
                  {log.created_at}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

