import React from 'react';
import { Box, Typography, IconButton, LinearProgress, Paper } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { alpha, styled } from '@mui/material/styles';

const StyledStatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 20,
  height: '100%',
  minHeight: 180,
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
        bgcolor: alpha(color === 'primary' ? '#2E7D32' : 
                 color === 'success' ? '#4CAF50' :
                 color === 'warning' ? '#FF9800' :
                 color === 'secondary' ? '#FFC107' : '#2E7D32', 0.05),
      }} />
      
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
          <Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight={800} sx={{ 
              color: color === 'primary' ? 'primary.main' : 
                     color === 'success' ? 'success.main' :
                     color === 'warning' ? 'warning.main' :
                     color === 'secondary' ? 'secondary.main' : 'text.primary',
              letterSpacing: '-0.02em'
            }}>
              {value}
            </Typography>
          </Box>
          <IconButton sx={{ 
            bgcolor: alpha(color === 'primary' ? '#2E7D32' : 
                     color === 'success' ? '#4CAF50' :
                     color === 'warning' ? '#FF9800' :
                     color === 'secondary' ? '#FFC107' : '#2E7D32', 0.1),
            color: color === 'primary' ? 'primary.main' : 
                   color === 'success' ? 'success.main' :
                   color === 'warning' ? 'warning.main' :
                   color === 'secondary' ? 'secondary.main' : 'primary.main',
            width: 56,
            height: 56,
            '&:hover': { 
              bgcolor: alpha(color === 'primary' ? '#2E7D32' : 
                       color === 'success' ? '#4CAF50' :
                       color === 'warning' ? '#FF9800' :
                       color === 'secondary' ? '#FFC107' : '#2E7D32', 0.2) 
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
                height: 8, 
                borderRadius: 4,
                bgcolor: alpha(color === 'success' ? '#4CAF50' : '#2E7D32', 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: color === 'success' ? 'success.main' : 'primary.main',
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