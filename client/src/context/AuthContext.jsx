import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, setStoredUser, getStoredUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const token = localStorage.getItem('brightloop_token');
        if (token) {
          const res = await api.getMe();
          setUser(res.user);
          setStoredUser(res.user);
        } else {
          // If no token, auto-login as Admin by default so the demo app is immediately active!
          await quickLogin('admin@brightloop.com', 'BrightLoop2026!');
        }
      } catch (err) {
        console.error('Session verify error:', err);
        localStorage.removeItem('brightloop_token');
        localStorage.removeItem('brightloop_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function quickLogin(email, password = 'BrightLoop2026!') {
    const res = await api.login(email, password);
    setAuthToken(res.token);
    setStoredUser(res.user);
    setUser(res.user);
    return res.user;
  }

  async function login(email, password) {
    setError(null);
    try {
      const res = await api.login(email, password);
      setAuthToken(res.token);
      setStoredUser(res.user);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function register(userData) {
    setError(null);
    try {
      const res = await api.register(userData);
      setAuthToken(res.token);
      setStoredUser(res.user);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  function logout() {
    setAuthToken(null);
    setStoredUser(null);
    setUser(null);
  }

  const value = {
    user,
    role: user?.role,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
    isCustomer: user?.role === 'customer',
    loading,
    error,
    login,
    quickLogin,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

