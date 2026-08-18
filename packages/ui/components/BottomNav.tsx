import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Store, ShoppingCart, ListOrdered, Bell, User, Headset } from 'lucide-react';

export function BottomNav() {
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = () => {
    fetch('/v1/cart')
      .then(r => r.json())
      .then(d => {
        const items = d.data?.items || [];
        setCartCount(items.reduce((acc: number, i: any) => acc + i.quantity, 0));
      });
  };

  useEffect(() => {
    fetchCartCount();
    window.addEventListener('cart-updated', fetchCartCount);
    return () => window.removeEventListener('cart-updated', fetchCartCount);
  }, []);

  const tabs = [
    { name: "SHOP", path: "/shop", icon: Store },
    { name: "CART", path: "/cart", icon: ShoppingCart, badge: cartCount },
    { name: "ORDERS", path: "/orders", icon: ListOrdered },
    { name: "NOTIFICATIONS", path: "/notifications", icon: Bell },
    { name: "ACCOUNT", path: "/account", icon: User },
    { name: "SUPPORT", path: "/support", icon: Headset },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-t border-prime-gray-200 dark:border-gray-800 z-40 flex items-center shadow-sm transition-colors"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.name}
            to={tab.path}
            className={({ isActive }) => 
              `flex-1 h-full flex flex-col items-center justify-center gap-1 ${isActive ? 'text-prime-text dark:text-white' : 'text-prime-gray-500 hover:text-prime-text dark:hover:text-gray-300'}`
            }
            aria-label={tab.name}
          >
            <div className="relative">
              <Icon size={20} strokeWidth={isActive => isActive ? 2.5 : 2} />
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-prime-red text-white text-[10px] font-bold px-1 rounded-full min-w-[16px] h-[16px] flex items-center justify-center pointer-events-none">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider">{tab.name}</span>
          </NavLink>
        );
      })}
    </div>
  );
}
