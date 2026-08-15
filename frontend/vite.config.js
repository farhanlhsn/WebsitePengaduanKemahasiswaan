import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  plugins: [
    react(),
    // Gzip compression for production assets
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false,
    }),
    // Brotli compression (better ratio than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    }),
  ],
  build: {
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React ecosystem
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          // MUI + Emotion (large but cohesive)
          'vendor-mui': [
            '@mui/material',
            '@mui/icons-material',
            '@mui/lab',
            '@emotion/react',
            '@emotion/styled',
          ],
          // Charts (lazy loaded pages only)
          'vendor-charts': ['recharts'],
          // Utilities
          'vendor-utils': ['axios', 'zustand', 'date-fns', 'uuid', 'socket.io-client'],
          // Document viewers (heavy, lazy loaded)
          'vendor-docs': ['react-pdf', 'mammoth'],
        },
        // Organized output structure
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif)$/i.test(assetInfo.name)) {
            return 'images/[name]-[hash][extname]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return 'fonts/[name]-[hash][extname]'
          }
          if (/\.(css)$/i.test(assetInfo.name)) {
            return 'css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
  // Resolve configuration
  resolve: {
    dedupe: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
    ],
  },
  // Optimized dependency pre-bundling for dev
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/icons-material',
      'axios',
      'zustand',
    ],
  },
  // CSS processing
  css: {
    postcss: './postcss.config.cjs',
  },
  // Server configuration for development
  server: {
    port: 5173,
    host: true,
    open: false,
  },
  // Preview server (production build preview)
  preview: {
    port: 4173,
    host: true,
  },
})
