import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './pages/routes';

// CRITICAL: Import MUI components synchronously to prevent initialization issues
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import axios from "axios";
import './index.css';
import { v4 as uuidv4 } from 'uuid';
import LoadingSpinner from './components/ui/LoadingSpinner';

// CRITICAL: Import fonts synchronously to prevent FOUC
import '@fontsource/inter/400.css';

// Lazy load PerformanceOptimizer only in production
const PerformanceOptimizer = process.env.NODE_ENV === 'production' 
  ? React.lazy(() => import('./components/PerformanceOptimizer'))
  : () => null;

// Load additional fonts during idle time
const loadAdditionalFonts = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      Promise.all([
        import('@fontsource/inter/300.css'),
        import('@fontsource/inter/500.css'),
        import('@fontsource/inter/600.css'),
        import('@fontsource/inter/700.css'),
        import('@fontsource/inter/800.css')
      ]).catch(err => {
        console.warn('Failed to load additional fonts:', err);
      });
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
  // Load additional fonts after initial render
  setTimeout(loadAdditionalFonts, 100);
}

// Enhanced error boundary with better error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Add error reporting here (e.g., Sentry, LogRocket)
      try {
        // Example: Sentry.captureException(error, { extra: errorInfo });
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
      }
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
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{
            maxWidth: '500px',
            padding: '32px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
          }}>
            <h2 style={{ 
              color: '#2E7D32', 
              marginBottom: '16px',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              Oops! Terjadi kesalahan.
            </h2>
            <p style={{ 
              color: '#666', 
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Aplikasi mengalami masalah teknis. Silakan refresh halaman atau hubungi administrator jika masalah berlanjut.
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
                fontWeight: '600',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1B5E20'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#2E7D32'}
            >
              Refresh Halaman
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ 
                marginTop: '24px', 
                textAlign: 'left',
                backgroundColor: '#f5f5f5',
                padding: '16px',
                borderRadius: '8px'
              }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  color: '#666',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{ 
                  marginTop: '12px', 
                  padding: '12px', 
                  backgroundColor: '#fff', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto',
                  border: '1px solid #ddd',
                  maxHeight: '200px'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    '\n\nComponent Stack:' + this.state.errorInfo.componentStack
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

// Main App Component with better error handling
const AppContent = () => (
  <ErrorBoundary>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {process.env.NODE_ENV === 'production' && (
        <Suspense fallback={<LoadingSpinner fullScreen message="Mengoptimalkan performa..." />}>
          <PerformanceOptimizer />
        </Suspense>
      )}
      <RouterProvider router={router} />
    </ThemeProvider>
  </ErrorBoundary>
);

// Render with proper error handling
try {
  if (process.env.NODE_ENV === 'production') {
    root.render(<AppContent />);
  } else {
    root.render(
      <React.StrictMode>
        <AppContent />
      </React.StrictMode>
    );
  }
} catch (error) {
  console.error('Failed to render application:', error);
  
  // Fallback rendering in case of critical errors
  document.getElementById('root').innerHTML = `
    <div style="
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      height: 100vh;
      padding: 20px;
      text-align: center;
      font-family: Inter, sans-serif;
      background-color: #f8f9fa;
    ">
      <h2 style="color: #2E7D32; margin-bottom: 16px;">
        Aplikasi Gagal Dimuat
      </h2>
      <p style="color: #666; margin-bottom: 24px;">
        Terjadi kesalahan saat memuat aplikasi. Silakan refresh halaman.
      </p>
      <button 
        onclick="window.location.reload()"
        style="
          padding: 12px 24px;
          background-color: #2E7D32;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
        "
      >
        Refresh Halaman
      </button>
    </div>
  `;
}