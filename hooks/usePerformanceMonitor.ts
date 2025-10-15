import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  tti?: number;
  memoryUsage?: number;
  renderTime?: number;
}

interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  onMetric?: (metric: string, value: number) => void;
  reportInterval?: number;
}

export const usePerformanceMonitor = (options: UsePerformanceMonitorOptions = {}) => {
  const { enabled = true, onMetric, reportInterval = 30000 } = options;
  const metricsRef = useRef<PerformanceMetrics>({});
  const renderStartRef = useRef<number>(0);
  const observerRef = useRef<PerformanceObserver | null>(null);

  // Track render performance
  const trackRender = useCallback(() => {
    if (!enabled) return;
    
    const renderTime = performance.now() - renderStartRef.current;
    if (renderTime > 16) { // More than one frame
      console.warn('Slow render detected:', renderTime + 'ms');
      onMetric?.('slowRender', renderTime);
    }
    metricsRef.current.renderTime = renderTime;
  }, [enabled, onMetric]);

  // Track Core Web Vitals
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const trackWebVitals = () => {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            metricsRef.current.fcp = entry.startTime;
            onMetric?.('FCP', entry.startTime);
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metricsRef.current.lcp = lastEntry.startTime;
        onMetric?.('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = (entry as any).processingStart - entry.startTime;
          metricsRef.current.fid = fid;
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
        metricsRef.current.cls = clsValue;
        onMetric?.('CLS', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('Long task detected:', entry.duration + 'ms');
          onMetric?.('longTask', entry.duration);
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      observerRef.current = fcpObserver;
    };

    trackWebVitals();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, onMetric]);

  // Track memory usage
  useEffect(() => {
    if (!enabled) return;

    const trackMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        metricsRef.current.memoryUsage = memory.usedJSHeapSize;
        onMetric?.('memoryUsage', memory.usedJSHeapSize);
      }
    };

    // Track memory usage periodically
    const memoryInterval = setInterval(trackMemory, reportInterval);
    trackMemory(); // Initial measurement

    return () => clearInterval(memoryInterval);
  }, [enabled, onMetric, reportInterval]);

  // Track render performance
  useEffect(() => {
    if (!enabled) return;

    renderStartRef.current = performance.now();
    
    // Use requestAnimationFrame to track render completion
    const rafId = requestAnimationFrame(() => {
      trackRender();
    });

    return () => cancelAnimationFrame(rafId);
  }, [enabled, trackRender]);

  // Get current metrics
  const getMetrics = useCallback(() => metricsRef.current, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    metricsRef.current = {};
  }, []);

  return {
    getMetrics,
    resetMetrics,
    trackRender
  };
};