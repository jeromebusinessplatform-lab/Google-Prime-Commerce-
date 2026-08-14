import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GlobalHeader } from '../../../packages/ui/components/GlobalHeader';
import { QueueMonitor } from '../../../packages/ui/components/QueueMonitor';
import { GlobalFooter } from '../../../packages/ui/components/GlobalFooter';
import { BottomNav } from '../../../packages/ui/components/BottomNav';
import { ThemeProvider } from '../../../packages/ui/components/ThemeProvider';
import { ShieldAlert } from 'lucide-react';
import { ShopPage } from './pages/ShopPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailsPage } from './pages/OrderDetailsPage';

function useTelegramEnvironment() {
  const [available, setAvailable] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const telegram = (window as any).Telegram?.WebApp;
    if (!telegram) {
      setAvailable(false);
      setReady(true);
      return;
    }
    telegram.ready?.();
    setAvailable(true);
    setReady(true);
  }, []);

  return { available, ready };
}

function TelegramGate() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-6 transition-colors">
      <div className="max-w-sm w-full border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center bg-gray-50 dark:bg-gray-900 shadow-sm">
        <div className="flex justify-center mb-6">
          <img
            src="/official.jpg"
            alt="Prime"
            className="h-20 w-auto object-contain select-none"
          />
        </div>
        <div className="mx-auto w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mb-4">
          <ShieldAlert size={24} />
        </div>
        <h1 className="text-xl uppercase tracking-tight mb-2">Open in Telegram</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This storefront only works inside a Telegram Mini App session.
        </p>
      </div>
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 dark:text-gray-100 transition-colors">
      {!isCheckout && (
        <>
          <GlobalHeader />
          <QueueMonitor />
        </>
      )}
      
      <div className={!isCheckout ? "pt-[calc(55px+35px+env(safe-area-inset-top,0px))] pb-[calc(44px+18px+env(safe-area-inset-bottom,0px))]" : ""}>
        <Routes>
          <Route path="/" element={<Navigate to="/shop" replace />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailsPage />} />
          <Route path="/notifications" element={<div className="p-4 ">Notifications</div>} />
          <Route path="/account" element={<div className="p-4 ">Account</div>} />
          <Route path="/support" element={<div className="p-4 ">Support</div>} />
        </Routes>
      </div>
      
      {!isCheckout && (
        <>
          <BottomNav />
          <GlobalFooter hasBottomNav={true} />
        </>
      )}
    </div>
  );
}

export default function App() {
  const { available, ready } = useTelegramEnvironment();

  if (!ready) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center text-gray-400 uppercase tracking-widest">
          Checking Telegram session...
        </div>
      </ThemeProvider>
    );
  }

  if (ready && !available) {
    return (
      <ThemeProvider>
        <TelegramGate />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ThemeProvider>
  );
}
