import { useState, useEffect } from 'react';

export function useTelegramWebApp() {
  const [webApp, setWebApp] = useState<any>(null);

  useEffect(() => {
    const telegram = (window as any).Telegram?.WebApp;
    
    if (telegram) {
      telegram.ready();
      setWebApp(telegram);
    } else {
      // If not yet available, listen for the window load event
      const handleLoad = () => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
          tg.ready();
          setWebApp(tg);
        }
      };
      
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return webApp;
}
