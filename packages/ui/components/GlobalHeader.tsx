import React, { useState, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';

export function GlobalHeader({ title }: { title?: string }) {
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    fetch('/v1/tenant')
      .then(r => r.json())
      .then(d => setTenant(d.data));
  }, []);

  const shouldShowTitle = title && 
    !title.toLowerCase().includes('enterprise') && 
    !title.toLowerCase().includes('commerce');

  return (
    <header className="fixed top-0 left-0 right-0 h-[55px] bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 z-50 flex items-center px-4 pt-[env(safe-area-inset-top,0px)] transition-colors">
      <div className="flex-1 flex items-center">
        <img 
          src={tenant?.logoUrl || "/logo.svg"} 
          alt={tenant?.name || "PRIME"} 
          className="h-7 object-contain max-w-[120px] dark:invert" 
        />
        {(shouldShowTitle || tenant?.name) && (
          <span className="ml-3 font-black uppercase tracking-tighter text-gray-900 dark:text-gray-100 border-l border-gray-200 dark:border-gray-800 pl-3 text-sm">
            {title || tenant?.name}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-3">
        <ThemeToggle />
      </div>
    </header>
  );
}
