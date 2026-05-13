import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Collapse,
  Alert
} from '@mui/material';
import {
  Notifications,
  Warning,
  Info,
  CheckCircle,
  Error,
  ExpandMore,
  ExpandLess,
  Person,
  Assignment,
  Chat
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

const AdminNotifications = ({ users = [], reports = [], loading = false }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(true);

  const notifications = [
    {
      id: 'unverified-users',
      type: 'warning',
      title: 'Mahasiswa Belum Terverifikasi',
      count: users.filter(u => !u.isVerified && u.status === 'ACTIVE').length,
      icon: <Person />,
      color: 'warning',
    },
    {
      id: 'pending-reports',
      type: 'info',
      title: 'Laporan Menunggu Review',
      count: reports.filter(r => r.status === 'PENDING').length,
      icon: <Assignment />,
      color: 'info',
    },
    {
      id: 'in-progress-reports',
      type: 'info',
      title: 'Laporan Dalam Proses',
      count: reports.filter(r => ['IN_REVIEW', 'IN_PROGRESS'].includes(r.status)).length,
      icon: <Assignment />,
      color: 'primary',
    },
    {
      id: 'unverified-users-all',
      type: 'success',
      title: 'Pengguna Belum Terverifikasi',
      count: users.filter(u => {
        return !u.isVerified;
      }).length,
      icon: <Person />,
      color: 'success',
    }
  ].filter(notification => notification.count > 0);

  const getNotificationColor = (color) => {
    switch (color) {
      case 'warning': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      case 'success': return theme.palette.success.main;
      case 'info': return theme.palette.info.main;
      case 'primary': return theme.palette.primary.main;
      default: return theme.palette.grey[500];
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Notifications />
          <Typography variant="h6" fontWeight={600}>
            Notifikasi
          </Typography>
        </Box>
        <Box sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Memuat notifikasi...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (notifications.length === 0) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CheckCircle color="success" />
          <Typography variant="h6" fontWeight={600}>
            Notifikasi
          </Typography>
        </Box>
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          Tidak ada notifikasi penting saat ini. Semua sistem berjalan dengan baik!
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ 
      borderRadius: 3,
      overflow: 'hidden',
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
    }}>
      <Box sx={{ 
        p: 3, 
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.main, 0.05)}, 
          ${alpha(theme.palette.secondary.main, 0.03)})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Notifications color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Notifikasi Penting
          </Typography>
          <Chip 
            label={notifications.length}
            color="primary"
            size="small"
            sx={{ ml: 1 }}
          />
        </Box>
        <IconButton 
          onClick={() => setExpanded(!expanded)}
          size="small"
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <List sx={{ p: 0 }}>
          {notifications.map((notification, index) => (
            <ListItem 
              key={notification.id}
              sx={{ 
                px: 3, 
                py: 2,
                borderBottom: index < notifications.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.02)
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, marginRight: 2 }}>
                <Box sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  bgcolor: alpha(getNotificationColor(notification.color), 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {React.cloneElement(notification.icon, { 
                    sx: { color: getNotificationColor(notification.color) }
                  })}
                </Box>
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'space-between' }}>
                    <Typography variant="body1" fontWeight={500}>
                      {notification.title}
                    </Typography>
                    <Chip 
                      label={notification.count}
                      color={notification.color}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {notification.count === 1 ? '1 item' : `${notification.count} items`} memerlukan perhatian
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </Collapse>
    </Paper>
  );
};

export default AdminNotifications;