import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Fade,
  Typography,
  Button,
  Alert,
  Snackbar,
  Grid
} from '@mui/material';
import { Refresh, Delete, History, CheckCircle, Person, Assignment } from '@mui/icons-material';
import { getAuditLogs, getAuditStats, cleanupOldAuditLogs } from '../services/api';
import AuditLogFilters from '../components/admin/AuditLogFilters';
import AuditLogList from '../components/admin/AuditLogList';
import AuditLogDetailModal from '../components/admin/AuditLogDetailModal';
import StatCard from '../components/ui/StatCard';

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalLogs, setTotalLogs] = useState(0);
  
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    actorId: '',
    entityId: '',
    startDate: '',
    endDate: '',
    limit: 50,
    offset: 0
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    // Update offset when page changes
    setFilters(prev => ({
      ...prev,
      offset: page * rowsPerPage
    }));
  }, [page, rowsPerPage]);

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAuditLogs(filters);
      setLogs(result.logs || []);
      setTotalLogs(result.pagination?.total || 0);
    } catch (error) {
      showSnackbar('Failed to load audit logs: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadAuditStats = useCallback(async () => {
    try {
      const statsData = await getAuditStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load audit stats:', error);
    }
  }, []);

  useEffect(() => {
    loadAuditStats();
  }, [loadAuditStats]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const handleRefresh = () => {
    loadAuditLogs();
    loadAuditStats();
  };

  const handleClearFilters = () => {
    setFilters({
      entityType: '',
      action: '',
      actorId: '',
      entityId: '',
      startDate: '',
      endDate: '',
      limit: 50,
      offset: 0
    });
    setPage(0);
  };

  const handleShowDetails = (log) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  const handleCleanup = async () => {
    if (!window.confirm('Are you sure you want to cleanup audit logs older than 1 year? This cannot be undone.')) {
      return;
    }

    try {
      const result = await cleanupOldAuditLogs(365);
      showSnackbar(`Berhasil membersihkan ${result.deleted} log audit lama`, 'success');
      handleRefresh();
    } catch (error) {
      showSnackbar('Gagal membersihkan log audit: ' + error.message, 'error');
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Fade in timeout={300}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Log Audit
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Riwayat aktivitas sistem dan perubahan data
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Segarkan
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleCleanup}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Bersihkan Log Lama
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                title="Total Log"
                value={stats.total?.toLocaleString() || 0}
                icon={<History />}
                color="#2196F3"
                subtitle="Seluruh Aktivitas"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                title="Aktivitas Pengguna"
                value={stats.byEntityType?.USER || 0}
                icon={<Person />}
                color="#9C27B0"
                subtitle="Aktivitas Pengguna"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                title="Aktivitas Laporan"
                value={stats.byEntityType?.REPORT || 0}
                icon={<Assignment />}
                color="#FF9800"
                subtitle="Aktivitas Laporan"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                title="Verifikasi"
                value={stats.byAction?.VERIFY_MAHASISWA || 0}
                icon={<CheckCircle />}
                color="#4CAF50"
                subtitle="Total Verifikasi"
              />
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Box sx={{ mb: 3 }}>
          <AuditLogFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={handleClearFilters}
          />
        </Box>

        {/* Audit Logs Table */}
        <AuditLogList
          logs={logs}
          loading={loading}
          onShowDetails={handleShowDetails}
          page={page}
          rowsPerPage={rowsPerPage}
          totalLogs={totalLogs}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />

        {/* Detail Modal */}
        <AuditLogDetailModal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          log={selectedLog}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
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

export default AuditLogPage;

