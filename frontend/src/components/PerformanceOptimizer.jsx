import { useEffect } from 'react';

/**
 * Performance Optimizer Component
 * Handles bfcache optimization and performance improvements
 */
const PerformanceOptimizer = () => {
  useEffect(() => {
    // Optimize for Back/Forward Cache (bfcache)
    const optimizeBfcache = () => {
      // Remove event listeners that prevent bfcache
      const cleanup = [];
      
      // Handle page visibility changes for bfcache
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          // Page is being hidden, prepare for bfcache
          // Cancel any ongoing network requests
          if (window.AbortController) {
            // Store abort controllers if needed
          }
          
          // Clean up any intervals/timeouts
          cleanup.forEach(fn => fn());
        }
      };
      
      // Handle beforeunload for bfcache compatibility
      const handleBeforeUnload = () => {
        // Don't prevent default unless absolutely necessary
        // Avoiding event.preventDefault() to allow bfcache
        
        // Clean up resources
        cleanup.forEach(fn => fn());
      };
      
      // Handle pagehide event for bfcache
      const handlePageHide = (event) => {
        if (event.persisted) {
          // Page is being stored in bfcache
          console.log('Page stored in bfcache');
        }
        
        // Clean up resources
        cleanup.forEach(fn => fn());
      };
      
      // Handle pageshow event for bfcache
      const handlePageShow = (event) => {
        if (event.persisted) {
          // Page restored from bfcache
          console.log('Page restored from bfcache');
          
          // Reinitialize necessary components
          // Update timestamps, refresh stale data, etc.
          window.dispatchEvent(new CustomEvent('bfcache-restore'));
        }
      };
      
      // Add event listeners
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload, { passive: true });
      window.addEventListener('pagehide', handlePageHide);
      window.addEventListener('pageshow', handlePageShow);
      
      // Cleanup function
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handlePageHide);
        window.removeEventListener('pageshow', handlePageShow);
      };
    };
    
    // Performance optimizations
    const optimizePerformance = () => {
      // Preload critical resources
      const preloadCriticalResources = () => {
        // Preload fonts
        const fontPreloads = [
          // Add any critical fonts here
        ];
        
        fontPreloads.forEach(font => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = font;
          link.as = 'font';
          link.type = 'font/woff2';
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        });
      };
      
      // Optimize images with intersection observer
      const optimizeImages = () => {
        if ('IntersectionObserver' in window) {
          const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                  img.src = img.dataset.src;
                  img.removeAttribute('data-src');
                  imageObserver.unobserve(img);
                }
              }
            });
          }, {
            rootMargin: '50px 0px'
          });
          
          // Observe all images with data-src
          document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
          });
        }
      };
      
      // Resource hints for better performance
      const addResourceHints = () => {
        // DNS prefetch for external domains
        const domains = [
          'fonts.googleapis.com',
          'fonts.gstatic.com'
        ];
        
        domains.forEach(domain => {
          const link = document.createElement('link');
          link.rel = 'dns-prefetch';
          link.href = `//${domain}`;
          document.head.appendChild(link);
        });
      };
      
      // Execute optimizations
      preloadCriticalResources();
      optimizeImages();
      addResourceHints();
    };
    
    // Service Worker for caching (if available)
    const registerServiceWorker = () => {
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => {
              console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
              console.log('SW registration failed: ', registrationError);
            });
        });
      }
    };
    
    // Initialize optimizations
    const cleanupBfcache = optimizeBfcache();
    optimizePerformance();
    registerServiceWorker();
    
    // Cleanup on unmount
    return () => {
      cleanupBfcache();
    };
  }, []);
  
  // Performance monitoring
  useEffect(() => {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('LCP:', entry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('FID:', entry.processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      
      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        console.log('CLS:', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }, []);
  
  return null; // This component doesn't render anything
};

export default PerformanceOptimizer; 