import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './pages/routes';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import axios from "axios";
import './index.css';
import { v4 as uuidv4 } from 'uuid';
import { optimizeForProduction } from './components/DynamicImportHelper';
import LoadingSpinner from './components/ui/LoadingSpinner';

// CRITICAL: Import fonts synchronously to prevent FOUC
import '@fontsource/inter/400.css';

// Lazy load PerformanceOptimizer to reduce initial bundle
const PerformanceOptimizer = React.lazy(() => import('./components/PerformanceOptimizer'));

// Load additional fonts during idle time
const loadAdditionalFonts = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      import('@fontsource/inter/300.css');
      import('@fontsource/inter/500.css');
      import('@fontsource/inter/600.css');
      import('@fontsource/inter/700.css');
      import('@fontsource/inter/800.css');
    }, { timeout: 3000 });
  }
};

// Axios configuration - only configure essentials
axios.defaults.baseURL = "http://localhost:6060";
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.withCredentials = true;

const FINGERPRINT_KEY = 'device_fingerprint';

export const getOrCreateDeviceFingerprint = () => {
  let fingerprint = localStorage.getItem(FINGERPRINT_KEY);
  if (!fingerprint) {
    fingerprint = uuidv4(); 
    localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  }
  return fingerprint;
};

// Production optimizations
if (process.env.NODE_ENV === 'production') {
  optimizeForProduction();
  setTimeout(() => {
    loadAdditionalFonts();
  }, 100);
}

// Enhanced error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
    
    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Add error reporting here
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif'
        }}>
          <h2 style={{ color: '#2E7D32', marginBottom: '16px' }}>
            Oops! Terjadi kesalahan.
          </h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Silakan refresh halaman atau hubungi administrator.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2E7D32',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Refresh Halaman
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '24px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#666' }}>
                Error Details (Development)
              </summary>
              <pre style={{ 
                marginTop: '12px', 
                padding: '12px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

// Main App Component
const AppContent = () => (
  <ErrorBoundary>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Suspense fallback={<LoadingSpinner fullScreen message="Mengoptimalkan performa..." />}>
        <PerformanceOptimizer />
      </Suspense>
      <RouterProvider router={router} />
    </ThemeProvider>
  </ErrorBoundary>
);

// Render with proper error handling
if (process.env.NODE_ENV === 'production') {
  root.render(<AppContent />);
} else {
  root.render(
    <React.StrictMode>
      <AppContent />
    </React.StrictMode>
  );
}