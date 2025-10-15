import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize chunk size - lower threshold to catch bloat earlier
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Aggressive code splitting for faster initial load
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Separate Firebase into its own chunk (heavy library)
            if (id.includes('firebase')) {
              return 'firebase';
            }
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Chart.js - heavy library, separate it
            if (id.includes('chart.js') || id.includes('react-chartjs')) {
              return 'charts';
            }
            // Google Gemini AI
            if (id.includes('@google/genai')) {
              return 'gemini';
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
          // Split static data into separate chunks
          if (id.includes('/constants') || id.includes('/data/')) {
            return 'static-data';
          }
        }
      }
    },
    // Enable minification with esbuild (faster)
    minify: 'esbuild',
    // Remove console logs and debugger in production for smaller bundle
    esbuild: {
      drop: ['console', 'debugger'],
      legalComments: 'none'
    },
    // Optimize CSS
    cssMinify: true,
    // Disable source maps for production
    sourcemap: false,
    // Better browser support
    target: 'es2020',
    // Reduce chunk size
    cssCodeSplit: true,
    // Enable asset inlining for small files
    assetsInlineLimit: 4096,
  },
  server: {
    port: 5174,
    // Development server optimizations
    hmr: {
      overlay: true
    },
    // Enable file system caching for faster rebuilds
    fs: {
      cachedChecks: true
    },
    // Proxy configuration
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
    // Exclude heavy dependencies from pre-bundling
    exclude: ['@google/genai']
  },
  // Enable esbuild optimizations in dev mode
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
