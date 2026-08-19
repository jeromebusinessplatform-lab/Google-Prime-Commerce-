import { useState, useEffect } from 'react';

export function useTelegramWebApp() {
  const [webApp, setWebApp] = useState<any>(null);

  useEffect(() => {
    let interval: any;

    const checkWebApp = () => {
      const telegram = (window as any).Telegram?.WebApp;
      if (telegram && telegram.initData) {
        telegram.ready();
        setWebApp(telegram);
        clearInterval(interval);
      }
    };

    // Poll to handle race conditions during SDK script loading
    interval = setInterval(checkWebApp, 100);
    checkWebApp(); // Initial check

    return () => clearInterval(interval);
  }, []);

  return webApp;
}
