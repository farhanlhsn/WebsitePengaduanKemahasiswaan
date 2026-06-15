import React from 'react';
import { Box, LinearProgress, Paper, Typography } from '@mui/material';
import { TrendingDown, TrendingUp } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import AnimatedCounter from '../ui/AnimatedCounter';

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
  animateValue = true,
}) => {
  const isPositiveTrend = trend === 'up';

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        height: '100%',
        minHeight: 126,
        borderRadius: 3,
        borderColor: alpha(color, 0.2),
        boxShadow: 'none',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={650} sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          {animateValue ? (
            <AnimatedCounter
              end={typeof value === 'number' ? value : Number.parseInt(value, 10) || 0}
              prefix={prefix}
              suffix={suffix}
              variant="h4"
              fontWeight={800}
              sx={{ color, fontSize: { xs: '1.75rem', sm: '2rem' }, lineHeight: 1.2 }}
            />
          ) : (
            <Typography variant="h4" fontWeight={800} sx={{ color, fontSize: { xs: '1.75rem', sm: '2rem' } }}>
              {prefix}{value}{suffix}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            width: 42,
            height: 42,
            flexShrink: 0,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(color, 0.1),
            color,
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 23 } })}
        </Box>
      </Box>

      {showProgress && (
        <Box sx={{ mt: 1.25 }}>
          <LinearProgress
            variant="determinate"
            value={Math.max(0, Math.min(100, progressValue))}
            sx={{ height: 5, borderRadius: 3, bgcolor: alpha(color, 0.1), '& .MuiLinearProgress-bar': { bgcolor: color } }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {Math.round(progressValue)}% terselesaikan
          </Typography>
        </Box>
      )}

      {(trendValue || subtitle) && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          {trendValue && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              {isPositiveTrend ? <TrendingUp fontSize="small" color="success" /> : <TrendingDown fontSize="small" color="error" />}
              <Typography variant="caption" fontWeight={700}>{trendValue}</Typography>
            </Box>
          )}
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      )}
    </Paper>
  );
});

export default EnhancedStatCard;
