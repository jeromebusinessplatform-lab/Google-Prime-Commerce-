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
    { name: "NOTIFICATION", path: "/notifications", icon: Bell, badge: 5 }, // mock badge
    { name: "ACCOUNT", path: "/account", icon: User },
    { name: "SUPPORT", path: "/support", icon: Headset },
  ];

  return (
    <div 
      className="fixed bottom-[calc(18px+env(safe-area-inset-bottom,0px))] left-0 right-0 h-[44px] bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-40 flex items-center transition-colors"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.name}
            to={tab.path}
            className={({ isActive }) => 
              `flex-1 h-full flex items-center justify-center relative ${isActive ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`
            }
            aria-label={tab.name}
          >
            <div className="relative flex items-center justify-center w-[44px] h-[44px]">
              <Icon size={20} strokeWidth={2} />
              {tab.badge && (
                <span className="absolute top-[8px] right-[8px] bg-red-500 text-white text-[9px]  px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center pointer-events-none">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
          </NavLink>
        );
      })}
    </div>
  );
}
