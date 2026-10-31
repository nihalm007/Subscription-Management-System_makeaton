import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MessageSquare, Mail, Clock, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function MessagesPage() {
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
    password_reset: 'bg-amber-950/80 text-amber-300 border-amber-800',
    invoice_sent: 'bg-sky-950/80 text-sky-300 border-sky-800',
    invoice_chase: 'bg-rose-950/80 text-rose-300 border-rose-800',
    billing_run: 'bg-purple-950/80 text-purple-300 border-purple-800'
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-[#33ea6a]" />
            <span>Messages & Dispatch Communications</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of automated billing runs, invoice notifications, overdue reminders, and system alerts.
          </p>
        </div>
      </div>

      <div className="bg-[#11141b] border border-[#1d222e] rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-7 h-7 border-2 border-[#33ea6a] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading communications feed...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No dispatched messages found.</div>
        ) : (
          <div className="divide-y divide-[#1c212c] text-xs">
            {logs.map((log) => (
              <div key={log.id} className="p-4 sm:p-5 hover:bg-[#151922] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${typeBadges[log.type] || 'bg-[#181d28] text-slate-300 border-[#262e3e]'}`}>
                      {log.type.replace('_', ' ')}
                    </span>
                    <h4 className="font-bold text-white text-sm">{log.subject}</h4>
                  </div>
                  <p className="text-slate-300 text-xs font-mono bg-[#0c0e14] p-2.5 rounded-xl border border-[#1c212c] break-all">
                    {log.details}
                  </p>
                  <div className="text-[11px] text-slate-400">
                    Recipient: <strong className="text-slate-200">{log.recipient}</strong>
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

