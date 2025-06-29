import React, { Suspense, useState, useEffect } from 'react';
import LoadingSpinner from './ui/LoadingSpinner';

/**
 * Enhanced Lazy Component Loader
 * Reduces main thread blocking and optimizes component loading
 */
const LazyComponentLoader = ({ 
  loader, 
  fallback = <LoadingSpinner />, 
  preload = false,
  delay = 200,
  timeout = 10000,
  children 
}) => {
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let timeoutId;
    let isMounted = true;

    const loadComponent = async () => {
      try {
        // Add artificial delay to prevent flashing
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Set timeout for loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            setError(new Error('Component loading timeout'));
            setLoading(false);
          }
        }, timeout);

        const module = await loader();
        
        if (isMounted) {
          clearTimeout(timeoutId);
          setComponent(() => module.default || module);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          clearTimeout(timeoutId);
          setError(err);
          setLoading(false);
        }
      }
    };

    // Use requestIdleCallback to avoid blocking main thread
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        if (isMounted) {
          loadComponent();
        }
      }, { timeout: 100 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        if (isMounted) {
          loadComponent();
        }
      }, 0);
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loader, delay, timeout]);

  // Preload component on hover/focus
  useEffect(() => {
    if (preload) {
      const preloadComponent = () => {
        loader().catch(() => {
          // Ignore preload errors
        });
      };

      // Preload after initial render
      const preloadTimer = setTimeout(preloadComponent, 100);
      return () => clearTimeout(preloadTimer);
    }
  }, [loader, preload]);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#ff6b6b',
        backgroundColor: '#fff5f5',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        margin: '10px'
      }}>
        <h3>Error Loading Component</h3>
        <p>{error.message}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (loading || !Component) {
    return fallback;
  }

  return (
    <Suspense fallback={fallback}>
      <Component {...(children?.props || {})} />
    </Suspense>
  );
};

/**
 * Higher Order Component for lazy loading
 */
export const withLazyLoading = (loader, options = {}) => {
  return (props) => (
    <LazyComponentLoader 
      loader={loader} 
      {...options}
    >
      <div {...props} />
    </LazyComponentLoader>
  );
};

/**
 * Hook for preloading components
 */
export const useComponentPreloader = (loaders) => {
  useEffect(() => {
    const preloadComponents = async () => {
      // Use requestIdleCallback to preload during idle time
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          for (const loader of loaders) {
            try {
              await loader();
            } catch (error) {
              console.warn('Failed to preload component:', error);
            }
          }
        }, { timeout: 5000 });
      }
    };

    // Delay preloading to not interfere with initial render
    const timer = setTimeout(preloadComponents, 2000);
    return () => clearTimeout(timer);
  }, [loaders]);
};

/**
 * Component for progressive image loading
 */
export const LazyImage = ({ 
  src, 
  placeholder, 
  alt = '', 
  className = '',
  style = {},
  ...props 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageError(true);
    img.src = src;
  }, [src]);

  if (imageError) {
    return (
      <div 
        className={className}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f3f4f6',
          color: '#6b7280'
        }}
        {...props}
      >
        Image failed to load
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      {!imageLoaded && placeholder && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {placeholder}
        </div>
      )}
      <img
        src={src}
        alt={alt}
        style={{
          ...style,
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        {...props}
      />
    </div>
  );
};

export default LazyComponentLoader; 