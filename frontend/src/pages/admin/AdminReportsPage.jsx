import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Box, Fade, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Button, Snackbar, Chip, Tooltip } from '@mui/material';
import { Visibility, Edit, Restore, AssignmentInd } from '@mui/icons-material';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import useReportStore from '../../stores/reportStore';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminReportDetailModal from '../../components/admin/AdminReportDetailModal';
import AdminSectionHeader from './AdminSectionHeader';
import getApiErrorMessage from '../../utils/getApiErrorMessage';

const AdminReportsPage = () => {
  const { onMobileMenuClick } = useOutletContext() ?? {};
  const { reports, loading, error, getAllReports, getMyAssignedReports, restoreReport, bulkUpdateReportStatus } = useReportStore();

  const [selectedIds, setSelectedIds] = useState([]);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Detail laporan dibuka sebagai popup via query param `?report=<id>`
  // (konsisten dengan /admin/reports/:id yang di-redirect ke sini).
  const [searchParams, setSearchParams] = useSearchParams();
  const detailReportId = searchParams.get('report');

  // Filter "ditugaskan kepada saya" via query param `?assigned=me` agar bisa
  // di-bookmark/dibagikan. Saat aktif, daftar diambil dari getMyAssignedReports.
  const assignedToMe = searchParams.get('assigned') === 'me';

  const toggleAssignedToMe = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    if (assignedToMe) next.delete('assigned');
    else next.set('assigned', 'me');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, assignedToMe]);

  const openReportDetail = useCallback((reportId) => {
    const next = new URLSearchParams(searchParams);
    next.set('report', String(reportId));
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const closeReportDetail = useCallback(() => {
    if (!searchParams.has('report')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('report');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const fetchReports = useCallback(() => {
    const fetcher = assignedToMe ? getMyAssignedReports : getAllReports;
    return fetcher({ includeDeleted: true }, false).catch((e) => console.error(e));
  }, [assignedToMe, getMyAssignedReports, getAllReports]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const tableData = useMemo(
    () =>
      reports.map((r) => ({
        ...r,
        status: r.deletedAt ? 'DELETED' : r.status,
        category: r.category?.name,
        user: r.user?.name,
        // Info penugas hanya tersedia bila sudah pernah di-merge dari aksi
        // assign (endpoint daftar laporan tidak mengembalikan field ini).
        assignedTo: r.assignedTo?.name || '-',
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
      { field: 'assignedTo', headerName: 'Petugas', sortable: true },
      { field: 'createdAt', headerName: 'Tanggal', type: 'date', sortable: true },
    ],
    []
  );

  const actions = useMemo(
    () => [
      { id: 'detail', label: 'Lihat Detail', icon: <Visibility /> },
      { id: 'restore', label: 'Pulihkan', icon: <Restore />, show: (row) => !!row.deletedAt }
    ],
    []
  );

  const filters = useMemo(
    () => [
      { field: 'status', label: 'Status', options: [
        { value: 'PENDING', label: 'Menunggu' },
        { value: 'IN_REVIEW', label: 'Ditinjau' },
        { value: 'IN_PROGRESS', label: 'Diproses' },
        { value: 'RESOLVED', label: 'Selesai' },
        { value: 'REJECTED', label: 'Ditolak' },
        { value: 'CANCELED', label: 'Dibatalkan' },
        { value: 'DELETED', label: 'Dihapus' },
      ]}
    ],
    []
  );

  const bulkActions = useMemo(
    () => [{ id: 'update-status', label: 'Ubah Status', icon: <Edit /> }],
    []
  );

  const onRowAction = useCallback(
    async (action, row) => {
      if (action === 'detail') openReportDetail(row.id);
      if (action === 'restore') {
        try {
          await restoreReport(row.id);
          setSnackbar({ open: true, message: 'Laporan berhasil dipulihkan', severity: 'success' });
        } catch (e) {
          setSnackbar({ open: true, message: `Gagal memulihkan laporan: ${getApiErrorMessage(e)}`, severity: 'error' });
        }
      }
    },
    [openReportDetail, restoreReport]
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
        message: `Gagal memperbarui status laporan: ${getApiErrorMessage(e)}`,
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
          onRefresh={fetchReports}
        />

        {/* Quick filter: laporan yang ditugaskan kepada admin yang sedang login */}
        <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title="Tampilkan hanya laporan yang ditugaskan kepada Anda">
            <Chip
              icon={<AssignmentInd />}
              label="Ditugaskan kepada saya"
              color={assignedToMe ? 'primary' : 'default'}
              variant={assignedToMe ? 'filled' : 'outlined'}
              onClick={toggleAssignedToMe}
              sx={{ fontWeight: 650 }}
            />
          </Tooltip>
          {assignedToMe && (
            <Button size="small" onClick={toggleAssignedToMe} sx={{ fontWeight: 650 }}>
              Tampilkan semua laporan
            </Button>
          )}
        </Box>

        <AdminDataTable
          data={tableData}
          columns={columns}
          loading={loading}
          onRowAction={onRowAction}
          onBulkAction={onBulkAction}
          actions={actions}
          bulkActions={bulkActions}
          filters={filters}
          title={assignedToMe ? 'Laporan yang Ditugaskan kepada Saya' : 'Daftar Laporan'}
          selectable
        />
        {error && <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>{error}</Alert>}

        {/* Popup detail laporan (?report=<id>). Perubahan status/prioritas/
            penugasan dari modal sudah di-merge ke store oleh aksi terkait,
            jadi tidak perlu refetch penuh di sini. */}
        <AdminReportDetailModal
          open={Boolean(detailReportId)}
          reportId={detailReportId}
          initialReport={reports.find((r) => String(r.id) === String(detailReportId)) || null}
          onClose={closeReportDetail}
        />

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
                <MenuItem value="PENDING">Menunggu</MenuItem>
                <MenuItem value="IN_REVIEW">Sedang Ditinjau</MenuItem>
                <MenuItem value="IN_PROGRESS">Sedang Diproses</MenuItem>
                <MenuItem value="RESOLVED">Selesai</MenuItem>
                <MenuItem value="REJECTED">Ditolak</MenuItem>
                <MenuItem value="CANCELED">Dibatalkan</MenuItem>
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
