import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { GlobalHeader } from '../../../packages/ui/components/GlobalHeader';
import { QueueMonitor } from '../../../packages/ui/components/QueueMonitor';
import { GlobalFooter } from '../../../packages/ui/components/GlobalFooter';
import { CatalogPage } from './pages/CatalogPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderFulfillmentPage } from './pages/OrderFulfillmentPage';
import { DashboardPage } from './pages/DashboardPage';
import { POSPage } from './pages/POSPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Lock, Bell, X } from 'lucide-react';

function OrderNotifier() {
  const [toast, setToast] = useState<{ id: string, title: string, message: string } | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    let interval = setInterval(async () => {
      try {
        const res = await fetch('/v1/orders');
        const data = await res.json();
        const orders = data.data;
        if (orders && orders.length > 0) {
          const latest = orders[0];
          if (lastOrderId && latest.id !== lastOrderId) {
            setToast({
              id: latest.id,
              title: 'New Order Received!',
              message: `Order ${latest.id} has been placed for ${latest.customerName || 'a customer'}.`
            });
            setTimeout(() => setToast(null), 5000);
          }
          setLastOrderId(latest.id);
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [lastOrderId]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-20 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[100] flex items-start gap-3 max-w-sm border border-gray-700">
      <Bell className="text-yellow-400 mt-0.5" size={20} />
      <div>
        <h4 className="font-bold text-sm">{toast.title}</h4>
        <p className="text-xs text-gray-300 mt-1">{toast.message}</p>
      </div>
      <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>
  );
}

function AdminNav() {
  const tabs = [
    { name: "DASHBOARD", path: "/dashboard" },
    { name: "CATALOG", path: "/catalog" },
    { name: "ORDERS", path: "/orders" },
    { name: "PROMOTIONS", path: "/promotions" },
    { name: "SETTINGS", path: "/settings" },
    { name: "POS", path: "/pos" },
  ];
  return (
    <div className="bg-white border-b border-gray-200 sticky top-[calc(55px+35px+env(safe-area-inset-top,0px))] z-30 flex overflow-x-auto shadow-sm">
      {tabs.map(t => (
        <NavLink 
          key={t.name}
          to={t.path} 
          className={({isActive}) => `px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${isActive ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'}`}
        >
          {t.name}
        </NavLink>
      ))}
    </div>
  );
}

export default function App() {
  const isPreview = true;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === '1234') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid Access Code');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-sm w-full">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-800">
              <Lock size={24} />
            </div>
          </div>
          <h1 className="text-xl font-bold text-center mb-6">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">ACCESS CODE (Hint: 1234)</label>
              <input 
                type="password" 
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-black focus:outline-none"
                placeholder="Enter 4-digit PIN"
                autoFocus
              />
            </div>
            {error && <div className="text-red-500 text-xs font-bold">{error}</div>}
            <button type="submit" className="w-full bg-black text-white font-bold py-2 rounded hover:bg-gray-800">
              LOGIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter basename="/admin">
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <GlobalHeader title="Enterprise Admin" />
        <QueueMonitor />
        <div className="pt-[calc(55px+35px+env(safe-area-inset-top,0px))] pb-[calc(18px+env(safe-area-inset-bottom,0px))] flex-1 flex flex-col">
          <AdminNav />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderFulfillmentPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/pos" element={<POSPage />} />
          </Routes>
        </div>
        <GlobalFooter hasBottomNav={false} />
        <OrderNotifier />
        {isPreview && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-black text-center text-[10px] font-bold py-0.5 z-[100] pointer-events-none">
            PREVIEW MODE — NO LIVE TRANSACTIONS
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}
