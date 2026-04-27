import React from 'react';
import { Box, Typography, IconButton, LinearProgress, Paper } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { alpha, styled } from '@mui/material/styles';
import AnimatedCounter from '../ui/AnimatedCounter';
import GlassCard from '../ui/GlassCard';

const StyledStatCard = styled(GlassCard)(({ theme, cardcolor }) => ({
  padding: theme.spacing(3),
  height: '100%',
  minHeight: 180,
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(135deg, 
    ${alpha(cardcolor, 0.05)} 0%, 
    ${alpha(cardcolor, 0.02)} 100%)`,
  border: `1px solid ${alpha(cardcolor, 0.1)}`,
  
  // Animated background pattern
  '&::after': {
    content: '""',
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${alpha(cardcolor, 0.1)} 0%, transparent 70%)`,
    animation: 'float 6s ease-in-out infinite',
  },
  
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
    '50%': { transform: 'translateY(-20px) rotate(180deg)' },
  },
}));

const IconContainer = styled(Box)(({ theme, cardcolor }) => ({
  width: 64,
  height: 64,
  borderRadius: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${cardcolor}, ${alpha(cardcolor, 0.8)})`,
  boxShadow: `0 8px 24px ${alpha(cardcolor, 0.3)}`,
  color: 'white',
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  
  '&:hover': {
    transform: 'scale(1.1) rotate(5deg)',
    boxShadow: `0 12px 32px ${alpha(cardcolor, 0.4)}`,
  },
}));

const EnhancedStatCard = React.memo(({ 
  title, 
  value, 
  icon, 
  color = '#2E7D32', 
  trend, 
  trendValue, 
  showProgress = false, 
  progressValue = 0,
  subtitle,
  prefix = '',
  suffix = '',
  animateValue = true
}) => {
  const isPositiveTrend = trend === 'up';
  
  return (
    <StyledStatCard variant="glass" cardcolor={color}>
      <Box sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1, pr: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 1, 
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {title}
            </Typography>
            
            {animateValue ? (
              <AnimatedCounter
                end={typeof value === 'number' ? value : parseInt(value) || 0}
                prefix={prefix}
                suffix={suffix}
                variant="h3"
                fontWeight={800}
                sx={{ 
                  color: color,
                  letterSpacing: '-0.02em',
                  fontSize: { xs: '2rem', sm: '2.5rem' }
                }}
              />
            ) : (
              <Typography 
                variant="h3" 
                fontWeight={800} 
                sx={{ 
                  color: color,
                  letterSpacing: '-0.02em',
                  fontSize: { xs: '2rem', sm: '2.5rem' }
                }}
              >
                {prefix}{value}{suffix}
              </Typography>
            )}
          </Box>
          
          <IconContainer cardcolor={color}>
            {React.cloneElement(icon, { sx: { fontSize: 28 } })}
          </IconContainer>
        </Box>

        <Box sx={{ mt: 'auto' }}>
          {showProgress && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={progressValue}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: alpha(color, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: color,
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.8)})`,
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {Math.round(progressValue)}% completion
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {trendValue && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isPositiveTrend ? (
                  <TrendingUp fontSize="small" sx={{ color: '#4CAF50' }} />
                ) : (
                  <TrendingDown fontSize="small" sx={{ color: '#F44336' }} />
                )}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: isPositiveTrend ? '#4CAF50' : '#F44336',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}
                >
                  {trendValue}
                </Typography>
              </Box>
            )}
            
            {subtitle && (
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </StyledStatCard>
  );
});

export default EnhancedStatCard;