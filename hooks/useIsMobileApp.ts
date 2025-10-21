import { useState, useEffect } from 'react';

/**
 * Hook to detect if the app is running as an installed PWA (standalone mode)
 * This helps us provide different UI/UX for mobile app vs website
 */
export const useIsMobileApp = () => {
  const [isMobileApp, setIsMobileApp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone || // iOS
                        document.referrer.includes('android-app://'); // Android

    // Check if device is mobile
    const checkMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
                       window.innerWidth <= 768;

    setIsMobileApp(isStandalone);
    setIsMobile(checkMobile);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobileApp(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return {
    isMobileApp,     // True if installed as PWA
    isMobile,        // True if mobile device
    isWebsite: !isMobileApp && isMobile // Mobile browser (not installed)
  };
};

export default useIsMobileApp;

