import { lazy, memo } from 'react';

/**
 * Enhanced Dynamic Import Helper
 * Reduces initial JS payload by implementing more aggressive code splitting
 */

// Utility function for creating optimized lazy components
export const createLazyComponent = (importFn, fallback = null) => {
  return lazy(() => {
    return new Promise((resolve) => {
      // Use requestIdleCallback to load components during idle time
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          try {
            const module = await importFn();
            resolve(module);
          } catch (error) {
            console.error('Failed to load component:', error);
            resolve({ default: () => fallback || <div>Error loading component</div> });
          }
        }, { timeout: 100 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(async () => {
          try {
            const module = await importFn();
            resolve(module);
          } catch (error) {
            console.error('Failed to load component:', error);
            resolve({ default: () => fallback || <div>Error loading component</div> });
          }
        }, 0);
      }
    });
  });
};

// Preload function for critical components
export const preloadComponent = (importFn) => {
  // Only preload in modern browsers with good connection
  if (typeof navigator !== 'undefined' && 'connection' in navigator && navigator.connection) {
    const connection = navigator.connection;
    if (connection.effectiveType === '4g' || connection.effectiveType === '3g') {
      return importFn().catch(() => {
        // Ignore preload errors
      });
    }
  } else {
    // Fallback: preload after a delay if navigator.connection is not available
    setTimeout(() => {
      importFn().catch(() => {
        // Ignore preload errors
      });
    }, 1000);
  }
};

// Dynamic imports for major dependencies (only load when needed)
export const getDynamicMUIComponents = () => ({
  // Data Display Components (load on demand)
  Table: createLazyComponent(() => import('@mui/material/Table')),
  TableBody: createLazyComponent(() => import('@mui/material/TableBody')),
  TableCell: createLazyComponent(() => import('@mui/material/TableCell')),
  TableHead: createLazyComponent(() => import('@mui/material/TableHead')),
  TableRow: createLazyComponent(() => import('@mui/material/TableRow')),
  TablePagination: createLazyComponent(() => import('@mui/material/TablePagination')),
  
  // Feedback Components (load on demand)
  Dialog: createLazyComponent(() => import('@mui/material/Dialog')),
  DialogTitle: createLazyComponent(() => import('@mui/material/DialogTitle')),
  DialogContent: createLazyComponent(() => import('@mui/material/DialogContent')),
  DialogActions: createLazyComponent(() => import('@mui/material/DialogActions')),
  Snackbar: createLazyComponent(() => import('@mui/material/Snackbar')),
  Alert: createLazyComponent(() => import('@mui/material/Alert')),
  
  // Navigation Components (load on demand)
  Drawer: createLazyComponent(() => import('@mui/material/Drawer')),
  Menu: createLazyComponent(() => import('@mui/material/Menu')),
  MenuItem: createLazyComponent(() => import('@mui/material/MenuItem')),
  Tabs: createLazyComponent(() => import('@mui/material/Tabs')),
  Tab: createLazyComponent(() => import('@mui/material/Tab')),
  
  // Input Components (load on demand)
  Autocomplete: createLazyComponent(() => import('@mui/material/Autocomplete')),
  
  // Chart Components (heavy - load only when needed)
  Chart: createLazyComponent(() => import('recharts')),
});

// Dynamic imports for icons (load only specific icons when needed)
export const getDynamicIcons = () => ({
  Dashboard: createLazyComponent(() => import('@mui/icons-material/Dashboard')),
  Person: createLazyComponent(() => import('@mui/icons-material/Person')),
  Settings: createLazyComponent(() => import('@mui/icons-material/Settings')),
  Logout: createLazyComponent(() => import('@mui/icons-material/Logout')),
  Add: createLazyComponent(() => import('@mui/icons-material/Add')),
  Edit: createLazyComponent(() => import('@mui/icons-material/Edit')),
  Delete: createLazyComponent(() => import('@mui/icons-material/Delete')),
  Search: createLazyComponent(() => import('@mui/icons-material/Search')),
  Filter: createLazyComponent(() => import('@mui/icons-material/FilterList')),
  Download: createLazyComponent(() => import('@mui/icons-material/Download')),
  Upload: createLazyComponent(() => import('@mui/icons-material/Upload')),
  Notification: createLazyComponent(() => import('@mui/icons-material/Notifications')),
  Menu: createLazyComponent(() => import('@mui/icons-material/Menu')),
  Close: createLazyComponent(() => import('@mui/icons-material/Close')),
  Check: createLazyComponent(() => import('@mui/icons-material/Check')),
  Warning: createLazyComponent(() => import('@mui/icons-material/Warning')),
  Error: createLazyComponent(() => import('@mui/icons-material/Error')),
  Info: createLazyComponent(() => import('@mui/icons-material/Info')),
});

// Utility functions for reducing bundle size
export const optimizeForProduction = () => {
  // Remove development-only code
  if (import.meta.env.PROD) {
    // Disable React DevTools
    if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = null;
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount = null;
    }
    
    // Remove debug information
    delete window.__webpack_require__;
    delete window.webpackChunk;
  }
};

// Memoized components to prevent unnecessary re-renders
export const createMemoizedComponent = (Component, areEqual) => {
  return memo(Component, areEqual);
};

// Function to dynamically import and cache utilities
const utilsCache = new Map();

export const getDynamicUtility = async (utilityName) => {
  if (utilsCache.has(utilityName)) {
    return utilsCache.get(utilityName);
  }
  
  let utility;
  switch (utilityName) {
    case 'date-fns':
      utility = await import('date-fns');
      break;
    case 'uuid':
      utility = await import('uuid');
      break;
    case 'axios':
      utility = await import('axios');
      break;
    default:
      throw new Error(`Unknown utility: ${utilityName}`);
  }
  
  utilsCache.set(utilityName, utility);
  return utility;
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (callback, options = {}) => {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver(callback, {
      rootMargin: '50px 0px',
      threshold: 0.1,
      ...options
    });
  }
  return null;
};

// Performance monitoring utilities
export const measurePerformance = (name, fn) => {
  if ('performance' in window && import.meta.env.DEV) {
    performance.mark(`${name}-start`);
    const result = fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    console.log(`${name} took ${measure.duration}ms`);
    
    return result;
  }
  return fn();
};

export default {
  createLazyComponent,
  preloadComponent,
  getDynamicMUIComponents,
  getDynamicIcons,
  optimizeForProduction,
  createMemoizedComponent,
  getDynamicUtility,
  createIntersectionObserver,
  measurePerformance
}; 
