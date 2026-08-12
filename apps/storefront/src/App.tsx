import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GlobalHeader } from '../../../packages/ui/components/GlobalHeader';
import { QueueMonitor } from '../../../packages/ui/components/QueueMonitor';
import { GlobalFooter } from '../../../packages/ui/components/GlobalFooter';
import { BottomNav } from '../../../packages/ui/components/BottomNav';
import { ShopPage } from './pages/ShopPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailsPage } from './pages/OrderDetailsPage';

function AppLayout() {
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';

  return (
    <div className="min-h-screen bg-white">
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
          <Route path="/notifications" element={<div className="p-4 font-bold">Notifications</div>} />
          <Route path="/account" element={<div className="p-4 font-bold">Account</div>} />
          <Route path="/support" element={<div className="p-4 font-bold">Support</div>} />
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
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
