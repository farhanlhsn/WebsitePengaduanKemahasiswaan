import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Box, Fade, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Button, Snackbar } from '@mui/material';
import { Visibility, Edit } from '@mui/icons-material';
import { useNavigate, useOutletContext } from 'react-router-dom';
import useReportStore from '../../stores/reportStore';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminSectionHeader from './AdminSectionHeader';

const AdminReportsPage = () => {
  const navigate = useNavigate();
  const { onMobileMenuClick } = useOutletContext() ?? {};
  const { reports, loading, error, getAllReports, bulkUpdateReportStatus } = useReportStore();

  const [selectedIds, setSelectedIds] = useState([]);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    getAllReports({}, false).catch((e) => console.error(e));
  }, [getAllReports]);

  const tableData = useMemo(
    () =>
      reports.map((r) => ({
        ...r,
        category: r.category?.name,
        user: r.user?.name,
        isAnonymous: !!r.isAnonymous,
      })),
    [reports]
  );

  const columns = useMemo(
    () => [
      { field: 'title', headerName: 'Judul', sortable: true },
      { field: 'status', headerName: 'Status', type: 'status', sortable: true },
      { field: 'category', headerName: 'Kategori', sortable: true },
      { field: 'user', headerName: 'Pelapor', type: 'reporter', sortable: true },
      { field: 'createdAt', headerName: 'Tanggal', type: 'date', sortable: true },
    ],
    []
  );

  const actions = useMemo(
    () => [{ id: 'detail', label: 'Lihat Detail', icon: <Visibility /> }],
    []
  );

  const bulkActions = useMemo(
    () => [{ id: 'update-status', label: 'Update Status', icon: <Edit /> }],
    []
  );

  const onRowAction = useCallback(
    (action, row) => {
      if (action === 'detail') navigate(`/admin/reports/${row.id}`);
    },
    [navigate]
  );

  const onBulkAction = useCallback((action, ids) => {
    if (action === 'update-status') {
      setSelectedIds(ids);
      setSelectedStatus('');
      setStatusDialogOpen(true);
    }
  }, []);

  const handleStatusUpdateConfirm = async () => {
    if (!selectedStatus || selectedIds.length === 0) return;
    try {
      await bulkUpdateReportStatus(selectedIds, selectedStatus);
      setSnackbar({
        open: true,
        message: `Berhasil memperbarui status ${selectedIds.length} laporan`,
        severity: 'success'
      });
      setStatusDialogOpen(false);
      setSelectedIds([]);
      setSelectedStatus('');
    } catch (e) {
      console.error(e);
      setSnackbar({
        open: true,
        message: `Gagal memperbarui status laporan: ${e.message || e}`,
        severity: 'error'
      });
    }
  };

  return (
    <Fade in timeout={300}>
      <Box>
        <AdminSectionHeader
          title="Manajemen Laporan"
          subtitle="Kelola dan tindak lanjuti semua laporan pengaduan"
          onMobileMenuClick={onMobileMenuClick}
          onRefresh={() => getAllReports({}, false)}
        />
        <AdminDataTable
          data={tableData}
          columns={columns}
          loading={loading}
          onRowAction={onRowAction}
          onBulkAction={onBulkAction}
          actions={actions}
          bulkActions={bulkActions}
          title="Daftar Laporan"
          selectable
        />
        {error && <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>{error}</Alert>}

        {/* Dialog Pembaruan Status Massal */}
        <Dialog 
          open={statusDialogOpen} 
          onClose={() => setStatusDialogOpen(false)}
          PaperProps={{ sx: { borderRadius: 3, minWidth: 320 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Pilih Status Baru</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1, mb: 1 }}>
              Tentukan status baru untuk {selectedIds.length} laporan yang terpilih:
            </Box>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="bulk-status-select-label">Status</InputLabel>
              <Select
                labelId="bulk-status-select-label"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="PENDING">Menunggu (Pending)</MenuItem>
                <MenuItem value="IN_REVIEW">Sedang Ditinjau (In Review)</MenuItem>
                <MenuItem value="IN_PROGRESS">Sedang Diproses (In Progress)</MenuItem>
                <MenuItem value="RESOLVED">Selesai (Resolved)</MenuItem>
                <MenuItem value="REJECTED">Ditolak (Rejected)</MenuItem>
                <MenuItem value="CANCELED">Dibatalkan (Canceled)</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setStatusDialogOpen(false)} sx={{ fontWeight: 600 }}>Batal</Button>
            <Button 
              onClick={handleStatusUpdateConfirm} 
              variant="contained" 
              disabled={!selectedStatus}
              sx={{ fontWeight: 600, borderRadius: 2 }}
            >
              Konfirmasi
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar Notifikasi */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity} 
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default AdminReportsPage;
