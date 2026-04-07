import React from 'react';
import { Button, CircularProgress, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(Button)(({ theme, variant, color = 'primary' }) => ({
  borderRadius: 12,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  padding: '12px 24px',
  boxShadow: 'none',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Enhanced hover effects
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: variant === 'contained' 
      ? `0 8px 25px ${alpha(theme.palette[color].main, 0.4)}`
      : `0 4px 15px ${alpha(theme.palette[color].main, 0.2)}`,
  },
  
  // Active state
  '&:active': {
    transform: 'translateY(0px)',
  },
  
  // Ripple effect enhancement
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(45deg, transparent, ${alpha(theme.palette.common.white, 0.1)}, transparent)`,
    transform: 'translateX(-100%)',
    transition: 'transform 0.6s',
  },
  
  '&:hover::before': {
    transform: 'translateX(100%)',
  },
  
  // Size variants
  '&.MuiButton-sizeLarge': {
    padding: '16px 32px',
    fontSize: '1.1rem',
  },
  
  '&.MuiButton-sizeSmall': {
    padding: '8px 16px',
    fontSize: '0.875rem',
  },
}));

const EnhancedButton = ({ 
  children, 
  loading = false, 
  loadingText = 'Loading...', 
  icon,
  ...props 
}) => {
  return (
    <StyledButton
      {...props}
      disabled={loading || props.disabled}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : icon}
    >
      {loading ? loadingText : children}
    </StyledButton>
  );
};

export default EnhancedButton;