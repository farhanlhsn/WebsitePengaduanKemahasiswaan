import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Ensure React is properly configured
      jsxImportSource: 'react',
      // Disable fast refresh to prevent conflicts
      fastRefresh: false,
    }),
    // Disable compression temporarily to debug
    // viteCompression({
    //   algorithm: 'gzip',
    //   ext: '.gz',
    //   threshold: 1024,
    //   deleteOriginFile: false
    // }),
  ],
  build: {
    // Use terser for more stable builds
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        // CRITICAL: Don't optimize away React or Emotion
        pure_funcs: [],
        pure_getters: false,
        unsafe: false,
        unsafe_comps: false,
        unsafe_Function: false,
        unsafe_math: false,
        unsafe_symbols: false,
        unsafe_methods: false,
        unsafe_proto: false,
        unsafe_regexp: false,
        unsafe_undefined: false,
      },
      mangle: {
        // CRITICAL: Don't mangle React or critical function names
        reserved: ['React', 'ReactDOM', 'emotion', 'styled', 'css', 'jsx'],
        keep_fnames: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        // CRITICAL: Single vendor chunk to ensure proper loading order
        manualChunks: {
          // CRITICAL: Single vendor chunk with React first
          'vendor': [
            'react',
            'react/jsx-runtime', 
            'react-dom',
            'react-dom/client',
            '@emotion/react',
            '@emotion/styled',
            '@emotion/cache',
            '@mui/material',
            '@mui/system',
            '@mui/icons-material',
            'react-router-dom'
          ],
          // Separate chunk for charts
          'charts': ['recharts'],
          // Separate chunk for utilities
          'utils': ['axios', 'zustand', 'date-fns', 'uuid']
        },
        // CRITICAL: Ensure vendor loads first
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'vendor') {
            return 'js/vendor.[hash].js';
          }
          return 'js/[name].[hash].js';
        },
        entryFileNames: 'js/main.[hash].js',
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
        // CRITICAL: Ensure ES modules with proper imports
        format: 'es',
        hoistTransitiveImports: false,
        preserveModules: false,
        inlineDynamicImports: false,
        // CRITICAL: Ensure proper import order
        intro: `
          // Ensure React is available globally before any other code runs
          if (typeof window !== 'undefined') {
            window.React = window.React || {};
          }
        `,
      },
      // CRITICAL: Completely disable tree shaking for stability
      treeshake: false,
      // CRITICAL: Ensure proper external handling
      external: [],
    },
    chunkSizeWarningLimit: 3000, // Allow larger chunks for stability
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
  // CRITICAL: Force pre-bundling with explicit order
  optimizeDeps: {
    include: [
      // CRITICAL: React MUST be first and complete
      'react',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom',
      'react-dom/client',
      // Then React Router
      'react-router-dom',
      // Then Emotion (only main packages - internal deps will be auto-included)
      '@emotion/react',
      '@emotion/styled',
      '@emotion/cache',
      // Then Material-UI (main packages only)
      '@mui/material',
      '@mui/material/styles',
      '@mui/system',
      '@mui/material/Button',
      '@mui/material/TextField',
      '@mui/material/Box',
      '@mui/material/Typography',
      '@mui/material/Container',
      '@mui/material/Paper',
      '@mui/material/Grid',
      '@mui/material/Stack',
      '@mui/material/Divider',
      '@mui/material/Card',
      '@mui/material/CardContent',
      '@mui/material/CardActions',
      '@mui/material/List',
      '@mui/material/ListItem',
      '@mui/material/ListItemText',
      '@mui/material/Avatar',
      '@mui/material/Chip',
      '@mui/material/Alert',
      '@mui/material/CircularProgress',
      '@mui/material/LinearProgress',
      '@mui/material/Dialog',
      '@mui/material/DialogTitle',
      '@mui/material/DialogContent',
      '@mui/material/DialogActions',
      '@mui/material/Drawer',
      '@mui/material/AppBar',
      '@mui/material/Toolbar',
      '@mui/material/IconButton',
      '@mui/material/Menu',
      '@mui/material/MenuItem',
      '@mui/material/Tooltip',
      '@mui/material/Skeleton',
      '@mui/material/Accordion',
      '@mui/material/AccordionSummary',
      '@mui/material/AccordionDetails',
      '@mui/material/Table',
      '@mui/material/TableBody',
      '@mui/material/TableCell',
      '@mui/material/TableContainer',
      '@mui/material/TableHead',
      '@mui/material/TableRow',
      '@mui/material/TablePagination',
      '@mui/material/FormControl',
      '@mui/material/InputLabel',
      '@mui/material/Select',
      '@mui/material/FormControlLabel',
      '@mui/material/Switch',
      '@mui/material/Checkbox',
      '@mui/material/Radio',
      '@mui/material/RadioGroup',
      '@mui/material/Slider',
      '@mui/material/Rating',
      '@mui/material/Autocomplete',
      '@mui/material/Badge',
      '@mui/material/Breadcrumbs',
      '@mui/material/ButtonGroup',
      '@mui/material/Collapse',
      '@mui/material/Fade',
      '@mui/material/Grow',
      '@mui/material/Slide',
      '@mui/material/Zoom',
      '@mui/material/Backdrop',
      '@mui/material/Modal',
      '@mui/material/Popover',
      '@mui/material/Popper',
      '@mui/material/Snackbar',
      '@mui/material/Step',
      '@mui/material/StepLabel',
      '@mui/material/StepContent',
      '@mui/material/Stepper',
      '@mui/material/SwipeableDrawer',
      '@mui/material/Tab',
      '@mui/material/Tabs',
      '@mui/material/ToggleButton',
      '@mui/material/ToggleButtonGroup',
      '@mui/material/useMediaQuery',
      '@mui/icons-material',
      // Other dependencies
      'axios',
      'zustand',
      'zustand/middleware',
      'date-fns',
      'date-fns/locale',
      'uuid',
      'recharts'
    ],
    exclude: ['@vite/client', '@vite/env'],
    force: true,
    // CRITICAL: Very conservative esbuild options
    esbuildOptions: {
      target: 'es2020',
      format: 'esm',
      treeShaking: false,
      keepNames: true,
      minify: false,
      sourcemap: false,
      // CRITICAL: Don't mangle properties - remove mangleProps entirely
      // mangleProps should be undefined or a RegExp, not false
      reserveProps: /^(React|ReactDOM|emotion|styled|css|jsx|createElement|Fragment)$/,
    }
  },
  // CRITICAL: Minimal esbuild configuration for development
  esbuild: {
    // Don't drop anything
    drop: [],
    legalComments: 'none',
    // CRITICAL: No optimizations that could break React/Emotion
    treeShaking: false,
    minifyIdentifiers: false,
    minifySyntax: false,
    minifyWhitespace: false,
    keepNames: true,
    target: 'es2020',
    // CRITICAL: Preserve JSX and React patterns
    jsx: 'automatic',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    jsxImportSource: 'react',
  },
  // Define global constants
  define: {
    __DEV__: process.env.NODE_ENV !== 'production',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // CRITICAL: Ensure globals are available
    'global': 'globalThis',
  },
  // CSS processing
  css: {
    postcss: './postcss.config.cjs',
    modules: false,
    devSourcemap: false,
  },
  // Server configuration for development
  server: {
    port: 5173,
    host: true,
    open: false,
  },
  // CRITICAL: Resolve configuration to prevent conflicts
  resolve: {
    // CRITICAL: Dedupe packages that could cause conflicts (main packages only)
    dedupe: [
      'react', 
      'react-dom', 
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@emotion/react', 
      '@emotion/styled',
      '@emotion/cache',
      '@mui/material',
      '@mui/system',
      'react-router-dom'
    ],
    alias: {
      // CRITICAL: Explicit aliases to prevent multiple instances
      'react': 'react',
      'react-dom': 'react-dom',
      '@emotion/react': '@emotion/react',
      '@emotion/styled': '@emotion/styled',
      '@emotion/cache': '@emotion/cache',
    },
    // CRITICAL: Ensure proper module resolution order
    conditions: ['import', 'module', 'browser', 'default'],
    mainFields: ['browser', 'module', 'main'],
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  }
})