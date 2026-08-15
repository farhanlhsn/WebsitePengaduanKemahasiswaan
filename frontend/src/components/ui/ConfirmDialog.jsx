import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import { WarningAmber } from '@mui/icons-material';

/**
 * Fix H4/H5: dialog konfirmasi untuk aksi destruktif (hapus user, bulk ops,
 * demote admin, revoke kategori, dsb.). Sebelumnya aksi-aksi ini dieksekusi
 * dengan satu klik tanpa konfirmasi.
 *
 * Props:
 * - open: boolean
 * - title: string
 * - message: string (jelaskan konsekuensi aksi)
 * - confirmLabel?: string (default "Konfirmasi")
 * - cancelLabel?: string (default "Batal")
 * - severity?: "error" | "warning" (warna tombol konfirmasi)
 * - loading?: boolean (disable tombol saat aksi berjalan)
 * - onConfirm: () => void
 * - onCancel: () => void
 */
const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  severity = 'error',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmber color={severity} />
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color={severity}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Memproses…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
