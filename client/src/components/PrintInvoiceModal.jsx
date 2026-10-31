import React from 'react';
import StatusBadge from './StatusBadge';
import { formatINR } from '../utils/format';
import { X, Printer, CheckCircle, Clock } from 'lucide-react';

export default function PrintInvoiceModal({ invoice, onClose, onRegisterPayment }) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#11141b] rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-[#262e3e]">
        
        {/* Action bar (hidden in print) */}
        <div className="print:hidden bg-[#151922] px-6 py-3.5 border-b border-[#212735] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-white text-sm">Invoice Preview</span>
            <StatusBadge status={invoice.status} isOverdue={invoice.is_overdue} />
          </div>
          <div className="flex items-center gap-2">
            {invoice.status !== 'Paid' && onRegisterPayment && (
              <button
                onClick={() => onRegisterPayment(invoice)}
                className="px-3.5 py-1.5 rounded-full bg-[#33ea6a] text-black text-xs font-bold hover:bg-[#2fe064] transition flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                Register Payment
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-full bg-[#1e2433] text-slate-200 border border-[#2b3548] text-xs font-semibold hover:text-white transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2636]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div id="printable-invoice" className="p-8 sm:p-12 space-y-8 bg-white text-slate-800">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-8">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-[#33ea6a] font-black text-lg">
                  CX
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">CoinVex Subscriptions</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Recurring Billing & SaaS Infrastructure<br />
                Financial Services Division
              </p>
            </div>

            <div className="text-right">
              <div className="text-xl font-bold text-slate-900 font-mono">{invoice.invoice_number}</div>
              <div className="text-xs text-slate-500 mt-1">Date: {invoice.issue_date}</div>
              <div className="text-xs text-slate-500">Due: {invoice.due_date}</div>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To</div>
              <div className="font-bold text-slate-900 text-sm">{invoice.customer_name}</div>
              <div className="text-slate-600">{invoice.customer_email}</div>
              {invoice.customer_company && (
                <div className="text-slate-600">{invoice.customer_company}</div>
              )}
            </div>

            <div className="text-right">
              <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Status</div>
              <div className="font-bold font-mono text-base text-slate-900">{invoice.status.toUpperCase()}</div>
              {invoice.days_overdue > 0 && invoice.status !== 'Paid' && (
                <div className="text-rose-600 font-bold">{invoice.days_overdue} days past due</div>
              )}
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-xs">
            <thead className="border-b border-slate-300 text-slate-600 font-bold">
              <tr>
                <th className="py-2 text-left">Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.lines?.map((line, idx) => (
                <tr key={idx}>
                  <td className="py-3 font-medium text-slate-800">
                    {line.description || line.product_name}
                  </td>
                  <td className="py-3 text-center">{line.quantity}</td>
                  <td className="py-3 text-right font-mono">{formatINR(line.unit_price)}</td>
                  <td className="py-3 text-right font-mono font-bold">{formatINR(line.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-slate-300 pt-4 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatINR(invoice.subtotal)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({invoice.applied_discount_code || 'Auto'}):</span>
                  <span className="font-mono">-{formatINR(invoice.discount_amount)}</span>
                </div>
              )}
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Taxes:</span>
                  <span className="font-mono">+{formatINR(invoice.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-300">
                <span>Total Due:</span>
                <span className="font-mono text-base">{formatINR(invoice.total_amount)}</span>
              </div>
              {invoice.amount_paid > 0 && (
                <div className="flex justify-between text-emerald-600 pt-1">
                  <span>Amount Paid:</span>
                  <span className="font-mono">-{formatINR(invoice.amount_paid)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-400">
                <span>Balance Due:</span>
                <span className="font-mono text-base text-purple-900">{formatINR(invoice.amount_due)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t border-slate-200 text-center text-[11px] text-slate-400">
            Thank you for choosing CoinVex Subscriptions. For questions regarding this invoice, contact support@coinvex.io.
          </div>

        </div>

      </div>
    </div>
  );
}
