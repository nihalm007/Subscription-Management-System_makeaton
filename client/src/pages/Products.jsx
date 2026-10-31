import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/format';
import {
  Package,
  Plus,
  Tag,
  DollarSign,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
  X
} from 'lucide-react';

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('Software');
  const [salesPrice, setSalesPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [variants, setVariants] = useState([
    { variant_name: 'Standard Edition', attribute_type: 'brand', price_extra: 0, sku: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts();
      setProducts(res.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addVariantRow = () => {
    setVariants([
      ...variants,
      { variant_name: '', attribute_type: 'brand', price_extra: 0, sku: '' }
    ]);
  };

  const removeVariantRow = (idx) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== idx));
    }
  };

  const updateVariant = (idx, field, value) => {
    const updated = [...variants];
    updated[idx][field] = value;
    setVariants(updated);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.createProduct({
        name,
        type,
        sales_price: Number(salesPrice),
        cost_price: Number(costPrice || 0),
        notes,
        variants: variants.filter(v => v.variant_name && v.variant_name.trim())
      });

      setShowModal(false);
      setNotice(`Product "${name}" launched successfully with ${variants.length} variants!`);
      setTimeout(() => setNotice(null), 5000);
      setName('');
      setSalesPrice('');
      setCostPrice('');
      setNotes('');
      setVariants([{ variant_name: 'Standard Edition', attribute_type: 'brand', price_extra: 0, sku: '' }]);
      fetchProducts();
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
            <Package className="w-6 h-6 text-purple-700" />
            Products & Variants
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Software, add-ons and services with multi-attribute variants (e.g. Odoo brand +₹560 surcharge)
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Launch New Product
          </button>
        )}
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => {
          const typeColors = {
            Software: 'bg-purple-50 text-purple-700 border-purple-200',
            'Add-on': 'bg-sky-50 text-sky-700 border-sky-200',
            Service: 'bg-amber-50 text-amber-700 border-amber-200',
            Physical: 'bg-slate-50 text-slate-700 border-slate-200'
          };

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${typeColors[p.type] || 'bg-slate-100 text-slate-700'}`}>
                    {p.type}
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-purple-900">
                      {formatINR(p.sales_price)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Base Price</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.notes || 'No description provided.'}</p>

                {/* Variants List */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Available Variants ({p.variants?.length || 0})
                  </span>
                  <div className="space-y-1.5">
                    {p.variants && p.variants.map((v) => (
                      <div
                        key={v.id}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                          v.variant_name.includes('Odoo')
                            ? 'bg-purple-50/70 border border-purple-200 text-purple-950 font-medium'
                            : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{v.variant_name}</span>
                        </div>
                        <span className="font-mono font-bold">
                          {v.price_extra > 0 ? `+₹${v.price_extra}` : '₹0'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Cost: {formatINR(p.cost_price)}</span>
                <span className="text-emerald-600 font-semibold">
                  Margin: {p.sales_price > 0 ? `${Math.round(((p.sales_price - p.cost_price) / p.sales_price) * 100)}%` : '0%'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Launch New Product</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure base pricing and attribute variants (e.g. Odoo brand +$560)
                </p>
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

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. BrightDesk Core CRM"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Product Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  >
                    <option value="Software">Software</option>
                    <option value="Add-on">Add-on</option>
                    <option value="Service">Service</option>
                    <option value="Physical">Physical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="120.00"
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="35.00"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Turnkey CRM platform with automated contact sequences"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                ></textarea>
              </div>

              {/* Variants Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Product Variants & Surcharges
                  </label>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="text-xs text-purple-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Variant
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="e.g. Odoo Brand Edition"
                          value={v.variant_name}
                          onChange={(e) => updateVariant(idx, 'variant_name', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                        />
                      </div>
                      <div className="col-span-4">
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-slate-400 font-semibold">+₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="560"
                            value={v.price_extra}
                            onChange={(e) => updateVariant(idx, 'price_extra', e.target.value)}
                            className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden font-mono font-semibold"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeVariantRow(idx)}
                          disabled={variants.length === 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

