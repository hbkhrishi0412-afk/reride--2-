import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Exclude API files and server-side dependencies from client bundling
  define: {
    // Prevent server-side code from being bundled in client
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  build: {
    // Optimize chunk size - lower threshold to catch bloat earlier
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      // Exclude API files from client build
      external: (id) => {
        // Only exclude actual API files, not all files with /api/ in path
        return id.includes('/api/') && (id.endsWith('.ts') || id.endsWith('.js'));
      },
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
            // React Window for virtual scrolling
            if (id.includes('react-window')) {
              return 'react-window';
            }
            // Other vendors
            return 'vendor';
          }
          
          // Split by feature/route for better caching
          if (id.includes('/components/Dashboard')) {
            return 'dashboard';
          }
          if (id.includes('/components/AdminPanel')) {
            return 'admin';
          }
          if (id.includes('/components/VehicleList') || id.includes('/components/VehicleDetail')) {
            return 'vehicles';
          }
          if (id.includes('/components/Home')) {
            return 'home';
          }
          if (id.includes('/components/Profile') || id.includes('/components/Login')) {
            return 'auth';
          }
          
          // Split constants by type for better lazy loading
          if (id.includes('/constants/location')) {
            return 'constants-location';
          }
          if (id.includes('/constants/plans')) {
            return 'constants-plans';
          }
          if (id.includes('/constants/fallback')) {
            return 'constants-fallback';
          }
          if (id.includes('/constants/boost')) {
            return 'constants-boost';
          }
          if (id.includes('/constants/') || id.includes('/data/')) {
            return 'constants';
          }
          
          // Split services by functionality
          if (id.includes('/services/vehicleService')) {
            return 'service-vehicle';
          }
          if (id.includes('/services/userService')) {
            return 'service-user';
          }
          if (id.includes('/services/geminiService')) {
            return 'service-gemini';
          }
          if (id.includes('/services/')) {
            return 'services';
          }
          
          // Split utils
          if (id.includes('/utils/')) {
            return 'utils';
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
    // Optimize for faster loading
    reportCompressedSize: false,
  },
  server: {
    port: 5174,
    // Development server optimizations
    hmr: {
      overlay: true
    },
    // Enable file system caching for faster rebuilds
    fs: {
      cachedChecks: true,
      // Exclude API files from file system watching
      deny: ['**/api/**']
    },
    // Optimize development server performance
    warmup: {
      clientFiles: ['./src/App.tsx', './src/components/Header.tsx', './src/components/Home.tsx']
    },
    // No proxy needed - using Vercel serverless functions
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3000',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, '/api')
    //   }
    // }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    // Exclude heavy dependencies from pre-bundling
    exclude: ['@google/genai', 'mongodb']
  },
  // Enable esbuild optimizations in dev mode
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
