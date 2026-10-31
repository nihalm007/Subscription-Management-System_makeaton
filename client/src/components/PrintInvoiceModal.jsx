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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200">
        
        {/* Action bar (hidden in print) */}
        <div className="print:hidden bg-slate-100 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Invoice Preview</span>
            <StatusBadge status={invoice.status} isOverdue={invoice.is_overdue} />
          </div>
          <div className="flex items-center gap-2">
            {invoice.status !== 'Paid' && onRegisterPayment && (
              <button
                onClick={() => onRegisterPayment(invoice)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Register Payment
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
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
                <div className="w-9 h-9 rounded-xl bg-purple-800 flex items-center justify-center text-white font-bold text-lg">
                  B
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Brightloop Software</h1>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                100 Tech Boulevard, Suite 400<br />
                San Francisco, CA 94107<br />
                billing@brightloop.com | +1 (555) 019-2834
              </p>
            </div>

            <div className="text-right">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">INVOICE</h2>
              <p className="text-sm font-mono text-purple-700 font-bold mt-1">{invoice.invoice_number}</p>
              <div className="mt-3 text-xs space-y-0.5 text-slate-600">
                <p><span className="text-slate-400">Invoice Date:</span> {invoice.invoice_date}</p>
                <p><span className="text-slate-400">Due Date:</span> <strong className="text-slate-800">{invoice.due_date}</strong></p>
                {invoice.subscription_number && (
                  <p><span className="text-slate-400">Subscription:</span> {invoice.subscription_number}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bill To & Details */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Billed To</span>
              <p className="font-bold text-slate-900">{invoice.customer_name}</p>
              {invoice.customer_company && (
                <p className="font-medium text-slate-700">{invoice.customer_company}</p>
              )}
              <p className="text-slate-500 text-xs mt-1">{invoice.customer_email}</p>
              {invoice.customer_phone && <p className="text-slate-500 text-xs">{invoice.customer_phone}</p>}
              {invoice.customer_address && <p className="text-slate-500 text-xs mt-0.5">{invoice.customer_address}</p>}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
              <span className="font-bold uppercase tracking-wider text-slate-400 block mb-2">Billing Term</span>
              <p><span className="text-slate-500">Service Period:</span> {invoice.billing_period_start || invoice.invoice_date} to {invoice.billing_period_end || 'N/A'}</p>
              <p><span className="text-slate-500">Payment Status:</span> <strong className={invoice.status === 'Paid' ? 'text-teal-700' : 'text-amber-700'}>{invoice.status}</strong></p>
              {invoice.amount_paid > 0 && (
                <p><span className="text-slate-500">Amount Paid:</span> {formatINR(invoice.amount_paid)}</p>
              )}
              <p className="text-sm pt-1 border-t border-slate-200 flex justify-between font-bold">
                <span>Amount Due:</span>
                <span className={invoice.amount_due > 0 ? 'text-rose-600' : 'text-teal-600'}>
                  {formatINR(invoice.amount_due)}
                </span>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-2">Description</th>
                  <th className="py-3 px-2 text-center">Qty</th>
                  <th className="py-3 px-2 text-right">Unit Price</th>
                  <th className="py-3 px-2 text-right">Tax</th>
                  <th className="py-3 px-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.lines && invoice.lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-2 font-medium text-slate-900">
                      <div>{line.description}</div>
                      {line.variant_name && (
                        <div className="text-[11px] text-purple-700 font-normal">Variant: {line.variant_name}</div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center text-slate-600">{line.quantity}</td>
                    <td className="py-3 px-2 text-right text-slate-600">{formatINR(line.unit_price)}</td>
                    <td className="py-3 px-2 text-right text-slate-500">
                      {formatINR(line.tax_amount || 0)} ({line.tax_rate}%)
                    </td>
                    <td className="py-3 px-2 text-right font-semibold text-slate-900">
                      {formatINR(line.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end pt-4">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatINR(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax:</span>
                <span className="font-mono">+{formatINR(invoice.tax_amount)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount {invoice.discount_notes ? `(${invoice.discount_notes})` : ''}:</span>
                  <span className="font-mono">-{formatINR(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="font-mono text-purple-900">{formatINR(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Amount Paid:</span>
                <span className="font-mono">{formatINR(invoice.amount_paid)}</span>
              </div>
              <div className="flex justify-between text-base font-black pt-2 border-t border-slate-300">
                <span className="text-slate-800">Balance Due:</span>
                <span className={`font-mono ${invoice.amount_due > 0 ? 'text-rose-600' : 'text-teal-600'}`}>
                  {formatINR(invoice.amount_due)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History if any */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Recorded Payments</h3>
              <div className="space-y-2">
                {invoice.payments.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{p.payment_method}</span> ({p.transaction_reference})
                      <div className="text-[11px] text-slate-400">{p.payment_date} {p.notes ? `• ${p.notes}` : ''}</div>
                    </div>
                    <span className="font-bold text-emerald-700 font-mono">+{formatINR(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Notes */}
          <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
            <p>Thank you for partnering with Brightloop Software.</p>
            <p className="text-[10px] mt-1 text-slate-400">Payment terms: Net terms apply. Please remit wire or card payments before due date.</p>
          </div>

        </div>

      </div>
    </div>
  );
}

