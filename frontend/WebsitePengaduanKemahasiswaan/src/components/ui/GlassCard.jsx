import React from 'react';
import { Paper, Box } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

const StyledGlassCard = styled(Paper)(({ theme, variant = 'default' }) => ({
  borderRadius: 20,
  padding: theme.spacing(3),
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Glass morphism effect
  background: variant === 'glass' 
    ? `linear-gradient(145deg, 
        ${alpha(theme.palette.background.paper, 0.9)}, 
        ${alpha(theme.palette.background.paper, 0.7)})`
    : theme.palette.background.paper,
  
  backdropFilter: variant === 'glass' ? 'blur(20px)' : 'none',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: variant === 'elevated' 
    ? '0 20px 40px rgba(0,0,0,0.1)'
    : '0 8px 32px rgba(0,0,0,0.08)',
  
  // Hover effects
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: variant === 'elevated'
      ? '0 25px 50px rgba(0,0,0,0.15)'
      : '0 12px 40px rgba(0,0,0,0.12)',
  },
  
  // Gradient border animation
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 'inherit',
    padding: '1px',
    background: `linear-gradient(45deg, 
      ${theme.palette.primary.main}, 
      ${theme.palette.secondary.main}, 
      ${theme.palette.primary.light})`,
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'exclude',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  
  '&:hover::before': {
    opacity: variant === 'gradient' ? 1 : 0,
  },
}));

const GlassCard = ({ 
  children, 
  variant = 'default', 
  hover = true,
  ...props 
}) => {
  return (
    <StyledGlassCard 
      variant={variant}
      elevation={0}
      sx={{
        '&:hover': hover ? {} : {
          transform: 'none',
          boxShadow: 'inherit',
        }
      }}
      {...props}
    >
      {children}
    </StyledGlassCard>
  );
};

export default GlassCard;