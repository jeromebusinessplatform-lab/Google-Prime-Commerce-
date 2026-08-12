import React from 'react';

export function GlobalHeader({ title }: { title?: string }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-[55px] bg-white border-b border-gray-200 z-50 flex items-center px-4 pt-[env(safe-area-inset-top,0px)]">
      <div className="font-bold text-lg truncate flex-1">{title || "Enterprise Commerce"}</div>
      <div className="flex items-center space-x-3">
        {/* Actions like profile or search can go here if needed, but keeping it minimal per spec */}
      </div>
    </header>
  );
}
