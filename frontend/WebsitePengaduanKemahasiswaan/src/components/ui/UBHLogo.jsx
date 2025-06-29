import React from 'react';
import OptimizedImage from './OptimizedImage';

/**
 * UBH Logo component with optimized loading and multiple size variants
 */
const UBHLogo = ({ 
  size = 'medium', 
  className = '', 
  style = {},
  alt = 'Logo Universitas Bung Hatta',
  loading = 'lazy',
  ...props 
}) => {
  // Define size presets for different use cases
  const sizePresets = {
    small: {
      width: 32,
      height: 32,
      className: 'w-8 h-8'
    },
    medium: {
      width: 48,
      height: 48,
      className: 'w-12 h-12'
    },
    large: {
      width: 64,
      height: 64,
      className: 'w-16 h-16'
    },
    xlarge: {
      width: 96,
      height: 96,
      className: 'w-24 h-24'
    },
    hero: {
      width: 128,
      height: 128,
      className: 'w-32 h-32'
    }
  };

  const currentSize = sizePresets[size] || sizePresets.medium;

  // Generate sizes attribute for responsive loading
  const generateSizes = () => {
    switch (size) {
      case 'small':
        return '32px';
      case 'medium':
        return '48px';
      case 'large':
        return '64px';
      case 'xlarge':
        return '96px';
      case 'hero':
        return '128px';
      default:
        return '48px';
    }
  };

  const combinedStyle = {
    maxWidth: '100%',
    height: 'auto',
    objectFit: 'contain',
    ...style
  };

  const combinedClassName = `ubh-logo ${currentSize.className} ${className}`.trim();

  return (
    <OptimizedImage
      src="/logo-ubh.png"
      alt={alt}
      className={combinedClassName}
      style={combinedStyle}
      width={currentSize.width}
      height={currentSize.height}
      sizes={generateSizes()}
      loading={loading}
      {...props}
    />
  );
};

export default UBHLogo; 