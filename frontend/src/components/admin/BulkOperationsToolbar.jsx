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
  Typography
} from '@mui/material';
import {
  MoreVert,
  CheckCircle,
  Delete,
  Restore,
  Edit
} from '@mui/icons-material';
import ConfirmDialog from '../ui/ConfirmDialog';

const TYPE_LABEL = {
  users: 'pengguna',
  reports: 'laporan',
  categories: 'kategori',
};

const BulkOperationsToolbar = ({ 
  selectedCount, 
  type, // 'users', 'reports', or 'categories'
  onBulkVerify,
  onBulkDelete,
  onBulkRestore,
  onBulkUpdateStatus,
  onClearSelection
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  // Fix M10: konfirmasi bulk via ConfirmDialog (bukan window.confirm English).
  const [pendingAction, setPendingAction] = useState(null);

  const typeLabel = TYPE_LABEL[type] || type;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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
      title: `Restore ${selectedCount} ${typeLabel}`,
      message: `Pulihkan ${selectedCount} ${typeLabel} terpilih?`,
      confirmLabel: 'Restore',
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
    await onBulkUpdateStatus(selectedStatus);
    setSelectedStatus('');
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          bgcolor: 'primary.main',
          color: 'white',
          p: 2,
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={`${selectedCount} selected`}
            color="secondary"
            sx={{ fontWeight: 'bold' }}
          />
          <Typography variant="body2">
            Bulk Operations Available
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {type === 'users' && onBulkVerify && (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckCircle />}
              onClick={() => handleBulkAction('verify')}
            >
              Verify
            </Button>
          )}

          {type === 'reports' && onBulkUpdateStatus && (
            <Button
              variant="contained"
              color="info"
              size="small"
              startIcon={<Edit />}
              onClick={() => handleBulkAction('updateStatus')}
            >
              Update Status
            </Button>
          )}

          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<Delete />}
            onClick={() => handleBulkAction('delete')}
          >
            Delete
          </Button>

          <Button
            variant="contained"
            color="warning"
            size="small"
            startIcon={<Restore />}
            onClick={() => handleBulkAction('restore')}
          >
            Restore
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={onClearSelection}
            sx={{ color: 'white', borderColor: 'white' }}
          >
            Clear
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={handleMenuOpen}
            sx={{ color: 'white', borderColor: 'white', minWidth: 'auto', px: 1 }}
          >
            <MoreVert />
          </Button>
        </Box>
      </Box>

      {/* More Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleBulkAction('delete')}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Hapus Massal
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('restore')}>
          <Restore fontSize="small" sx={{ mr: 1 }} />
          Restore Massal
        </MenuItem>
        {type === 'users' && (
          <MenuItem onClick={() => handleBulkAction('verify')}>
            <CheckCircle fontSize="small" sx={{ mr: 1 }} />
            Verifikasi Massal
          </MenuItem>
        )}
        {type === 'reports' && (
          <MenuItem onClick={() => handleBulkAction('updateStatus')}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Ubah Status Massal
          </MenuItem>
        )}
      </Menu>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Ubah Status Laporan</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="PENDING">Menunggu</MenuItem>
              <MenuItem value="IN_REVIEW">Sedang Ditinjau</MenuItem>
              <MenuItem value="IN_PROGRESS">Sedang Diproses</MenuItem>
              <MenuItem value="RESOLVED">Selesai</MenuItem>
              <MenuItem value="REJECTED">Ditolak</MenuItem>
              <MenuItem value="CANCELED">Dibatalkan</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Batal</Button>
          <Button 
            onClick={handleStatusUpdate} 
            variant="contained" 
            disabled={!selectedStatus}
          >
            Perbarui
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


