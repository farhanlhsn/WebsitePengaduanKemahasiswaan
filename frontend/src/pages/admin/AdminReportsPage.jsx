import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Box, Fade, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Button, Snackbar } from '@mui/material';
import { Visibility, Edit, Restore } from '@mui/icons-material';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import useReportStore from '../../stores/reportStore';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminSectionHeader from './AdminSectionHeader';
import AdminReportDetailModal from '../../components/admin/AdminReportDetailModal';

const AdminReportsPage = () => {
  const { onMobileMenuClick } = useOutletContext() ?? {};
  const [searchParams, setSearchParams] = useSearchParams();
  const { reports, loading, error, getAllReports, getReportById, restoreReport, bulkUpdateReportStatus } = useReportStore();

  const [selectedIds, setSelectedIds] = useState([]);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    getAllReports({ includeDeleted: true }, false).catch((e) => console.error(e));
  }, [getAllReports]);

  useEffect(() => {
    const reportId = searchParams.get('report');
    if (!reportId) return;

    const reportFromList = reports.find((item) => String(item.id) === String(reportId));
    if (reportFromList) {
      setSelectedReport(reportFromList);
      setDetailOpen(true);
      return;
    }

    let active = true;
    getReportById(reportId, true)
      .then((report) => {
        if (!active) return;
        setSelectedReport(report);
        setDetailOpen(true);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [searchParams, reports, getReportById]);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedReport(null);
    if (searchParams.has('report')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('report');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const tableData = useMemo(
    () =>
      reports.map((r) => ({
        ...r,
        status: r.deletedAt ? 'DELETED' : r.status,
        category: r.category?.name,
        user: r.user?.name,
        isAnonymous: !!r.isAnonymous,
      })),
    [reports]
  );

  const columns = useMemo(
    () => [
      { field: 'title', headerName: 'Judul', sortable: true, width: '28%' },
      { field: 'status', headerName: 'Status', type: 'status', sortable: true, width: '17%' },
      { field: 'category', headerName: 'Kategori', sortable: true, width: '18%' },
      { field: 'user', headerName: 'Pelapor', type: 'reporter', sortable: true, width: '20%' },
      { field: 'createdAt', headerName: 'Tanggal', type: 'date', sortable: true, width: '17%' },
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
    () => [{ id: 'update-status', label: 'Perbarui Status', icon: <Edit /> }],
    []
  );

  const onRowAction = useCallback(
    async (action, row) => {
      if (action === 'detail') {
        setSelectedReport(row);
        setDetailOpen(true);
      }
      if (action === 'restore') {
        try {
          await restoreReport(row.id);
          setSnackbar({ open: true, message: 'Laporan berhasil dipulihkan', severity: 'success' });
        } catch (e) {
          setSnackbar({ open: true, message: `Gagal memulihkan laporan: ${e.message || e}`, severity: 'error' });
        }
      }
    },
    [restoreReport]
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
          onRefresh={() => getAllReports({ includeDeleted: true }, false)}
        />
        <AdminDataTable
          data={tableData}
          columns={columns}
          loading={loading}
          onRowAction={onRowAction}
          onBulkAction={onBulkAction}
          actions={actions}
          bulkActions={bulkActions}
          filters={filters}
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
                <MenuItem value="PENDING">Menunggu</MenuItem>
                <MenuItem value="IN_REVIEW">Ditinjau</MenuItem>
                <MenuItem value="IN_PROGRESS">Diproses</MenuItem>
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


        <AdminReportDetailModal
          open={detailOpen}
          reportId={selectedReport?.id}
          initialReport={selectedReport}
          onClose={closeDetail}
          onUpdated={(updated) => setSelectedReport(updated)}
        />

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
