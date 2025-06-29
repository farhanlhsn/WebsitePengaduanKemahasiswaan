import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Remove emotion-specific configuration to prevent conflicts
      jsxImportSource: 'react',
      // Let Vite handle emotion naturally without forced configuration
    }),
    // Re-enable compression for production
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false
    })
  ],
  build: {
    // Enable minification with esbuild (faster than terser)
    minify: 'esbuild',
    rollupOptions: {
      // External dependencies that should not be bundled
      external: [],
      output: {
        // CRITICAL FIX: Simplified chunking to prevent Emotion initialization issues
        manualChunks: (id) => {
          // Keep React core together
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          
          // CRITICAL: Keep ALL emotion packages together in one chunk
          if (id.includes('@emotion/') || id.includes('emotion')) {
            return 'emotion-vendor';
          }
          
          // Keep MUI together (depends on emotion)
          if (id.includes('@mui/')) {
            return 'mui-vendor';
          }
          
          // Other vendors
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          
          // App code
          if (id.includes('/src/')) {
            return 'app';
          }
        },
        // Optimize chunk and asset names for better caching
        chunkFileNames: (chunkInfo) => {
          return `js/[name]-[hash].js`;
        },
        entryFileNames: `js/[name]-[hash].js`,
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash][extname]`
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash][extname]`
          }
          if (/\.(css)$/i.test(assetInfo.name)) {
            return `css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        // Ensure proper module format
        format: 'es',
        // Ensure proper exports
        exports: 'named',
        // Prevent hoisting issues
        hoistTransitiveImports: false
      },
      // Tree shaking optimizations
      treeshake: {
        moduleSideEffects: (id) => {
          // Emotion needs side effects for proper initialization
          if (id.includes('@emotion/')) {
            return true;
          }
          return false;
        },
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    },
    chunkSizeWarningLimit: 1000, // Increased to accommodate emotion vendor chunk
    sourcemap: false,
    cssCodeSplit: true,
    target: 'es2020',
    cssMinify: true,
    reportCompressedSize: false,
    assetsInlineLimit: 2048
  },
  // Asset handling
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp', '**/*.avif', '**/*.svg'],
  // Production server settings
  preview: {
    port: 4173,
    host: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000'
    }
  },
  // Optimize dependencies - CRITICAL: Include emotion in pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/material/Button',
      '@mui/material/TextField',
      '@mui/material/Box',
      '@mui/material/Typography',
      '@mui/material/Container'
    ],
    exclude: ['@vite/client', '@vite/env'],
    force: true
  },
  // Performance optimizations
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
    treeShaking: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  },
  // Define global constants
  define: {
    __DEV__: false,
    'process.env.NODE_ENV': '"production"'
  },
  // CSS processing
  css: {
    postcss: './postcss.config.cjs'
  }
})