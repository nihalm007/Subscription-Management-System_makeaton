import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import Subscriptions from './pages/Subscriptions';
import BillingDay from './pages/BillingDay';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Products from './pages/Products';
import Plans from './pages/Plans';
import QuotationTemplates from './pages/QuotationTemplates';
import Discounts from './pages/Discounts';
import Taxes from './pages/Taxes';
import StaffManagement from './pages/StaffManagement';
import CustomerPortal from './pages/CustomerPortal';
import AuditLogs from './pages/AuditLogs';
import AuthPages from './pages/AuthPages';

function MainApp() {
  const { user, role, isCustomer, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(isCustomer ? 'portal' : 'dashboard');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [targetInvoiceId, setTargetInvoiceId] = useState(null);

  // If user role changes to customer, redirect to customer portal
  React.useEffect(() => {
    if (role === 'customer') {
      setActiveTab('portal');
    } else if (activeTab === 'portal') {
      setActiveTab('dashboard');
    }
  }, [role]);

  const handleSelectInvoice = (inv) => {
    setTargetInvoiceId(inv.id);
    setActiveTab('invoices');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold tracking-wide">Starting Brightloop Subscriptions Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navbar with 1-click Demo Role Switcher */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          {activeTab === 'dashboard' && (
            <Dashboard setActiveTab={setActiveTab} onSelectInvoice={handleSelectInvoice} />
          )}

          {activeTab === 'subscriptions' && (
            <Subscriptions onSelectInvoice={handleSelectInvoice} />
          )}

          {activeTab === 'billing' && (
            <BillingDay setActiveTab={setActiveTab} onSelectInvoice={handleSelectInvoice} />
          )}

          {activeTab === 'invoices' && (
            <Invoices initialInvoiceId={targetInvoiceId} />
          )}

          {activeTab === 'payments' && (
            <Payments />
          )}

          {activeTab === 'products' && (
            <Products />
          )}

          {activeTab === 'plans' && (
            <Plans />
          )}

          {activeTab === 'templates' && (
            <QuotationTemplates />
          )}

          {activeTab === 'discounts' && (
            <Discounts />
          )}

          {activeTab === 'taxes' && (
            <Taxes />
          )}

          {activeTab === 'staff' && (
            <StaffManagement />
          )}

          {activeTab === 'portal' && (
            <CustomerPortal />
          )}

          {activeTab === 'audit' && (
            <AuditLogs />
          )}
        </main>
      </div>

      {showAuthModal && (
        <AuthPages onClose={() => setShowAuthModal(false)} />
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
