import React from 'react';
import {
  Badge,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { Assignment, CheckCircle, Notifications } from '@mui/icons-material';
import useAuthStore from '../../stores/authStore';

const STATUS_TEXT = {
  PENDING: 'menunggu tinjauan',
  IN_REVIEW: 'sedang ditinjau',
  IN_PROGRESS: 'sedang diproses',
  RESOLVED: 'telah selesai',
  REJECTED: 'ditolak',
  CANCELED: 'dibatalkan',
};

const StudentNotificationMenu = ({ reports = [], onOpenReport }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { user } = useAuthStore();
  const storageKey = `student-notifications-seen:${user?.id || 'anonymous'}`;
  const [lastSeenAt, setLastSeenAt] = React.useState(() => Number(localStorage.getItem(storageKey) || 0));

  const items = React.useMemo(
    () => [...reports]
      .filter((report) => report.status && report.status !== 'PENDING')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5),
    [reports],
  );

  const unreadCount = React.useMemo(
    () => items.filter((report) => new Date(report.updatedAt || report.createdAt).getTime() > lastSeenAt).length,
    [items, lastSeenAt],
  );

  React.useEffect(() => {
    setLastSeenAt(Number(localStorage.getItem(storageKey) || 0));
  }, [storageKey]);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
    const now = Date.now();
    localStorage.setItem(storageKey, String(now));
    setLastSeenAt(now);
  };

  const handleOpenReport = (report) => {
    setAnchorEl(null);
    onOpenReport?.(report);
  };

  return (
    <>
      <Tooltip title="Buka notifikasi laporan">
        <IconButton
          size="small"
          onClick={handleOpenMenu}
          aria-label={`Notifikasi laporan${unreadCount ? `, ${unreadCount} belum dibaca` : ''}`}
        >
          <Badge badgeContent={unreadCount} color="error" max={9}>
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
        slotProps={{ paper: { sx: { mt: 1, width: { xs: 310, sm: 360 }, maxWidth: 'calc(100vw - 24px)', borderRadius: 2.5 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography fontWeight={700}>Notifikasi Laporan</Typography>
          <Typography variant="caption" color="text.secondary">Pembaruan terbaru dari laporan Anda</Typography>
        </Box>
        <Divider />
        {items.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <CheckCircle color="success" sx={{ mb: 0.75 }} />
            <Typography variant="body2" fontWeight={600}>Belum ada pembaruan</Typography>
          </Box>
        ) : items.map((report) => (
          <MenuItem
            key={report.id}
            onClick={() => handleOpenReport(report)}
            sx={{ alignItems: 'flex-start', py: 1.5, whiteSpace: 'normal' }}
          >
            <Assignment fontSize="small" sx={{ mr: 1.5, mt: 0.25, color: 'primary.main' }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={650} noWrap>{report.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                Status {STATUS_TEXT[report.status] || 'diperbarui'}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default StudentNotificationMenu;
