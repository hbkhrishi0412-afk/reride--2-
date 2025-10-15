import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
      // Enable babel plugins for better optimization
      babel: {
        plugins: [
          // Remove console.log in production
          process.env.NODE_ENV === 'production' && ['transform-remove-console', { exclude: ['error', 'warn'] }]
        ].filter(Boolean)
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@components': resolve(__dirname, './components'),
      '@services': resolve(__dirname, './services'),
      '@utils': resolve(__dirname, './utils'),
      '@types': resolve(__dirname, './types.ts')
    }
  },
  build: {
    // Ultra-aggressive chunk size optimization
    chunkSizeWarningLimit: 200, // Very strict warning limit
    rollupOptions: {
      output: {
        // Ultra-aggressive code splitting for maximum efficiency
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React core - most critical, smallest possible
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }
            // React hooks and utilities
            if (id.includes('react-hooks') || id.includes('react-router')) {
              return 'react-utils';
            }
            // Chart.js - only loaded when needed
            if (id.includes('chart.js') || id.includes('react-chartjs')) {
              return 'charts';
            }
            // Firebase - split by feature for better caching
            if (id.includes('firebase/auth')) {
              return 'firebase-auth';
            }
            if (id.includes('firebase/firestore')) {
              return 'firebase-firestore';
            }
            if (id.includes('firebase') && !id.includes('firebase/auth') && !id.includes('firebase/firestore')) {
              return 'firebase-core';
            }
            // Mongoose - backend only
            if (id.includes('mongoose')) {
              return 'mongoose';
            }
            // Google AI - only when needed
            if (id.includes('@google/genai')) {
              return 'ai';
            }
            // Other vendors
            return 'vendor';
          }
          // Split components by feature and usage frequency
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
          if (id.includes('/components/Profile') || id.includes('/components/CustomerInbox')) {
            return 'user';
          }
          if (id.includes('/components/Login') || id.includes('/components/Auth')) {
            return 'auth';
          }
          if (id.includes('/components/Header') || id.includes('/components/Footer')) {
            return 'layout';
          }
          if (id.includes('/components/Comparison') || id.includes('/components/QuickView')) {
            return 'interactive';
          }
          // Split services
          if (id.includes('/services/')) {
            return 'services';
          }
          // Split utilities
          if (id.includes('/utils/') || id.includes('/lib/')) {
            return 'utils';
          }
        },
        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          return `assets/js/[name]-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/css/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      },
      external: (id) => {
        // Externalize heavy dependencies that might be available via CDN
        return false; // Keep everything bundled for now
      }
    },
    // Enable minification with esbuild (faster than terser)
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],
      legalComments: 'none',
      // Optimize for modern browsers
      target: 'es2020',
      // Advanced minification options
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      // Remove unused code more aggressively
      treeShaking: true
    },
    // Optimize CSS
    cssMinify: true,
    // Disable source maps for production
    sourcemap: false,
    // Enable compression
    target: 'es2020',
    // Reduce chunk size
    cssCodeSplit: true,
    // Enable tree shaking
    treeshake: {
      moduleSideEffects: false
    },
    // Optimize assets
    assetsInlineLimit: 1024, // 1kb - very aggressive inlining
    // Enable compression
    reportCompressedSize: false, // Disable to speed up build
    // Optimize for production
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    },
    // Enable HMR
    hmr: true,
    // Optimize server performance
    fs: {
      strict: false
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime'
    ],
    exclude: ['@google/genai', 'mongoose'],
    // Force pre-bundling of common dependencies
    force: true
  },
  // Enable experimental features for better performance
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `/${filename}` }
      } else {
        return { relative: true }
      }
    }
  },
  // Define global constants
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  }
})