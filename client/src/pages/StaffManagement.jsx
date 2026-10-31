import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RoleBadge from '../components/RoleBadge';
import {
  Users,
  Plus,
  Shield,
  CheckCircle,
  AlertCircle,
  Key,
  Mail,
  Phone,
  UserCheck
} from 'lucide-react';

export default function StaffManagement() {
  const { isAdmin } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState(null);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('BrightLoop2026!');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.getStaff();
      setStaff(res.staff || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStaff();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-2xl max-w-lg space-y-2">
          <Shield className="w-8 h-8 text-amber-600 mb-2" />
          <h2 className="text-base font-bold">Admin-Only Section</h2>
          <p className="text-xs text-amber-700">
            Per system rules: <strong>Only the admin can add a new member of staff.</strong> Internal staff members cannot manage or view other staff credentials.
          </p>
        </div>
      </div>
    );
  }

  // Password validation checks
  const isLenValid = password.length > 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = isLenValid && hasUpper && hasLower && hasSpecial;

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Password does not meet the mandatory security criteria.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await api.addStaff({
        name,
        email,
        password,
        phone
      });

      setShowModal(false);
      setNotice(`New staff member "${name}" registered successfully!`);
      setTimeout(() => setNotice(null), 5000);
      setName('');
      setEmail('');
      setPhone('');
      fetchStaff();
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Staff & Team Management
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              <Shield className="w-3.5 h-3.5" />
              Admin Controlled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            "Only the admin can add a new member of staff." Staff handle day-to-day operations with scoped permissions.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading staff members...</div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No staff members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {s.name.charAt(0)}
                      </div>
                      <span>{s.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">{s.email}</td>
                    <td className="py-3.5 px-4">
                      <RoleBadge role={s.role} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{s.phone || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{s.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 border border-slate-200">
            
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Staff Member</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Internal staff handle day-to-day operations with limited access
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

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Email *</label>
                <input
                  type="email"
                  placeholder="alex.rivera@brightloop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+1 (555) 019-3344"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                />

                {/* Password Criteria Checklist */}
                <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${isLenValid ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <span>{isLenValid ? '✓' : '○'}</span> More than 8 characters ({password.length} chars)
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <span>{hasUpper ? '✓' : '○'}</span> At least one uppercase letter (A-Z)
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <span>{hasLower ? '✓' : '○'}</span> At least one lowercase letter (a-z)
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <span>{hasSpecial ? '✓' : '○'}</span> At least one special character (!@#$%^&*)
                  </div>
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
                  disabled={submitting || !isPasswordValid}
                  className="px-5 py-2 rounded-lg bg-purple-700 text-white font-semibold hover:bg-purple-800 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submitting ? 'Adding...' : 'Add Staff Member'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

