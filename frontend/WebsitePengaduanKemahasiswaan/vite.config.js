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
    // Use terser for more stable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        // Prevent variable hoisting that causes initialization issues
        hoist_vars: false,
        hoist_funs: false,
        // Keep function names to prevent initialization conflicts
        keep_fnames: true,
        // Prevent aggressive inlining that can cause circular dependencies
        inline: 1,
        // Reduce passes to prevent over-optimization
        passes: 1,
      },
      mangle: {
        // Keep class names to prevent Emotion conflicts
        keep_classnames: true,
        // Keep function names for better debugging
        keep_fnames: true,
      },
      format: {
        // Preserve comments that might be important for initialization
        comments: false,
      }
    },
    rollupOptions: {
      output: {
        // SAFE manual chunking - only split the largest dependencies
        manualChunks: (id) => {
          // React ecosystem - keep together but separate from main
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          
          // Material-UI - largest dependency, split into logical groups
          if (id.includes('@mui/material')) {
            return 'mui-material';
          }
          if (id.includes('@mui/icons-material')) {
            return 'mui-icons';
          }
          if (id.includes('@emotion/')) {
            return 'emotion';
          }
          
          // Charts - heavy library
          if (id.includes('recharts')) {
            return 'charts';
          }
          
          // Other large dependencies
          if (id.includes('axios')) {
            return 'http-client';
          }
          if (id.includes('date-fns')) {
            return 'date-utils';
          }
          if (id.includes('zustand')) {
            return 'state-manager';
          }
          
          // Keep all other node_modules together
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
          
          // Don't split application code to prevent initialization issues
          return undefined;
        },
        // Use simple naming to prevent conflicts
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
        // Prevent hoisting issues
        hoistTransitiveImports: false,
        // Preserve module structure
        preserveModules: false,
        // Ensure proper initialization order
        inlineDynamicImports: false,
      },
      // Re-enable conservative tree shaking
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      },
    },
    chunkSizeWarningLimit: 1000, // More reasonable limit
    sourcemap: false,
    cssCodeSplit: true, // Re-enable CSS code splitting
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
  // Optimize dependencies - Force pre-bundling of problematic packages
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@emotion/react',
      '@emotion/styled',
      '@emotion/cache',
      '@emotion/utils',
      '@emotion/serialize',
      '@emotion/sheet',
      '@mui/material',
      '@mui/material/styles',
      '@mui/system',
      'axios',
      'zustand'
    ],
    exclude: ['@vite/client', '@vite/env'],
    force: true,
    // Ensure proper dependency resolution
    esbuildOptions: {
      target: 'es2020',
      format: 'esm',
      // Conservative optimization during pre-bundling
      treeShaking: true,
    }
  },
  // Minimal esbuild configuration
  esbuild: {
    // Keep more debugging info in production
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
    legalComments: 'none',
    // Re-enable conservative optimizations
    treeShaking: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    // Keep function names for better error tracking
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
    // Ensure CSS modules work properly
    modules: false,
  },
  // Server configuration for development
  server: {
    port: 5173,
    host: true,
    open: false,
  },
  // Resolve configuration
  resolve: {
    // Ensure proper module resolution
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
    alias: {
      // Prevent multiple React instances
      'react': 'react',
      'react-dom': 'react-dom',
    }
  }
})