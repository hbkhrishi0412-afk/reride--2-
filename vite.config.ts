import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Aggressive code splitting for faster initial load
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Chart.js
            if (id.includes('chart.js') || id.includes('react-chartjs')) {
              return 'charts';
            }
            // Other vendors
            return 'vendor';
          }
          // Split large components
          if (id.includes('/components/Dashboard')) {
            return 'dashboard';
          }
          if (id.includes('/components/AdminPanel')) {
            return 'admin';
          }
          if (id.includes('/components/VehicleList') || id.includes('/components/VehicleDetail')) {
            return 'vehicles';
          }
        }
      }
    },
    // Enable minification with esbuild (faster)
    minify: 'esbuild',
    // Keep console logs temporarily for debugging login issues
    esbuild: {
      drop: ['debugger'],
      legalComments: 'none'
    },
    // Optimize CSS
    cssMinify: true,
    // Disable source maps for production
    sourcemap: false,
    // Enable compression
    target: 'esnext',
    // Reduce chunk size
    cssCodeSplit: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@google/genai']
  }
})
