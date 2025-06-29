import React from 'react';
import { Grid, Box, Typography, LinearProgress } from '@mui/material';
import { 
  People, Assignment, CheckCircle, PendingActions, 
  TrendingUp, Schedule, Security, Chat
} from '@mui/icons-material';
import EnhancedStatCard from '../dashboard/EnhancedStatCard';
import { useTheme } from '@mui/material/styles';

const AdminDashboardStats = ({ 
  userStats = null, 
  reportStats = null, 
  systemStats = null,
  loading = false 
}) => {
  const theme = useTheme();

  // Provide safe defaults for all stats
  const safeUserStats = userStats || {
    total: 0,
    active: 0,
    growth: 0,
    activeGrowth: 0
  };

  const safeReportStats = reportStats || {
    total: 0,
    resolved: 0,
    pending: 0,
    resolutionRate: 0
  };

  const safeSystemStats = systemStats || {
    avgResponseTime: '0',
    unreadMessages: 0,
    uptime: '99.9'
  };

  const statsData = [
    {
      title: 'Total Pengguna',
      value: safeUserStats.total || 0,
      icon: <People />,
      color: '#2E7D32',
      trend: safeUserStats.growth > 0 ? 'up' : 'down',
      trendValue: safeUserStats.growth ? `+${safeUserStats.growth}%` : undefined,
      subtitle: 'Pengguna terdaftar'
    },
    {
      title: 'Total Laporan',
      value: safeReportStats.total || 0,
      icon: <Assignment />,
      color: '#1976D2',
      showProgress: true,
      progressValue: safeReportStats.total > 0 ? (safeReportStats.resolved / safeReportStats.total) * 100 : 0,
      subtitle: 'Laporan masuk'
    },
    {
      title: 'Laporan Selesai',
      value: safeReportStats.resolved || 0,
      icon: <CheckCircle />,
      color: '#388E3C',
      trend: 'up',
      trendValue: safeReportStats.resolutionRate ? `${safeReportStats.resolutionRate}%` : undefined,
      subtitle: 'Tingkat penyelesaian'
    },
    {
      title: 'Menunggu Review',
      value: safeReportStats.pending || 0,
      icon: <PendingActions />,
      color: '#F57C00',
      subtitle: 'Butuh perhatian'
    },
    {
      title: 'Pengguna Aktif',
      value: safeUserStats.active || 0,
      icon: <TrendingUp />,
      color: '#7B1FA2',
      trend: 'up',
      trendValue: safeUserStats.activeGrowth ? `+${safeUserStats.activeGrowth}%` : undefined,
      subtitle: '30 hari terakhir'
    },
    {
      title: 'Waktu Respon Rata-rata',
      value: safeSystemStats.avgResponseTime || '0',
      icon: <Schedule />,
      color: '#00796B',
      suffix: 'h',
      subtitle: 'Jam kerja'
    },
    {
      title: 'Pesan Belum Dibaca',
      value: safeSystemStats.unreadMessages || 0,
      icon: <Chat />,
      color: '#D32F2F',
      subtitle: 'Komunikasi pending'
    },
    {
      title: 'Sistem Uptime',
      value: safeSystemStats.uptime || '99.9',
      icon: <Security />,
      color: '#388E3C',
      suffix: '%',
      showProgress: true,
      progressValue: parseFloat(safeSystemStats.uptime || '99.9'),
      subtitle: 'Ketersediaan sistem'
    }
  ];

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[...Array(8)].map((_, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Box sx={{ 
              height: 180, 
              borderRadius: 4, 
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <LinearProgress sx={{ width: '60%' }} />
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        Ringkasan Sistem
      </Typography>
      
      <Grid container spacing={3}>
        {statsData.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.title}>
            <EnhancedStatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
              trendValue={stat.trendValue}
              showProgress={stat.showProgress}
              progressValue={stat.progressValue}
              subtitle={stat.subtitle}
              suffix={stat.suffix}
              animateValue={true}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AdminDashboardStats;