import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is on a mobile device (iOS Safari primarily)
 * Checks for touch support and screen width
 * Can be overridden with ?desktop=true query param
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check if user wants to force desktop view
      const urlParams = new URLSearchParams(window.location.search);
      const forceDesktop = urlParams.get('desktop') === 'true';
      
      if (forceDesktop) {
        setIsMobile(false);
        return;
      }

      // Check for iOS Safari specifically or mobile devices in general
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isMobileWidth = window.innerWidth < 768; // Tablet breakpoint
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsMobile(isIOS || (isMobileWidth && hasTouch));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

