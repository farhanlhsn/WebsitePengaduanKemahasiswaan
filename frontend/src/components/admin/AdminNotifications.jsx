import React from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { Assignment, CheckCircle, Notifications, Person } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const AdminNotifications = ({ users = [], reports = [], loading = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const notifications = [
    {
      id: 'unverified-users',
      title: 'Mahasiswa Belum Terverifikasi',
      description: 'Akun mahasiswa perlu diperiksa',
      count: users.filter((user) => !user.isVerified && !user.deletedAt).length,
      icon: <Person />,
      color: theme.palette.warning.main,
      path: '/admin/users',
    },
    {
      id: 'pending-reports',
      title: 'Laporan Menunggu Tinjauan',
      description: 'Laporan baru belum ditangani',
      count: reports.filter((report) => report.status === 'PENDING' && !report.deletedAt).length,
      icon: <Assignment />,
      color: theme.palette.info.main,
      path: '/admin/reports',
    },
    {
      id: 'active-reports',
      title: 'Laporan Sedang Ditangani',
      description: 'Laporan dalam tahap tinjauan atau proses',
      count: reports.filter(
        (report) => ['IN_REVIEW', 'IN_PROGRESS'].includes(report.status) && !report.deletedAt,
      ).length,
      icon: <Assignment />,
      color: theme.palette.primary.main,
      path: '/admin/reports',
    },
  ].filter((item) => item.count > 0);

  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}
    >
      <Box sx={{ px: 2, py: 1.75, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Notifications color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={800} sx={{ flex: 1 }}>
          Perlu Perhatian
        </Typography>
        {!!notifications.length && <Chip label={notifications.length} color="primary" size="small" />}
      </Box>
      <Divider />

      {loading ? (
        <Box sx={{ minHeight: 180, display: 'grid', placeItems: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Alert icon={<CheckCircle />} severity="success" sx={{ borderRadius: 2 }}>
            Tidak ada data yang memerlukan perhatian.
          </Alert>
        </Box>
      ) : (
        <List disablePadding>
          {notifications.map((item, index) => (
            <React.Fragment key={item.id}>
              <ListItemButton onClick={() => navigate(item.path)} sx={{ px: 2, py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 42 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      display: 'grid',
                      placeItems: 'center',
                      color: item.color,
                      bgcolor: alpha(item.color, 0.1),
                    }}
                  >
                    {React.cloneElement(item.icon, { fontSize: 'small' })}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  secondary={item.description}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                <Chip label={item.count} size="small" variant="outlined" />
              </ListItemButton>
              {index < notifications.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default AdminNotifications;
