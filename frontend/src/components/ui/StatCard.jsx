import React from 'react';
import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ 
    height: '100%', 
    borderRadius: 4, 
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)', 
    border: '1px solid rgba(0,0,0,0.03)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    }
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="subtitle2" color="textSecondary" fontWeight={600} sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight={800} color="textPrimary">
            {value}
          </Typography>
        </Box>
        <Avatar 
          variant="rounded" 
          sx={{ 
            bgcolor: `${color}15`, 
            color: color, 
            width: 48, 
            height: 48, 
            borderRadius: 3 
          }}
        >
          {icon}
        </Avatar>
      </Box>
      {subtitle && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: color, 
              bgcolor: `${color}10`, 
              px: 1, 
              py: 0.5, 
              borderRadius: 1.5,
              fontWeight: 600 
            }}
          >
            {subtitle}
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

export default StatCard;

