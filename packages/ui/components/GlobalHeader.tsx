import React from 'react';

export function GlobalHeader({ title }: { title?: string }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-[55px] bg-white border-b border-gray-200 z-50 flex items-center px-4 pt-[env(safe-area-inset-top,0px)]">
      <div className="flex-1 flex items-center">
        <img src="/logo.png" alt="PRIME" className="h-7 object-contain" />
        {title && title !== "Enterprise Commerce" && (
          <span className="ml-3 font-semibold text-gray-800 border-l border-gray-300 pl-3">{title}</span>
        )}
      </div>
      <div className="flex items-center space-x-3">
      </div>
    </header>
  );
}
