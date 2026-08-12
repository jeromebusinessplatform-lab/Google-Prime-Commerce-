import React from 'react';

export function GlobalFooter({ hasBottomNav = false }: { hasBottomNav?: boolean }) {
  // If hasBottomNav is true, we place it below the bottom nav (44px)
  // bottom nav is bottom: 18px, this footer is bottom: 0.
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 h-[18px] bg-white border-t border-gray-200 z-50 flex items-center justify-center pb-[env(safe-area-inset-bottom,0px)]"
      style={{ boxSizing: 'content-box' }}
    >
      <div 
        className="text-[#1a1a1a]  whitespace-nowrap text-center w-full"
        style={{ fontSize: '9.5px', fontFamily: '"Open Sauce SF", "Roboto Condensed", sans-serif' }}
        aria-label="System usage is proprietary. Do not distribute or copy."
      >
        SYSTEM USAGE IS PROPRIETARY. DO NOT DISTRIBUTE OR COPY.
      </div>
    </div>
  );
}
