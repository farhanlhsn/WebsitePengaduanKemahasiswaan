import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { Menu as MenuIcon, Refresh } from '@mui/icons-material';
import AdminNotificationMenu from '../../components/admin/AdminNotificationMenu';

const AdminSectionHeader = ({
  title,
  subtitle,
  onMobileMenuClick,
  onRefresh,
  showRefresh = true,
  showNotifications = true,
  action,
}) => (
  <Box sx={{ mb: { xs: 2, md: 2.5 } }}>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', minWidth: 0 }}>
        {onMobileMenuClick && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMobileMenuClick}
            sx={{ display: { sm: 'none' }, mr: 1, mt: 0.25 }}
            aria-label="Buka menu samping"
          >
            <MenuIcon />
          </IconButton>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              fontSize: { xs: '1.45rem', sm: '1.7rem', md: '1.9rem' },
              lineHeight: 1.2,
              mb: 0.35,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        {action}
        {showRefresh && onRefresh && (
          <Tooltip title="Segarkan data">
            <IconButton onClick={onRefresh} aria-label="Segarkan data" size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        )}
        {showNotifications && <AdminNotificationMenu />}
      </Box>
    </Box>
  </Box>
);

export default AdminSectionHeader;
