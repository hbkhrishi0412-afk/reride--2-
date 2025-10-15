import { useEffect, useRef } from 'react';

export const useCleanup = () => {
  const cleanupRef = useRef<(() => void)[]>([]);
  
  const addCleanup = (cleanup: () => void) => {
    cleanupRef.current.push(cleanup);
  };
  
  useEffect(() => {
    return () => {
      cleanupRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      });
    };
  }, []);
  
  return addCleanup;
};

export const useTimeout = (callback: () => void, delay: number | null) => {
  const timeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (delay !== null) {
      timeoutRef.current = window.setTimeout(callback, delay);
    }
    
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback, delay]);
};

export const useInterval = (callback: () => void, delay: number | null) => {
  const intervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (delay !== null) {
      intervalRef.current = window.setInterval(callback, delay);
    }
    
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [callback, delay]);
};

