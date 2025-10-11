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
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            return 'vendor';
          }
        }
      }
    },
    // Enable minification with esbuild (faster and built-in)
    minify: 'esbuild',
    // Drop console and debugger in production
    esbuild: {
      drop: ['console', 'debugger']
    },
    // Optimize CSS
    cssMinify: true,
    // Enable source maps for debugging (can be disabled for production)
    sourcemap: false
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
    exclude: []
  }
})
