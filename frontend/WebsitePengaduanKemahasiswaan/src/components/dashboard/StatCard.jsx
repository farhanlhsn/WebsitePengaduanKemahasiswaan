import React from 'react';
import { Box, Typography, IconButton, LinearProgress, Paper } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { alpha, styled } from '@mui/material/styles';

const StyledStatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4),
  },
  borderRadius: 20,
  height: '100%',
  minHeight: 160,
  [theme.breakpoints.up('sm')]: {
    minHeight: 180,
  },
  [theme.breakpoints.up('md')]: {
    minHeight: 200,
  },
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  transition: 'all 0.3s ease',
  border: '1px solid rgba(0,0,0,0.06)',
  background: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
  }
}));

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'primary', 
  trend, 
  trendValue, 
  showProgress = false, 
  progressValue = 0,
  subtitle 
}) => {
  const isPositiveTrend = trend === 'up';
  
  // Handle both hex colors and theme colors
  const getColor = (colorProp) => {
    if (typeof colorProp === 'string' && colorProp.startsWith('#')) {
      return colorProp;
    }
    // Fallback for theme colors
    switch(colorProp) {
      case 'primary': return '#2E7D32';
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'secondary': return '#FFC107';
      default: return '#2E7D32';
    }
  };
  
  const cardColor = getColor(color);
  
  return (
    <StyledStatCard>
      {/* Background decoration */}
      <Box sx={{
        position: 'absolute',
        top: -40,
        right: -40,
        width: 120,
        height: 120,
        borderRadius: '50%',
        bgcolor: alpha(cardColor, 0.05),
      }} />
      
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: { xs: 2, sm: 3 } }}>
          <Box>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: { xs: 1, sm: 1.5 }, 
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '0.875rem', md: '1rem' }
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              fontWeight={800} 
              sx={{ 
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                color: cardColor,
                letterSpacing: '-0.02em'
              }}
            >
              {value}
            </Typography>
          </Box>
          <IconButton sx={{ 
            bgcolor: alpha(cardColor, 0.1),
            color: cardColor,
            width: { xs: 40, sm: 48, md: 56 },
            height: { xs: 40, sm: 48, md: 56 },
            '&:hover': { 
              bgcolor: alpha(cardColor, 0.2) 
            }
          }}>
            {icon}
          </IconButton>
        </Box>

        {showProgress && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progressValue}
              sx={{ 
                height: { xs: 6, sm: 8 }, 
                borderRadius: 4,
                bgcolor: alpha(cardColor, 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: cardColor,
                  borderRadius: 4
                }
              }}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {trendValue && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {isPositiveTrend ? (
                <TrendingUp fontSize="small" sx={{ color: 'success.main' }} />
              ) : (
                <TrendingDown fontSize="small" sx={{ color: 'error.main' }} />
              )}
              <Typography 
                variant="body2" 
                sx={{ 
                  color: isPositiveTrend ? 'success.main' : 'error.main',
                  fontWeight: 600 
                }}
              >
                {trendValue}
              </Typography>
            </Box>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </StyledStatCard>
  );
};

export default StatCard; 