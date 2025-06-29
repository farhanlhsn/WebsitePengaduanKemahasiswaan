import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Fix Emotion build issues with proper SWC configuration
      jsxImportSource: '@emotion/react',
      plugins: [
        // Remove SWC emotion plugin as it conflicts with Vite's handling
      ]
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
        // Fix Emotion chunking to prevent initialization issues
        manualChunks: (id) => {
          // React ecosystem - smallest possible chunks
          if (id.includes('react/') || id.includes('react-dom/')) {
            return 'react-core';
          }
          if (id.includes('react-router')) {
            return 'react-router';
          }
          
          // Emotion - CRITICAL: Keep emotion in vendor chunk to ensure proper initialization
          if (id.includes('@emotion/')) {
            return 'vendor-emotion';
          }
          
          // Material-UI - split into smaller chunks
          if (id.includes('@mui/material/')) {
            // Core components
            if (id.includes('Button') || id.includes('TextField') || id.includes('Box')) {
              return 'mui-core';
            }
            // Layout components
            if (id.includes('Grid') || id.includes('Container') || id.includes('Stack')) {
              return 'mui-layout';
            }
            // Data display components
            if (id.includes('Table') || id.includes('List') || id.includes('Card')) {
              return 'mui-data';
            }
            // Navigation components
            if (id.includes('Menu') || id.includes('Drawer') || id.includes('Tabs')) {
              return 'mui-navigation';
            }
            // Feedback components
            if (id.includes('Dialog') || id.includes('Snackbar') || id.includes('Alert')) {
              return 'mui-feedback';
            }
            // Other MUI components
            return 'mui-misc';
          }
          
          if (id.includes('@mui/icons-material')) {
            return 'mui-icons';
          }
          
          // Chart library
          if (id.includes('recharts')) {
            return 'charts';
          }
          
          // Utilities
          if (id.includes('date-fns')) {
            return 'date-utils';
          }
          if (id.includes('axios')) {
            return 'http-client';
          }
          if (id.includes('zustand')) {
            return 'state-manager';
          }
          if (id.includes('uuid')) {
            return 'uuid';
          }
          
          // Font loading
          if (id.includes('@fontsource')) {
            return 'fonts';
          }
          
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
          
          // Application code - very granular chunking
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1].split('.')[0];
            if (pageName.includes('Login') || pageName.includes('Register')) {
              return 'page-auth';
            }
            if (pageName.includes('Dashboard')) {
              return 'page-dashboard';
            }
            if (pageName.includes('Profile') || pageName.includes('Settings')) {
              return 'page-user';
            }
            return `page-${pageName.toLowerCase()}`;
          }
          
          if (id.includes('/components/dashboard/')) {
            return 'comp-dashboard';
          }
          
          if (id.includes('/components/ui/')) {
            return 'comp-ui';
          }
          
          if (id.includes('/components/admin/')) {
            return 'comp-admin';
          }
          
          if (id.includes('/stores/')) {
            return 'app-stores';
          }
          
          if (id.includes('/services/')) {
            return 'app-services';
          }
        },
        // Optimize chunk and asset names for better caching
        chunkFileNames: (chunkInfo) => {
          // Use content-based hashing for better caching
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
        // Experimental: reduce bundle size further
        generatedCode: 'es2015', // Use modern JS for smaller bundles
        compact: true, // Remove unnecessary whitespace
        sourcemap: false // No sourcemaps in production
      },
      // Tree shaking optimizations
      treeshake: {
        moduleSideEffects: false, // Assume modules have no side effects
        propertyReadSideEffects: false, // Assume property reads have no side effects
        unknownGlobalSideEffects: false // Assume unknown globals have no side effects
      }
    },
    chunkSizeWarningLimit: 500, // Reduced from 800 for smaller chunks
    sourcemap: false,
    cssCodeSplit: true,
    target: 'es2020', // Modern browsers for smaller bundle
    // Experimental options for smaller bundles
    cssMinify: true, // Use esbuild for CSS minification (more compatible than lightningcss)
    reportCompressedSize: false, // Skip gzip size reporting for faster builds
    // Split CSS into smaller chunks
    assetsInlineLimit: 2048 // Inline assets smaller than 2KB
  },
  // Asset handling
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp', '**/*.avif', '**/*.svg'],
  // Production server settings
  preview: {
    port: 4173,
    host: true,
    // Remove problematic headers - let Vite handle compression
    headers: {
      'Cache-Control': 'public, max-age=31536000' // 1 year cache for static assets
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material/Button',
      '@mui/material/TextField',
      '@mui/material/Box',
      '@mui/material/Typography',
      '@mui/material/Container',
      '@emotion/react',
      '@emotion/styled'
    ],
    exclude: ['@vite/client', '@vite/env'],
    // Force optimization of certain packages
    force: true
  },
  // Performance optimizations
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none', // Remove legal comments
    treeShaking: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  },
  // Define global constants to enable dead code elimination
  define: {
    __DEV__: false,
    'process.env.NODE_ENV': '"production"'
  },
  // Fix CSS processing for Tailwind
  css: {
    postcss: './postcss.config.cjs'
  }
})