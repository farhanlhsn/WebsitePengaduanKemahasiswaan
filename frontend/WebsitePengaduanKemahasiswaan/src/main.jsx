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

// Lazy load PerformanceOptimizer to reduce initial bundle
const PerformanceOptimizer = React.lazy(() => import('./components/PerformanceOptimizer'));

// Optimize font loading - only load essential weights initially
import '@fontsource/inter/400.css'; // Regular weight only
// Lazy load other weights
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
  // Remove console logs and optimize for production
  optimizeForProduction();
  
  // Load additional resources only after initial render
  setTimeout(() => {
    loadAdditionalFonts();
  }, 100);
}

// Error boundary for better error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
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
          textAlign: 'center' 
        }}>
          <h2>Oops! Terjadi kesalahan.</h2>
          <p>Silakan refresh halaman atau hubungi administrator.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#2E7D32',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Refresh Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

// Use concurrent features for better performance
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

// Use React 18 concurrent features in production
if (process.env.NODE_ENV === 'production') {
  root.render(<AppContent />);
} else {
  root.render(
    <React.StrictMode>
      <AppContent />
    </React.StrictMode>
  );
}