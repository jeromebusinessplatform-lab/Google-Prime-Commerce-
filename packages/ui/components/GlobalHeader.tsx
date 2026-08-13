import React from 'react';
import { ThemeToggle } from './ThemeToggle';

export function GlobalHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 h-[55px] bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 z-50 flex items-center px-4 pt-[env(safe-area-inset-top,0px)] transition-colors">
      <div className="flex-1 flex items-center justify-start">
        <img
          src="/prime-logo.png"
          alt="Prime"
          className="h-[38px] w-auto object-contain dark:invert"
        />
      </div>
      <div className="flex items-center space-x-3">
        <ThemeToggle />
      </div>
    </header>
  );
}
