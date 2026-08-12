import React, { useState } from 'react';

export function GlobalHeader({ title }: { title?: string }) {
  const [logoSrc, setLogoSrc] = useState('/logo.jpg');

  const handleImageError = () => {
    if (logoSrc === '/logo.jpg') {
      setLogoSrc('/logo.png');
    } else if (logoSrc === '/logo.png') {
      setLogoSrc('/logo.jpeg');
    } else if (logoSrc === '/logo.jpeg') {
      setLogoSrc('/logo.webp');
    }
  };

  const shouldShowTitle = title && 
    !title.toLowerCase().includes('enterprise') && 
    !title.toLowerCase().includes('commerce');

  return (
    <header className="fixed top-0 left-0 right-0 h-[55px] bg-white border-b border-gray-200 z-50 flex items-center px-4 pt-[env(safe-area-inset-top,0px)]">
      <div className="flex-1 flex items-center">
        <img 
          src={logoSrc} 
          alt="PRIME" 
          className="h-7 object-contain max-w-[120px]" 
          onError={handleImageError}
        />
        {shouldShowTitle && (
          <span className="ml-3 font-semibold text-gray-800 border-l border-gray-300 pl-3 text-sm">
            {title}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-3">
      </div>
    </header>
  );
}
