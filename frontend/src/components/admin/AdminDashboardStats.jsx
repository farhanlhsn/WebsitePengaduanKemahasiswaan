import React from 'react';
import { Grid, Box, Typography, LinearProgress } from '@mui/material';
import { 
  People, Assignment, CheckCircle, PendingActions, 
  Schedule, Chat, Category, PersonAdd
} from '@mui/icons-material';
import EnhancedStatCard from '../dashboard/EnhancedStatCard';
import { useTheme } from '@mui/material/styles';

const AdminDashboardStats = ({ 
  dashboardStats = null, 
  loading = false 
}) => {
  const theme = useTheme();

  // Extract stats from comprehensive dashboard stats
  const safeUserStats = dashboardStats?.users || {
    total: 0,
    verified: 0,
    unverified: 0,
    deleted: 0
  };

  const safeReportStats = dashboardStats?.reports || {
    total: 0,
    resolved: 0,
    pending: 0,
    inProgress: 0,
    inReview: 0,
    rejected: 0
  };

  const safeCategoryStats = dashboardStats?.categories || {
    total: 0,
    active: 0
  };

  // Calculate resolution rate
  const resolutionRate = safeReportStats.total > 0 
    ? ((safeReportStats.resolved / safeReportStats.total) * 100).toFixed(1)
    : 0;

  const statsData = [
    {
      title: 'Total Pengguna',
      value: safeUserStats.total || 0,
      icon: <People />,
      color: '#2E7D32',
      subtitle: `${safeUserStats.verified || 0} verified, ${safeUserStats.unverified || 0} pending`,
    },
    {
      title: 'Unverified Users',
      value: safeUserStats.unverified || 0,
      icon: <PersonAdd />,
      color: '#F57C00',
      subtitle: 'Perlu verifikasi',
    },
    {
      title: 'Total Laporan',
      value: safeReportStats.total || 0,
      icon: <Assignment />,
      color: '#1976D2',
      showProgress: true,
      progressValue: resolutionRate,
      subtitle: `${resolutionRate}% resolved`,
    },
    {
      title: 'Laporan Selesai',
      value: safeReportStats.resolved || 0,
      icon: <CheckCircle />,
      color: '#388E3C',
      subtitle: 'Tingkat penyelesaian',
    },
    {
      title: 'Pending',
      value: safeReportStats.pending || 0,
      icon: <PendingActions />,
      color: '#ED6C02',
      subtitle: 'Menunggu review',
    },
    {
      title: 'In Review',
      value: safeReportStats.inReview || 0,
      icon: <Schedule />,
      color: '#0288D1',
      subtitle: 'Sedang direview',
    },
    {
      title: 'In Progress',
      value: safeReportStats.inProgress || 0,
      icon: <Schedule />,
      color: '#F57C00',
      subtitle: 'Dalam proses',
    },
    {
      title: 'Total Kategori',
      value: safeCategoryStats.total || 0,
      icon: <Category />,
      color: '#7B1FA2',
      subtitle: `${safeCategoryStats.active || 0} aktif`,
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
      {/* High Priority Stats - Larger cards for important metrics */}
      <Grid container spacing={3} sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gridGap: '20px',
        mb: 3
      }}>
        {statsData.map((stat, index) => (
          <Grid 
            key={index} 
            item 
            xs={12} 
            sm={6} 
            lg={3}
            sx={{
              // On very wide screens, make cards slightly larger
              '@media (min-width: 1920px)': {
                minHeight: 220
              }
            }}
          >
            <EnhancedStatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              subtitle={stat.subtitle}
              showProgress={stat.showProgress}
              progressValue={stat.progressValue}
              animateValue
            />
          </Grid>
        ))}
      </Grid>

    </Box>
  );
};

export default AdminDashboardStats;