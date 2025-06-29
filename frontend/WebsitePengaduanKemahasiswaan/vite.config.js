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
        // CRITICAL: Very conservative chunking to prevent initialization issues
        manualChunks: (id) => {
          // Keep React ecosystem together
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          
          // CRITICAL: Keep ALL Emotion packages together to prevent circular deps
          if (id.includes('@emotion/') || id.includes('emotion')) {
            return 'emotion-vendor';
          }
          
          // Keep Material-UI together with Emotion since they're tightly coupled
          if (id.includes('@mui/')) {
            return 'mui-vendor';
          }
          
          // Charts - separate heavy library
          if (id.includes('recharts')) {
            return 'charts-vendor';
          }
          
          // Other utilities
          if (id.includes('axios')) {
            return 'utils-vendor';
          }
          
          // Keep everything else together
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
          
          // Don't split application code
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
        // Ensure proper module format
        format: 'es',
        // CRITICAL: Prevent hoisting that can cause initialization issues
        hoistTransitiveImports: false,
        // Preserve module structure
        preserveModules: false,
        // Don't inline dynamic imports
        inlineDynamicImports: false,
      },
      // Conservative tree shaking
      treeshake: {
        moduleSideEffects: (id) => {
          // Preserve side effects for Emotion and MUI
          if (id.includes('@emotion/') || id.includes('@mui/')) {
            return true;
          }
          return false;
        },
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      },
    },
    chunkSizeWarningLimit: 1500, // Reasonable limit
    sourcemap: false,
    cssCodeSplit: true,
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
  // CRITICAL: Force pre-bundling of Emotion to prevent runtime issues
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      // CRITICAL: Pre-bundle ALL Emotion packages together
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
      // Material-UI core
      '@mui/material',
      '@mui/material/styles',
      '@mui/system',
      '@mui/utils',
      // Other dependencies
      'axios',
      'zustand',
      'date-fns',
      'uuid'
    ],
    exclude: ['@vite/client', '@vite/env'],
    force: true,
    // Conservative esbuild options
    esbuildOptions: {
      target: 'es2020',
      format: 'esm',
      treeShaking: false, // Disable for pre-bundling to prevent issues
      keepNames: true,
    }
  },
  // Minimal esbuild configuration
  esbuild: {
    // Keep debugging info
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
    legalComments: 'none',
    // Conservative optimizations
    treeShaking: true,
    minifyIdentifiers: false, // Keep identifiers for better debugging
    minifySyntax: true,
    minifyWhitespace: true,
    // CRITICAL: Keep function and class names
    keepNames: true,
  },
  // Define global constants
  define: {
    __DEV__: process.env.NODE_ENV !== 'production',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
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
    // Dedupe critical packages
    dedupe: [
      'react', 
      'react-dom', 
      '@emotion/react', 
      '@emotion/styled',
      '@emotion/cache',
      '@mui/material',
      '@mui/system'
    ],
    alias: {
      // Ensure single instances
      'react': 'react',
      'react-dom': 'react-dom',
      '@emotion/react': '@emotion/react',
      '@emotion/styled': '@emotion/styled',
    }
  }
})