import React, { useEffect, useRef } from 'react';

interface PerformanceMonitorProps {
  enabled?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ enabled = true }) => {
  const observerRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    const measureWebVitals = () => {
      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            console.log('FCP:', entry.startTime);
            // Send to analytics
            sendToAnalytics('FCP', entry.startTime);
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
        sendToAnalytics('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('FID:', entry.processingStart - entry.startTime);
          sendToAnalytics('FID', entry.processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        console.log('CLS:', clsValue);
        sendToAnalytics('CLS', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Time to Interactive (TTI)
      const ttiObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'TTI') {
            console.log('TTI:', entry.startTime);
            sendToAnalytics('TTI', entry.startTime);
          }
        }
      });
      ttiObserver.observe({ entryTypes: ['measure'] });

      // Measure TTI
      setTimeout(() => {
        performance.mark('TTI');
        performance.measure('TTI', 'navigationStart', 'TTI');
      }, 0);
    };

    // Monitor resource loading
    const measureResourceTiming = () => {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          console.log('Resource loaded:', {
            name: resource.name,
            duration: resource.duration,
            size: resource.transferSize,
            type: resource.initiatorType
          });
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    };

    // Monitor long tasks
    const measureLongTasks = () => {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('Long task detected:', entry.duration);
          sendToAnalytics('LongTask', entry.duration);
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    };

    // Monitor memory usage
    const measureMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('Memory usage:', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        });
        sendToAnalytics('MemoryUsage', memory.usedJSHeapSize);
      }
    };

    // Send metrics to analytics
    const sendToAnalytics = (metric: string, value: number) => {
      // In a real app, you would send this to your analytics service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'web_vitals', {
          metric_name: metric,
          metric_value: Math.round(value),
          metric_delta: Math.round(value)
        });
      }
    };

    // Initialize monitoring
    measureWebVitals();
    measureResourceTiming();
    measureLongTasks();
    measureMemoryUsage();

    // Monitor memory usage periodically
    const memoryInterval = setInterval(measureMemoryUsage, 30000); // Every 30 seconds

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      clearInterval(memoryInterval);
    };
  }, [enabled]);

  // Monitor React render performance
  useEffect(() => {
    if (!enabled) return;

    const originalConsoleLog = console.log;
    let renderCount = 0;
    let lastRenderTime = performance.now();

    console.log = (...args) => {
      if (args[0]?.includes?.('React')) {
        renderCount++;
        const currentTime = performance.now();
        const timeSinceLastRender = currentTime - lastRenderTime;
        
        if (timeSinceLastRender > 16) { // More than one frame
          console.warn('Slow render detected:', timeSinceLastRender + 'ms');
          sendToAnalytics('SlowRender', timeSinceLastRender);
        }
        
        lastRenderTime = currentTime;
      }
      originalConsoleLog.apply(console, args);
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, [enabled]);

  const sendToAnalytics = (metric: string, value: number) => {
    // In a real app, you would send this to your analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance', {
        metric_name: metric,
        metric_value: Math.round(value)
      });
    }
  };

  return null; // This component doesn't render anything
};

export default PerformanceMonitor;