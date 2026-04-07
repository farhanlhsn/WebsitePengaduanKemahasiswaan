import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import {
  Container,
  Typography,
  Grid,
  Box,
  Paper,
  Stack,
  Avatar,
  useTheme
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Warning,
  People,
  Timeline,
  PieChart as PieIcon,
  Category,
  VerifiedUser
} from '@mui/icons-material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { getAdminDashboardStats, getReportStats } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatCard from '../components/ui/StatCard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#F44336'];

const AdminAnalyticsPage = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [reportStats, setReportStats] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [dashboard, reports] = await Promise.all([
        getAdminDashboardStats(),
        getReportStats()
      ]);
      
      setDashboardStats(dashboard);
      setReportStats(reports);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat data analitik..." />;
  }

  // Prepare Data
  const trendData = dashboardStats?.trends?.reports || [];
  const topCategories = dashboardStats?.categories?.topCategories || [];
  
  const reportStatusData = reportStats ? [
    { name: 'Pending', value: reportStats.pending || 0, color: '#FF9800' },
    { name: 'In Review', value: reportStats.inReview || 0, color: '#2196F3' },
    { name: 'In Progress', value: reportStats.inProgress || 0, color: '#9C27B0' },
    { name: 'Resolved', value: reportStats.resolved || 0, color: '#4CAF50' },
    { name: 'Rejected', value: reportStats.rejected || 0, color: '#F44336' },
    { name: 'Canceled', value: reportStats.canceled || 0, color: '#9E9E9E' }
  ].filter(item => item.value > 0) : [];

  const resolutionRate = reportStats?.total > 0 
    ? ((reportStats.resolved / reportStats.total) * 100).toFixed(1) 
    : 0;

  const userVerificationData = [
    { name: 'Terverifikasi', value: dashboardStats?.users?.verified || 0, fill: '#4CAF50' },
    { name: 'Belum Verifikasi', value: dashboardStats?.users?.unverified || 0, fill: '#FF9800' }
  ];

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="800" gutterBottom>
            Analitik & Wawasan
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Ringkasan performa sistem dan statistik pengaduan
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* KPI Cards - Row 1 */}
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard 
              title="Total Laporan" 
              value={reportStats?.total || 0}
              icon={<Assignment />}
              color="#2196F3"
              subtitle="Total Masuk"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard 
              title="Penyelesaian" 
              value={`${resolutionRate}%`}
              icon={<CheckCircle />}
              color="#4CAF50"
              subtitle="Tingkat Sukses"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard 
              title="Pending" 
              value={reportStats?.pending || 0}
              icon={<Warning />}
              color="#FF9800"
              subtitle="Perlu Tindakan"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard 
              title="User Aktif" 
              value={dashboardStats?.users?.active || 0}
              icon={<People />}
              color="#9C27B0"
              subtitle="Partisipasi"
            />
          </Grid>

          {/* Trend Chart - Row 2 (Full Width) */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32, mr: 2 }}>
                  <Timeline sx={{ fontSize: 20, color: 'white' }} />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Tren Laporan (7 Hari Terakhir)
                </Typography>
              </Box>
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2196F3" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2196F3" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#757575', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#757575', fontSize: 12}} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#2196F3" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Bottom Stats - Row 3 (3 Columns) */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'warning.light', width: 32, height: 32, mr: 2 }}>
                  <PieIcon sx={{ fontSize: 20, color: 'white' }} />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Status Laporan
                </Typography>
              </Box>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {reportStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'secondary.light', width: 32, height: 32, mr: 2 }}>
                  <Category sx={{ fontSize: 20, color: 'white' }} />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Kategori Terpopuler
                </Typography>
              </Box>
              {topCategories.length > 0 ? (
                <Stack spacing={3} sx={{ mt: 2 }}>
                  {topCategories.map((cat, index) => (
                    <Box key={cat.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: '70%' }}>{cat.name}</Typography>
                        <Typography variant="caption" color="textSecondary" fontWeight={600}>{cat.reportCount}</Typography>
                      </Box>
                      <Box sx={{ width: '100%', height: 6, bgcolor: '#f5f5f5', borderRadius: 4, overflow: 'hidden' }}>
                        <Box sx={{ 
                          width: `${(cat.reportCount / (topCategories[0].reportCount || 1)) * 100}%`, 
                          height: '100%', 
                          bgcolor: COLORS[index % COLORS.length],
                          borderRadius: 4
                        }} />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ display: 'flex', height: 200, alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="textSecondary">Belum ada data</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'success.light', width: 32, height: 32, mr: 2 }}>
                  <VerifiedUser sx={{ fontSize: 20, color: 'white' }} />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Verifikasi User
                </Typography>
              </Box>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userVerificationData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {userVerificationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

        </Grid>
      </Container>
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;