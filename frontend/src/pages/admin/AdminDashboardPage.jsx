import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Grid, Fade, Alert } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import useUserStore from '../../stores/userStore';
import useReportStore from '../../stores/reportStore';
import useCategoryStore from '../../stores/categoryStore';
import { getAdminDashboardStats } from '../../services/api';
import AdminDashboardStats from '../../components/admin/AdminDashboardStats';
import StatusChart from '../../components/dashboard/StatusChart';
import AdminSectionHeader from './AdminSectionHeader';
import { STATUS_CONFIG } from '../../utils/statusConfig';

const AdminDashboardPage = () => {
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
  // Label & warna status terpusat di utils/statusConfig.
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
      { name: STATUS_CONFIG.PENDING.label, value: counts.pending, color: STATUS_CONFIG.PENDING.color },
      { name: STATUS_CONFIG.IN_REVIEW.label, value: counts.inReview, color: STATUS_CONFIG.IN_REVIEW.color },
      { name: STATUS_CONFIG.IN_PROGRESS.label, value: counts.inProgress, color: STATUS_CONFIG.IN_PROGRESS.color },
      { name: STATUS_CONFIG.RESOLVED.label, value: counts.resolved, color: STATUS_CONFIG.RESOLVED.color },
      { name: STATUS_CONFIG.REJECTED.label, value: counts.rejected, color: STATUS_CONFIG.REJECTED.color },
      { name: STATUS_CONFIG.CANCELED.label, value: counts.canceled, color: STATUS_CONFIG.CANCELED.color },
    ].filter((it) => it.value > 0);
  }, [reports]);

  return (
    <Fade in timeout={300}>
      <Box>
        <AdminSectionHeader
          title="Dasbor"
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
