import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Shield, Key, Mail, Lock, User, Building, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AuthPages({ onClose, initialMode = 'login' }) {
  const { login, register, quickLogin } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'forgot', 'reset'

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Forgot / Reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Password validation rules
  const isLenValid = (mode === 'register' ? regPassword : resetPassword).length > 8;
  const hasUpper = /[A-Z]/.test(mode === 'register' ? regPassword : resetPassword);
  const hasLower = /[a-z]/.test(mode === 'register' ? regPassword : resetPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(mode === 'register' ? regPassword : resetPassword);
  const isPasswordValid = isLenValid && hasUpper && hasLower && hasSpecial;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Password does not satisfy mandatory security rules.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        company_name: regCompany,
        phone: regPhone
      });
      if (onClose) onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(forgotEmail);
      setSuccess(`Password reset link generated. Token: ${res.resetToken}`);
      setResetToken(res.resetToken);
      setMode('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Password does not satisfy mandatory security rules.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.resetPassword(resetToken, resetPassword);
      setSuccess('Password updated successfully! Please log in.');
      setMode('login');
      setLoginPassword(resetPassword);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-800 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md">
            B
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Brightloop Software</h2>
          <p className="text-xs text-slate-500">Subscription & Recurring Billing Platform</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
            {success}
          </div>
        )}

        {/* 1. Login Mode */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => { setError(null); setMode('forgot'); }}
                  className="text-purple-700 hover:underline font-medium text-[11px]"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-hidden font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div className="pt-2 text-center text-slate-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setError(null); setMode('register'); }}
                className="text-purple-700 font-bold hover:underline"
              >
                Sign up as Customer
              </button>
            </div>
          </form>
        )}

        {/* 2. Register Mode (Small Business Sign-up) */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Email (Unique) *</label>
              <input
                type="email"
                placeholder="john@mybusiness.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Shop Name</label>
              <input
                type="text"
                placeholder="e.g. Main Street Bakery"
                value={regCompany}
                onChange={(e) => setRegCompany(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password *</label>
              <input
                type="password"
                placeholder="Must meet security criteria"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />

              {/* Password criteria indicator */}
              <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                <div className={`flex items-center gap-1.5 ${isLenValid ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <span>{isLenValid ? '✓' : '○'}</span> More than eight characters ({regPassword.length} chars)
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <span>{hasUpper ? '✓' : '○'}</span> At least one uppercase letter (A-Z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <span>{hasLower ? '✓' : '○'}</span> At least one lowercase letter (a-z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <span>{hasSpecial ? '✓' : '○'}</span> At least one special character (!@#$%^&*)
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>

            <div className="pt-2 text-center text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setError(null); setMode('login'); }}
                className="text-purple-700 font-bold hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* 3. Forgot Password Mode */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4 text-xs">
            <p className="text-slate-500 text-center">
              Enter your registered email address and we'll dispatch a secure reset link.
            </p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Registered Email</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setError(null); setMode('login'); }}
                className="text-purple-700 font-bold hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* 4. Reset Password Mode */}
        {mode === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reset Token</label>
              <input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Compliant Password</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />

              <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-0.5">
                <div className={isLenValid ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                  ✓ More than 8 characters ({resetPassword.length})
                </div>
                <div className={hasUpper ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                  ✓ At least one uppercase letter
                </div>
                <div className={hasLower ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                  ✓ At least one lowercase letter
                </div>
                <div className={hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                  ✓ At least one special character
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

