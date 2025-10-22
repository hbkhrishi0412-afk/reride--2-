import { useState, useEffect } from 'react';

/**
 * Hook to detect if the app is running as an installed PWA (standalone mode)
 * This helps us provide different UI/UX for mobile app vs website
 */
export const useIsMobileApp = () => {
  const [isMobileApp, setIsMobileApp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let mediaQuery: MediaQueryList | null = null;
    let handleChange: ((e: MediaQueryListEvent) => void) | null = null;

    try {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone || // iOS
                          document.referrer.includes('android-app://'); // Android

      // Check if device is mobile (more comprehensive)
      const checkMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                         window.innerWidth <= 768 ||
                         ('ontouchstart' in window); // Touch device

      // Check if in mobile browser (not desktop)
      const isMobileBrowser = checkMobile && !isStandalone;
      
      // Show mobile UI for both PWA and mobile browser
      const shouldShowMobileUI = isStandalone || isMobileBrowser;

      setIsMobileApp(shouldShowMobileUI);
      setIsMobile(checkMobile);

      console.log('📱 Mobile Detection:', {
        isStandalone,
        checkMobile,
        isMobileBrowser,
        shouldShowMobileUI,
        userAgent: navigator.userAgent,
        windowWidth: window.innerWidth
      });

      // Listen for display mode changes
      mediaQuery = window.matchMedia('(display-mode: standalone)');
      handleChange = (e: MediaQueryListEvent) => {
        const newMobileApp = e.matches || isMobileBrowser;
        setIsMobileApp(newMobileApp);
      };

      if (mediaQuery && handleChange) {
        mediaQuery.addEventListener('change', handleChange);
      }
    } catch (error) {
      console.error('Error in mobile detection:', error);
      // Fallback to basic detection
      setIsMobileApp(false);
      setIsMobile(false);
    }

    return () => {
      // Proper cleanup
      if (mediaQuery && handleChange) {
        try {
          mediaQuery.removeEventListener('change', handleChange);
        } catch (error) {
          console.warn('Error removing media query listener:', error);
        }
      }
    };
  }, []);

  return {
    isMobileApp,     // True if should show mobile UI (PWA or mobile browser)
    isMobile,        // True if mobile device
    isWebsite: !isMobileApp && !isMobile // Desktop browser
  };
};

export default useIsMobileApp;

