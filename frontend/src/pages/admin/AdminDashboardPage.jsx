import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Grid, Fade, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useOutletContext } from 'react-router-dom';
import useUserStore from '../../stores/userStore';
import useReportStore from '../../stores/reportStore';
import useCategoryStore from '../../stores/categoryStore';
import { getAdminDashboardStats } from '../../services/api';
import AdminDashboardStats from '../../components/admin/AdminDashboardStats';
import StatusChart from '../../components/dashboard/StatusChart';
import AdminSectionHeader from './AdminSectionHeader';

const AdminDashboardPage = () => {
  const theme = useTheme();
  const { onMobileMenuClick } = useOutletContext() ?? {};
  const { loading: userLoading, error: userError, getAllUsers } = useUserStore();
  const { reports, loading: reportLoading, error: reportError, getAllReports } = useReportStore();
  const { getCategories } = useCategoryStore();

  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setDashboardLoading(true);
      const [stats] = await Promise.all([
        getAdminDashboardStats(),
        getAllUsers(true),
        getAllReports({}, false),
        getCategories(),
      ]);
      setDashboardStats(stats);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setDashboardLoading(false);
    }
  }, [getAllUsers, getAllReports, getCategories]);

  useEffect(() => { refresh(); }, [refresh]);

  // Build chart data from latest reports.
  const chartData = useMemo(() => {
    const counts = {
      pending: reports.filter((r) => r.status === 'PENDING').length,
      inReview: reports.filter((r) => r.status === 'IN_REVIEW').length,
      inProgress: reports.filter((r) => r.status === 'IN_PROGRESS').length,
      resolved: reports.filter((r) => r.status === 'RESOLVED').length,
      rejected: reports.filter((r) => r.status === 'REJECTED').length,
      canceled: reports.filter((r) => r.status === 'CANCELED').length,
    };
    return [
      { name: 'Menunggu', value: counts.pending, color: theme.palette.warning.main },
      { name: 'Ditinjau', value: counts.inReview, color: theme.palette.info.main },
      { name: 'Diproses', value: counts.inProgress, color: theme.palette.secondary.main },
      { name: 'Selesai', value: counts.resolved, color: theme.palette.success.main },
      { name: 'Ditolak', value: counts.rejected, color: theme.palette.error.main },
      { name: 'Dibatalkan', value: counts.canceled, color: theme.palette.grey[500] },
    ].filter((it) => it.value > 0);
  }, [reports, theme]);

  return (
    <Fade in timeout={300}>
      <Box>
        <AdminSectionHeader
          title="Dashboard"
          subtitle="Ringkasan sistem dan statistik keseluruhan"
          onMobileMenuClick={onMobileMenuClick}
          onRefresh={refresh}
        />
        <AdminDashboardStats
          dashboardStats={dashboardStats}
          loading={dashboardLoading || userLoading || reportLoading}
        />
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12 }} sx={{ '@media (min-width: 1920px)': { minHeight: 500 } }}>
            <StatusChart data={chartData} />
          </Grid>
        </Grid>
        {(userError || reportError) && (
          <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
            {userError || reportError}
          </Alert>
        )}
      </Box>
    </Fade>
  );
};

export default AdminDashboardPage;
