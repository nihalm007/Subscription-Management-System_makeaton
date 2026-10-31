import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatINR } from '../utils/format';
import { FileText, Plus, CheckCircle, Clock, Package } from 'lucide-react';

export default function QuotationTemplates() {
  const [templates, setTemplates] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState(null);

  // Form
  const [name, setName] = useState('');
  const [planId, setPlanId] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([
    { product_id: '', variant_id: '', quantity: 1, unit_price: 0 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const [tRes, pRes, prRes] = await Promise.all([
        api.getTemplates(),
        api.getPlans(),
        api.getProducts()
      ]);
      setTemplates(tRes.templates || []);
      setPlans(pRes.plans || []);
      setProducts(prRes.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleProductChange = (index, prodId) => {
    const prod = products.find(p => p.id === Number(prodId));
    if (!prod) return;
    const newLines = [...lines];
    newLines[index].product_id = prod.id;
    newLines[index].variant_id = '';
    newLines[index].unit_price = prod.sales_price;
    setLines(newLines);
  };

  const handleVariantChange = (index, variantId) => {
    const line = lines[index];
    const prod = products.find(p => p.id === Number(line.product_id));
    if (!prod) return;
    const variant = prod.variants?.find(v => v.id === Number(variantId));
    const extra = variant ? Number(variant.price_extra || 0) : 0;
    const newLines = [...lines];
    newLines[index].variant_id = variantId;
    newLines[index].unit_price = prod.sales_price + extra;
    setLines(newLines);
  };

  const addLine = () => {
    setLines([...lines, { product_id: '', variant_id: '', quantity: 1, unit_price: 0 }]);
  };

  const removeLine = (idx) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== idx));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.createTemplate({
        name,
        plan_id: planId ? Number(planId) : null,
        validity_days: Number(validityDays || 30),
        notes,
        lines: lines.filter(l => l.product_id)
      });

      setShowModal(false);
      setNotice(`Quotation template "${name}" created successfully!`);
      setTimeout(() => setNotice(null), 5000);
      setName('');
      fetchTemplates();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Notice */}
      {notice && (
        <div className="p-3.5 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-purple-400 hover:text-purple-700">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-700" />
            Quotation Templates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            "A sales rep is preparing an offer... instead of building it from scratch, they start from a quotation template that already has the right plan and product lines, and stays valid for a set number of days."
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800">
                  {t.plan_name || 'Standard Plan'}
                </span>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Valid for {t.validity_days} days
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{t.notes || 'Pre-configured commercial proposal.'}</p>

              {/* Template Preset Lines */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Preset Product Lines ({t.lines?.length || 0})
                </span>
                <div className="space-y-1.5">
                  {t.lines && t.lines.map((l, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 text-xs text-slate-700">
                      <div>
                        <span className="font-semibold text-slate-900">{l.product_name}</span>
                        {l.variant_name && (
                          <span className="text-[11px] text-purple-700 font-medium ml-1.5">
                            ({l.variant_name})
                          </span>
                        )}
                        <span className="text-slate-400 ml-2">× {l.quantity}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        {formatINR(l.quantity * l.unit_price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Template Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">New Quotation Template</h3>
                <p className="text-xs text-slate-500 mt-0.5">Pre-bundle plans and product lines for sales reps</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Standard SMB Growth Package"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Plan</label>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  >
                    <option value="">-- Select Default Plan --</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.billing_frequency})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Validity (Days) *</label>
                  <input
                    type="number"
                    min="1"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Best for small businesses with 3 to 10 seats"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                />
              </div>

              {/* Lines */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Bundled Products & Variants
                  </label>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-purple-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Product
                  </button>
                </div>

                <div className="space-y-2">
                  {lines.map((line, idx) => {
                    const selProd = products.find(p => p.id === Number(line.product_id));
                    const variants = selProd?.variants || [];

                    return (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center text-xs">
                        <div className="col-span-5">
                          <select
                            value={line.product_id}
                            onChange={(e) => handleProductChange(idx, e.target.value)}
                            required
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                          >
                            <option value="">-- Choose Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name} (₹{p.sales_price})</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-4">
                          <select
                            value={line.variant_id}
                            onChange={(e) => handleVariantChange(idx, e.target.value)}
                            disabled={variants.length === 0}
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden disabled:bg-slate-100 text-[11px]"
                          >
                            <option value="">Standard Edition (+₹0)</option>
                            {variants.map((v) => (
                              <option key={v.id} value={v.id}>{v.variant_name} (+₹{v.price_extra})</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => {
                              const updated = [...lines];
                              updated[idx].quantity = Number(e.target.value);
                              setLines(updated);
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold"
                          />
                        </div>

                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            disabled={lines.length === 1}
                            className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-purple-700 text-white font-semibold hover:bg-purple-800 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submitting ? 'Saving...' : 'Save Template'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

