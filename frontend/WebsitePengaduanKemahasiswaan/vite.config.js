import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Minimal React configuration to prevent conflicts
      jsxImportSource: 'react',
    }),
    // Re-enable compression now that the app is stable
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false
    }),
  ],
  build: {
    // Use esbuild for faster, more stable builds
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // CRITICAL: Extremely conservative chunking - keep everything together
        manualChunks: (id) => {
          // CRITICAL: Keep React, Emotion, and MUI together to prevent initialization issues
          if (id.includes('react') || 
              id.includes('@emotion/') || 
              id.includes('@mui/') ||
              id.includes('emotion')) {
            return 'react-mui-vendor';
          }
          
          // Charts - separate heavy library
          if (id.includes('recharts')) {
            return 'charts-vendor';
          }
          
          // Keep everything else together
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
          
          // Don't split application code at all
          return undefined;
        },
        // Simple naming to prevent conflicts
        chunkFileNames: 'js/[name].[hash].js',
        entryFileNames: 'js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif)$/i.test(assetInfo.name)) {
            return `images/[name].[hash][extname]`
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `fonts/[name].[hash][extname]`
          }
          if (/\.(css)$/i.test(assetInfo.name)) {
            return `css/[name].[hash][extname]`
          }
          return `assets/[name].[hash][extname]`
        },
        // CRITICAL: Ensure proper module format and loading order
        format: 'es',
        hoistTransitiveImports: false,
        preserveModules: false,
        inlineDynamicImports: false,
        // CRITICAL: Ensure React loads first
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'main') {
            return 'js/main.[hash].js';
          }
          return 'js/[name].[hash].js';
        },
      },
      // CRITICAL: Disable tree shaking for React/Emotion to prevent issues
      treeshake: {
        moduleSideEffects: true, // Keep all side effects
        propertyReadSideEffects: true,
        unknownGlobalSideEffects: true
      },
      // CRITICAL: Ensure proper external handling
      external: [],
    },
    chunkSizeWarningLimit: 2000, // Allow larger chunks for stability
    sourcemap: false,
    cssCodeSplit: false, // Keep CSS together
    target: 'es2020',
    cssMinify: 'esbuild',
    reportCompressedSize: false,
    assetsInlineLimit: 4096,
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
  // CRITICAL: Force pre-bundling to ensure proper loading order
  optimizeDeps: {
    include: [
      // CRITICAL: React must be first
      'react',
      'react/jsx-runtime',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      // Then Emotion
      '@emotion/react',
      '@emotion/styled',
      '@emotion/cache',
      '@emotion/utils',
      '@emotion/serialize',
      '@emotion/sheet',
      '@emotion/css',
      '@emotion/server',
      '@emotion/weak-memoization',
      '@emotion/memoize',
      '@emotion/hash',
      '@emotion/unitless',
      '@emotion/is-prop-valid',
      // Then Material-UI
      '@mui/material',
      '@mui/material/styles',
      '@mui/system',
      '@mui/utils',
      '@mui/material/Button',
      '@mui/material/TextField',
      '@mui/material/Box',
      '@mui/material/Typography',
      '@mui/material/Container',
      // Other dependencies
      'axios',
      'zustand',
      'date-fns',
      'uuid'
    ],
    exclude: ['@vite/client', '@vite/env'],
    force: true,
    // CRITICAL: Conservative esbuild options for pre-bundling
    esbuildOptions: {
      target: 'es2020',
      format: 'esm',
      treeShaking: false, // Disable completely for pre-bundling
      keepNames: true,
      minify: false, // Don't minify during pre-bundling
    }
  },
  // CRITICAL: Minimal esbuild configuration
  esbuild: {
    // Don't drop anything that might be needed
    drop: [],
    legalComments: 'none',
    // Very conservative optimizations
    treeShaking: false, // Disable tree shaking completely
    minifyIdentifiers: false,
    minifySyntax: false, // Don't change syntax
    minifyWhitespace: true,
    // CRITICAL: Keep all names and structure
    keepNames: true,
    target: 'es2020',
  },
  // Define global constants
  define: {
    __DEV__: process.env.NODE_ENV !== 'production',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // CRITICAL: Ensure React is available globally
    'global': 'globalThis',
  },
  // CSS processing
  css: {
    postcss: './postcss.config.cjs',
    modules: false,
  },
  // Server configuration for development
  server: {
    port: 5173,
    host: true,
    open: false,
  },
  // CRITICAL: Resolve configuration to prevent multiple instances
  resolve: {
    // Dedupe ALL critical packages
    dedupe: [
      'react', 
      'react-dom', 
      'react/jsx-runtime',
      '@emotion/react', 
      '@emotion/styled',
      '@emotion/cache',
      '@emotion/utils',
      '@emotion/serialize',
      '@mui/material',
      '@mui/system',
      '@mui/utils'
    ],
    alias: {
      // CRITICAL: Ensure single instances with explicit paths
      'react': 'react',
      'react-dom': 'react-dom',
      '@emotion/react': '@emotion/react',
      '@emotion/styled': '@emotion/styled',
    },
    // CRITICAL: Ensure proper module resolution
    conditions: ['import', 'module', 'browser', 'default'],
    mainFields: ['browser', 'module', 'main'],
  }
})