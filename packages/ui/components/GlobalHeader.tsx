import React, { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

export function GlobalHeader({ title }: { title?: string }) {
  const shouldShowTitle = title && 
    !title.toLowerCase().includes('enterprise') && 
    !title.toLowerCase().includes('commerce');

  return (
    <header className="fixed top-0 left-0 right-0 h-[55px] bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 z-50 flex items-center px-4 pt-[env(safe-area-inset-top,0px)] transition-colors">
      <div className="flex-1 flex items-center">
        <img 
          src="/logo.svg" 
          alt="PRIME" 
          className="h-7 object-contain max-w-[120px] dark:invert" 
        />
        {shouldShowTitle && (
          <span className="ml-3 font-semibold text-gray-800 dark:text-gray-200 border-l border-gray-300 dark:border-gray-700 pl-3 text-sm">
            {title}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-3">
        <ThemeToggle />
      </div>
    </header>
  );
}
