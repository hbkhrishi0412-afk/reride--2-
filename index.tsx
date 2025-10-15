
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { reportWebVitals, logPerformanceMetrics } from './utils/performance';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Disable StrictMode in development for faster loading
// StrictMode causes intentional double-renders which slows down initial load
// Re-enable for production builds or when debugging
const isDev = import.meta.env.DEV;

root.render(
  isDev ? <App /> : <React.StrictMode><App /></React.StrictMode>
);

// Service worker disabled to prevent caching issues
// Uncomment when caching strategy is fully tested
/*
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
        // Force update
        registration.update();
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
*/

// Unregister any existing service workers to clear cache
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log('Unregistered old service worker');
    }
  });
}

// Log performance metrics after page load
window.addEventListener('load', () => {
  setTimeout(() => {
    logPerformanceMetrics();
  }, 0);
});

// Report Web Vitals
reportWebVitals((metric) => {
  // Send to analytics or log
  console.log(metric);
});
