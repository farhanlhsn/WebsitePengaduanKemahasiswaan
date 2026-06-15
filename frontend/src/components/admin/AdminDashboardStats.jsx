import React from 'react';
import { Box, LinearProgress, Paper } from '@mui/material';
import { Assignment, CheckCircle, People, PersonAdd } from '@mui/icons-material';
import EnhancedStatCard from '../dashboard/EnhancedStatCard';

const AdminDashboardStats = ({ dashboardStats = null, loading = false }) => {
  const userStats = dashboardStats?.users || { total: 0, verified: 0, unverified: 0 };
  const reportStats = dashboardStats?.reports || { total: 0, resolved: 0 };
  const resolutionRate = reportStats.total > 0
    ? Math.round((reportStats.resolved / reportStats.total) * 100)
    : 0;

  const stats = [
    {
      title: 'Total Pengguna',
      value: userStats.total || 0,
      icon: <People />,
      color: '#2E7D32',
      subtitle: `${userStats.verified || 0} terverifikasi`,
    },
    {
      title: 'Belum Terverifikasi',
      value: userStats.unverified || 0,
      icon: <PersonAdd />,
      color: '#F57C00',
      subtitle: 'Perlu diperiksa',
    },
    {
      title: 'Total Laporan',
      value: reportStats.total || 0,
      icon: <Assignment />,
      color: '#1976D2',
      subtitle: 'Seluruh pengaduan',
    },
    {
      title: 'Laporan Selesai',
      value: reportStats.resolved || 0,
      icon: <CheckCircle />,
      color: '#388E3C',
      showProgress: true,
      progressValue: resolutionRate,
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
        {[...Array(4)].map((_, index) => (
          <Paper key={index} variant="outlined" sx={{ height: 126, borderRadius: 3, display: 'grid', placeItems: 'center' }}>
            <LinearProgress sx={{ width: '55%' }} />
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 2.5 }}>
      {stats.map((stat) => <EnhancedStatCard key={stat.title} {...stat} animateValue />)}
    </Box>
  );
};

export default AdminDashboardStats;
