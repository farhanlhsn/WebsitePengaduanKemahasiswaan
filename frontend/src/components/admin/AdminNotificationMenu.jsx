import React from 'react';
import {
  Badge,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Notifications,
  Person,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../stores/userStore';
import useReportStore from '../../stores/reportStore';

const AdminNotificationMenu = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const { users, getAllUsers } = useUserStore();
  const { reports, getAllReports } = useReportStore();

  const notifications = React.useMemo(() => {
    const unverified = users.filter((item) => !item.isVerified && !item.deletedAt).length;
    const pending = reports.filter((item) => item.status === 'PENDING' && !item.deletedAt).length;
    const active = reports.filter(
      (item) => ['IN_REVIEW', 'IN_PROGRESS'].includes(item.status) && !item.deletedAt,
    ).length;

    return [
      {
        id: 'unverified',
        title: 'Mahasiswa belum terverifikasi',
        description: `${unverified} akun perlu diperiksa`,
        count: unverified,
        icon: <Person fontSize="small" />,
        path: '/admin/unverified-users',
      },
      {
        id: 'pending',
        title: 'Laporan menunggu tinjauan',
        description: `${pending} laporan belum ditangani`,
        count: pending,
        icon: <Assignment fontSize="small" />,
        path: '/admin/reports',
      },
      {
        id: 'active',
        title: 'Laporan sedang ditangani',
        description: `${active} laporan sedang berjalan`,
        count: active,
        icon: <Assignment fontSize="small" />,
        path: '/admin/reports',
      },
    ].filter((item) => item.count > 0);
  }, [users, reports]);

  const total = notifications.reduce((sum, item) => sum + item.count, 0);

  const refreshNotifications = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        getAllUsers(true),
        getAllReports({ includeDeleted: true }, false),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [getAllUsers, getAllReports]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    refreshNotifications();
  };

  const handleNavigate = (path) => {
    setAnchorEl(null);
    navigate(path);
  };

  return (
    <>
      <Tooltip title="Buka notifikasi">
        <IconButton
          onClick={handleOpen}
          aria-label={`Notifikasi${total ? `, ${total} memerlukan perhatian` : ''}`}
          size="small"
        >
          <Badge badgeContent={total} color="error" max={99}>
            <Notifications />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: { xs: 310, sm: 360 },
              maxWidth: 'calc(100vw - 24px)',
              borderRadius: 2.5,
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography fontWeight={700}>Notifikasi</Typography>
            <Typography variant="caption" color="text.secondary">
              Ringkasan yang memerlukan perhatian
            </Typography>
          </Box>
          {refreshing && <CircularProgress size={18} />}
        </Box>
        <Divider />

        {!refreshing && notifications.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <CheckCircle color="success" sx={{ mb: 0.75 }} />
            <Typography variant="body2" fontWeight={600}>Tidak ada notifikasi baru</Typography>
            <Typography variant="caption" color="text.secondary">Semua data sudah tertangani.</Typography>
          </Box>
        ) : (
          notifications.map((item) => (
            <MenuItem
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              sx={{ alignItems: 'flex-start', py: 1.5, whiteSpace: 'normal' }}
            >
              <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}>{item.icon}</ListItemIcon>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" fontWeight={650}>{item.title}</Typography>
                <Typography variant="caption" color="text.secondary">{item.description}</Typography>
              </Box>
              <Typography
                variant="caption"
                fontWeight={800}
                color="primary.main"
                sx={{ ml: 1, mt: 0.5, minWidth: 22, textAlign: 'right' }}
              >
                {item.count}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default AdminNotificationMenu;
