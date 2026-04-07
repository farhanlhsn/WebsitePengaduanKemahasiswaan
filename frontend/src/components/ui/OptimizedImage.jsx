import React, { useState, useEffect } from 'react';

/**
 * OptimizedImage component that automatically serves the best image format
 * based on browser support (AVIF > WebP > Original)
 */
const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  style,
  sizes,
  loading = "lazy",
  onLoad,
  onError,
  debug = false,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Get base filename without extension
  const getBaseFilename = (path) => {
    const filename = path.split('/').pop();
    return filename.substring(0, filename.lastIndexOf('.')) || filename;
  };

  // Get file extension
  const getExtension = (path) => {
    return path.split('.').pop().toLowerCase();
  };

  // Generate optimized image sources
  const generateSources = (originalSrc) => {
    const filename = getBaseFilename(originalSrc);
    
    // For manually optimized images, they'll be in /optimized/ folder
    return {
      avif: `/optimized/${filename}.avif`,
      webp: `/optimized/${filename}.webp`,
      original: originalSrc
    };
  };

  // Check if browser supports format
  const checkFormatSupport = (format) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      
      // Test images for format support
      const testImages = {
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=',
        webp: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
      };
      
      if (testImages[format]) {
        img.src = testImages[format];
      } else {
        resolve(false);
      }
    });
  };

  // Determine best image source
  const determineBestSource = async () => {
    const sources = generateSources(src);
    
    // Check AVIF support first (best compression)
    const supportsAvif = await checkFormatSupport('avif');
    
    if (supportsAvif) {
      return sources.avif;
    }
    
    // Check WebP support (good compression)
    const supportsWebp = await checkFormatSupport('webp');
    
    if (supportsWebp) {
      return sources.webp;
    }
    
    // Fallback to original
    return sources.original;
  };

  // Load optimal image source
  useEffect(() => {
    let isMounted = true;
    
    determineBestSource().then((optimalSrc) => {
      if (isMounted) {
        // Test if the optimized image exists
        const testImg = new Image();
        testImg.onload = () => {
          if (isMounted) {
            setImageSrc(optimalSrc);
          }
        };
        testImg.onerror = () => {
          if (isMounted) {
            // If optimized image doesn't exist, use original
            setImageSrc(src);
          }
        };
        testImg.src = optimalSrc;
      }
    });
    
    return () => {
      isMounted = false;
    };
  }, [src, debug]);

  const handleLoad = (event) => {
    setIsLoaded(true);
    setHasError(false);
    if (onLoad) onLoad(event);
  };

  const handleError = (event) => {
    setHasError(true);
    
    // Fallback to original source if optimized version fails
    if (imageSrc !== src) {
      setImageSrc(src);
    }
    if (onError) onError(event);
  };

  // Don't render img tag until we have determined the optimal source
  if (!imageSrc) {
    return null;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: isLoaded ? 1 : 0.8,
        transition: 'opacity 0.3s ease-in-out'
      }}
      sizes={sizes}
      loading={loading}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
};

export default OptimizedImage; 