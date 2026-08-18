import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { GlobalHeader } from '../../../packages/ui/components/GlobalHeader';
import { QueueMonitor } from '../../../packages/ui/components/QueueMonitor';
import { GlobalFooter } from '../../../packages/ui/components/GlobalFooter';
import { ThemeProvider } from '../../../packages/ui/components/ThemeProvider';
import { CatalogPage } from './pages/CatalogPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderFulfillmentPage } from './pages/OrderFulfillmentPage';
import { DashboardPage } from './pages/DashboardPage';
import { POSPage } from './pages/POSPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CourierPage } from './pages/CourierPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SupportPage } from './pages/SupportPage';
import { FraudPage } from './pages/FraudPage';
import { ReportsPage } from './pages/ReportsPage';
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
        <h4 className=" text-sm">{toast.title}</h4>
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
    { name: "ANALYTICS", path: "/analytics" },
    { name: "ORDERS", path: "/orders" },
    { name: "COURIERS", path: "/couriers" },
    { name: "PROMOTIONS", path: "/promotions" },
    { name: "SUPPORT", path: "/support" },
    { name: "FRAUD", path: "/fraud" },
    { name: "REPORTS", path: "/reports" },
    { name: "SETTINGS", path: "/settings" },
    { name: "POS", path: "/pos" },
  ];
  return (
    <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-[calc(55px+35px+env(safe-area-inset-top,0px))] z-30 flex overflow-x-auto shadow-sm transition-colors">
      {tabs.map(t => (
        <NavLink 
          key={t.name}
          to={t.path} 
          className={({isActive}) => `px-4 py-3 text-xs  whitespace-nowrap border-b-2 transition-colors ${isActive ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700'}`}
        >
          {t.name}
        </NavLink>
      ))}
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [tenantId, setTenantId] = useState('default');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/v1/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'default', // Implicit tenant
          accessCode,
          initData: 'PREVIEW_MOCK'
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Invalid Access Code');
      }
      setIsAuthenticated(true);
      setError('');
    } catch (err: any) {
      console.error("Login error:", err);
      // More robust error extraction
      let message = 'Invalid Access Code';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        message = (err as any).message;
      } else if (typeof err === 'string') {
        message = err;
      } else {
        // Fallback for unexpected object structure
        message = JSON.stringify(err);
      }
      setError(message);
    }
  };

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 dark:text-gray-100 flex flex-col items-center justify-center p-4 transition-colors">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 max-w-sm w-full">
            <div className="flex justify-center mb-5">
              <img
                src="/official.jpg"
                alt="Prime"
                className="h-20 w-auto object-contain select-none"
              />
            </div>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-800 dark:text-gray-200">
                <Lock size={24} />
              </div>
            </div>
            <h1 className="text-xl  text-center mb-6">Admin Access</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs  text-gray-700 dark:text-gray-400 mb-1">ACCESS CODE</label>
                <input 
                  type="password" 
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded px-3 py-2 focus:border-black dark:focus:border-white focus:outline-none"
                  placeholder="Enter access code"
                  autoFocus
                />
              </div>
              {error && <div className="text-red-500 text-xs ">{error}</div>}
              <button type="submit" className="w-full bg-black dark:bg-white dark:text-black text-white  py-2 rounded hover:bg-gray-800 dark:hover:bg-gray-200">
                LOGIN
              </button>
            </form>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter basename="/admin">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 dark:text-gray-100 flex flex-col transition-colors">
        <GlobalHeader />
        <QueueMonitor />
        <div className="pt-[calc(55px+35px+env(safe-area-inset-top,0px))] pb-[calc(18px+env(safe-area-inset-bottom,0px))] flex-1 flex flex-col">
          <AdminNav />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderFulfillmentPage />} />
            <Route path="/couriers" element={<CourierPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/fraud" element={<FraudPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/pos" element={<POSPage />} />
          </Routes>
        </div>
        <GlobalFooter hasBottomNav={false} />
        <OrderNotifier />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
