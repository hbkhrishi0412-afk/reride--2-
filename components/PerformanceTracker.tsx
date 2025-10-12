import React, { useEffect, useRef } from 'react';

interface PerformanceTrackerProps {
  enabled?: boolean;
  onMetric?: (metric: string, value: number) => void;
}

const PerformanceTracker: React.FC<PerformanceTrackerProps> = ({ 
  enabled = true, 
  onMetric 
}) => {
  const observerRef = useRef<PerformanceObserver | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Track page load time
    const trackPageLoad = () => {
      const loadTime = Date.now() - startTimeRef.current;
      console.log('Page load time:', loadTime + 'ms');
      onMetric?.('pageLoadTime', loadTime);
    };

    // Track Core Web Vitals
    const trackWebVitals = () => {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            console.log('FCP:', entry.startTime + 'ms');
            onMetric?.('FCP', entry.startTime);
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime + 'ms');
        onMetric?.('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = (entry as any).processingStart - entry.startTime;
          console.log('FID:', fid + 'ms');
          onMetric?.('FID', fid);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        console.log('CLS:', clsValue);
        onMetric?.('CLS', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Store observers for cleanup
      observerRef.current = fcpObserver;
    };

    // Track resource loading
    const trackResources = () => {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          if (resource.duration > 1000) { // Only track slow resources
            console.log('Slow resource:', {
              name: resource.name,
              duration: resource.duration + 'ms',
              size: resource.transferSize + ' bytes'
            });
            onMetric?.('slowResource', resource.duration);
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    };

    // Track long tasks
    const trackLongTasks = () => {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('Long task detected:', entry.duration + 'ms');
          onMetric?.('longTask', entry.duration);
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    };

    // Track memory usage
    const trackMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        };
        console.log('Memory usage:', memoryUsage);
        onMetric?.('memoryUsed', memoryUsage.used);
      }
    };

    // Initialize tracking
    trackWebVitals();
    trackResources();
    trackLongTasks();
    trackMemory();

    // Track page load when complete
    if (document.readyState === 'complete') {
      trackPageLoad();
    } else {
      window.addEventListener('load', trackPageLoad);
    }

    // Track memory usage periodically
    const memoryInterval = setInterval(trackMemory, 30000);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      clearInterval(memoryInterval);
      window.removeEventListener('load', trackPageLoad);
    };
  }, [enabled, onMetric]);

  // Track React render performance
  useEffect(() => {
    if (!enabled) return;

    let renderCount = 0;
    let lastRenderTime = performance.now();

    const trackRender = () => {
      renderCount++;
      const currentTime = performance.now();
      const timeSinceLastRender = currentTime - lastRenderTime;
      
      if (timeSinceLastRender > 16) { // More than one frame
        console.warn('Slow render detected:', timeSinceLastRender + 'ms');
        onMetric?.('slowRender', timeSinceLastRender);
      }
      
      lastRenderTime = currentTime;
    };

    // Override console.log to track React renders
    const originalLog = console.log;
    console.log = (...args) => {
      if (args[0]?.includes?.('React')) {
        trackRender();
      }
      originalLog.apply(console, args);
    };

    return () => {
      console.log = originalLog;
    };
  }, [enabled, onMetric]);

  return null; // This component doesn't render anything
};

export default PerformanceTracker;