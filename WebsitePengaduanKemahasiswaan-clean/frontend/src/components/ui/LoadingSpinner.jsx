import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const StyledLoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  minHeight: '200px',
  
  '& .loading-icon': {
    animation: `${float} 3s ease-in-out infinite`,
    marginBottom: theme.spacing(2),
  },
  
  '& .loading-text': {
    animation: `${pulse} 2s ease-in-out infinite`,
    color: theme.palette.text.secondary,
  },
}));

const CustomSpinner = styled(CircularProgress)(() => ({
  '& .MuiCircularProgress-circle': {
    strokeLinecap: 'round',
    stroke: `url(#gradient-${Math.random().toString(36).substr(2, 9)})`,
  },
}));

const LoadingSpinner = React.memo(({ 
  message = 'Memuat...', 
  size = 40, 
  fullScreen = false 
}) => {
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  if (fullScreen) {
    return (
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <StyledLoadingContainer>
          <svg width="0" height="0">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2E7D32" />
                <stop offset="100%" stopColor="#4CAF50" />
              </linearGradient>
            </defs>
          </svg>
          <Box className="loading-icon">
            <CustomSpinner size={size} thickness={4} />
          </Box>
          <Typography variant="body1" className="loading-text">
            {message}
          </Typography>
        </StyledLoadingContainer>
      </Box>
    );
  }
  
  return (
    <StyledLoadingContainer>
      <svg width="0" height="0">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2E7D32" />
            <stop offset="100%" stopColor="#4CAF50" />
          </linearGradient>
        </defs>
      </svg>
      <Box className="loading-icon">
        <CustomSpinner size={size} thickness={4} />
      </Box>
      {message && (
        <Typography variant="body2" className="loading-text">
          {message}
        </Typography>
      )}
    </StyledLoadingContainer>
  );
});

export default LoadingSpinner;