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
}) => (
  <Box sx={{ mb: 4 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {onMobileMenuClick && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMobileMenuClick}
            sx={{ display: { sm: 'none' }, mr: 2 }}
            aria-label="Buka menu samping"
          >
            <MenuIcon />
          </IconButton>
        )}
        <Box>
          <Typography variant="h3" fontWeight={800}>{title}</Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">{subtitle}</Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {showRefresh && onRefresh && (
          <IconButton onClick={onRefresh} aria-label="Segarkan data">
            <Refresh />
          </IconButton>
        )}
        {showNotifications && (
          <IconButton aria-label="Notifikasi">
            <Notifications />
          </IconButton>
        )}
      </Box>
    </Box>
  </Box>
);

export default AdminSectionHeader;
