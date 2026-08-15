import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Menu as MenuIcon, Refresh, Notifications } from '@mui/icons-material';

/**
 * Reusable header for every admin section page. Replaces the inline
 * `commonHeader()` helper that lived inside the old monolithic dashboard.
 */
const AdminSectionHeader = ({
  title,
  subtitle,
  onMobileMenuClick,
  onRefresh,
  showRefresh = true,
  showNotifications = true,
  action,
}) => (
  <Box sx={{ mb: { xs: 2, md: 4 } }}>
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start', 
      mb: 1, 
      gap: 1 
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        {onMobileMenuClick && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMobileMenuClick}
            sx={{ display: { sm: 'none' }, mr: 1, mt: 0.5 }}
            aria-label="Buka menu samping"
          >
            <MenuIcon />
          </IconButton>
        )}
        <Box>
          <Typography 
            variant="h4" 
            fontWeight={800}
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
              lineHeight: 1.2,
              mb: 0.5
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' } }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {action}
        {showRefresh && onRefresh && (
          <IconButton onClick={onRefresh} aria-label="Segarkan data" size="small">
            <Refresh />
          </IconButton>
        )}
        {showNotifications && (
          <IconButton aria-label="Notifikasi" size="small">
            <Notifications />
          </IconButton>
        )}
      </Box>
    </Box>
  </Box>
);

export default AdminSectionHeader;
