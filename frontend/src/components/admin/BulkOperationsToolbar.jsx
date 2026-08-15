import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Typography,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  MoreVert,
  CheckCircle,
  Delete,
  Restore,
  Edit,
  Close,
} from '@mui/icons-material';
import ConfirmDialog from '../ui/ConfirmDialog';

const TYPE_LABELS = {
  users: 'pengguna',
  reports: 'laporan',
  categories: 'kategori',
};

const BulkOperationsToolbar = ({
  selectedCount,
  type,
  onBulkVerify,
  onBulkDelete,
  onBulkRestore,
  onBulkUpdateStatus,
  onClearSelection,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  // Fix M10: konfirmasi bulk via ConfirmDialog (bukan window.confirm English).
  const [pendingAction, setPendingAction] = useState(null);
  const typeLabel = TYPE_LABELS[type] || 'data';

  const handleMenuClose = () => setAnchorEl(null);

  const handleBulkAction = (action) => {
    handleMenuClose();

    switch (action) {
      case 'verify':
      case 'delete':
      case 'restore':
        setPendingAction(action);
        break;
      case 'updateStatus':
        setStatusDialogOpen(true);
        break;
      default:
        break;
    }
  };

  const confirmMeta = {
    verify: {
      title: `Verifikasi ${selectedCount} Pengguna`,
      message: `Verifikasi ${selectedCount} pengguna terpilih sebagai mahasiswa?`,
      confirmLabel: 'Verifikasi',
      severity: 'info',
      run: onBulkVerify,
    },
    delete: {
      title: `Hapus ${selectedCount} ${typeLabel}`,
      message: `Hapus ${selectedCount} ${typeLabel} terpilih? Aksi ini dapat di-restore nanti.`,
      confirmLabel: 'Hapus',
      severity: 'error',
      run: onBulkDelete,
    },
    restore: {
      title: `Pulihkan ${selectedCount} ${typeLabel}`,
      message: `Pulihkan ${selectedCount} ${typeLabel} terpilih?`,
      confirmLabel: 'Pulihkan',
      severity: 'warning',
      run: onBulkRestore,
    },
  };

  const handleConfirm = async () => {
    const meta = confirmMeta[pendingAction];
    if (!meta?.run) return;
    await meta.run();
    setPendingAction(null);
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    setStatusDialogOpen(false);
    await onBulkUpdateStatus?.(selectedStatus);
    setSelectedStatus('');
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <Box
        sx={{
          position: 'sticky',
          top: 8,
          zIndex: 10,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          px: 1.5,
          py: 1,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          boxShadow: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Chip
            label={selectedCount}
            size="small"
            sx={{ bgcolor: 'common.white', color: 'primary.main', fontWeight: 800 }}
          />
          <Typography variant="body2" fontWeight={650} noWrap>
            {typeLabel} terpilih
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Batalkan pilihan">
            <IconButton size="small" onClick={onClearSelection} sx={{ color: 'inherit' }}>
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Aksi massal">
            <IconButton
              size="small"
              onClick={(event) => setAnchorEl(event.currentTarget)}
              sx={{ color: 'inherit' }}
              aria-label="Buka aksi massal"
            >
              <MoreVert />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {type === 'users' && onBulkVerify && (
          <MenuItem onClick={() => handleBulkAction('verify')}>
            <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
            <ListItemText>Verifikasi</ListItemText>
          </MenuItem>
        )}
        {type === 'reports' && onBulkUpdateStatus && (
          <MenuItem onClick={() => handleBulkAction('updateStatus')}>
            <ListItemIcon><Edit fontSize="small" color="info" /></ListItemIcon>
            <ListItemText>Ubah status</ListItemText>
          </MenuItem>
        )}
        {onBulkRestore && (
          <MenuItem onClick={() => handleBulkAction('restore')}>
            <ListItemIcon><Restore fontSize="small" color="warning" /></ListItemIcon>
            <ListItemText>Pulihkan</ListItemText>
          </MenuItem>
        )}
        {onBulkDelete && (
          <MenuItem onClick={() => handleBulkAction('delete')}>
            <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Hapus</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Ubah Status Laporan</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              label="Status"
            >
              <MenuItem value="PENDING">Menunggu</MenuItem>
              <MenuItem value="IN_REVIEW">Ditinjau</MenuItem>
              <MenuItem value="IN_PROGRESS">Diproses</MenuItem>
              <MenuItem value="RESOLVED">Selesai</MenuItem>
              <MenuItem value="REJECTED">Ditolak</MenuItem>
              <MenuItem value="CANCELED">Dibatalkan</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Batal</Button>
          <Button onClick={handleStatusUpdate} variant="contained" disabled={!selectedStatus}>
            Simpan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fix M10: konfirmasi bulk */}
      <ConfirmDialog
        open={!!pendingAction}
        title={confirmMeta[pendingAction]?.title || ''}
        message={confirmMeta[pendingAction]?.message || ''}
        confirmLabel={confirmMeta[pendingAction]?.confirmLabel || 'Konfirmasi'}
        severity={confirmMeta[pendingAction]?.severity || 'error'}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
};

export default BulkOperationsToolbar;
