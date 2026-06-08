import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Fade, Typography, Grid, Box, Paper, Stack,
  Avatar, useTheme, IconButton, Button, Breadcrumbs,
  Link, Tooltip as MuiTooltip, LinearProgress, Chip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Assignment, CheckCircle, Warning, People, Timeline,
  Category, VerifiedUser, Refresh, GetApp, NavigateNext, Home, TrendingUp
} from '@mui/icons-material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { getAdminDashboardStats, getReportStats } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import useReportStore from '../stores/reportStore';
import GlassCard from '../components/ui/GlassCard';
import AdminSectionHeader from './admin/AdminSectionHeader';

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, color, subtitle }) => {
  return (
    <GlassCard variant="glass" sx={{
      p: { xs: 2.5, md: 3 },
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-6px)',
        boxShadow: `0 20px 50px ${alpha(color, 0.12)}`,
        borderColor: alpha(color, 0.3),
        '& .card-icon': {
          transform: 'scale(1.1) rotate(5deg)',
          bgcolor: color,
          color: '#fff',
        }
      }
    }}>
      {/* Decorative Background Blob */}
      <Box sx={{
        position: 'absolute', top: -40, right: -40,
        width: 140, height: 140, borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(color, 0.05)} 0%, transparent 70%)`,
        zIndex: 0
      }} />
      
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
          <Avatar 
            className="card-icon"
            variant="rounded" 
            sx={{
              bgcolor: alpha(color, 0.1), color,
              width: 52, height: 52, borderRadius: 2.5,
              transition: 'all 0.3s ease',
              boxShadow: `0 8px 20px ${alpha(color, 0.15)}`,
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -1, color: 'text.primary', mb: 0.2 }}>
              {value}
            </Typography>
            <Typography variant="caption" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary', display: 'block', fontSize: '0.65rem' }}>
              {title}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: '100%', height: 6, bgcolor: alpha(color, 0.06), borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ width: '70%', height: '100%', bgcolor: color, borderRadius: 3 }} />
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mt: 1.5, display: 'block', fontSize: '0.75rem' }}>
          {subtitle}
        </Typography>
      </Box>
    </GlassCard>
  );
};

// ─── Custom Tooltip ─────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <Box sx={{
        bgcolor: 'background.paper', p: 1.5, borderRadius: 3,
        boxShadow: '0 10px 30px rgba(0,0,0,0.14)',
        border: '1px solid rgba(0,0,0,0.05)',
        backdropFilter: 'blur(10px)', minWidth: 130
      }}>
        {label && <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{label}</Typography>}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: payload[0]?.color || payload[0]?.fill || '#2196F3' }} />
          <Typography variant="body2" fontWeight={800}>{payload[0]?.value} Laporan</Typography>
        </Box>
      </Box>
    );
  }
  return null;
};

// ─── Time Range Helpers ─────────────────────────────────────────────────────────
const TIME_RANGES = [
  { key: '24h', label: '24H', hours: 24 },
  { key: '7d',  label: '7D',  hours: 24 * 7 },
  { key: '30d', label: '30D', hours: 24 * 30 },
  { key: 'all', label: 'Semua', hours: null },
];

const filterByRange = (items, rangeKey, dateField = 'createdAt') => {
  if (!items || !Array.isArray(items)) return [];
  const range = TIME_RANGES.find(r => r.key === rangeKey);
  if (!range || range.hours === null) return items;
  const now = new Date();
  const cutoff = new Date(now.getTime() - range.hours * 60 * 60 * 1000);
  
  return items.filter(item => {
    const itemDate = item[dateField] ? new Date(item[dateField]) : null;
    return itemDate && itemDate >= cutoff;
  });
};

const buildTrendData = (reports, rangeKey) => {
  const filtered = filterByRange(reports, rangeKey);
  const buckets = {};
  const isAll = rangeKey === 'all';
  
  filtered.forEach(r => {
    const d = new Date(r.createdAt);
    // If range is 'all', group by Month/Year to prevent overcrowding
    // Otherwise group by Day/Month
    const key = isAll 
      ? d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
      : `${d.getDate()}/${d.getMonth() + 1}`;
    buckets[key] = (buckets[key] || 0) + 1;
  });

  // Sort trend data by date if possible
  return Object.entries(buckets)
    .map(([date, count]) => ({ date, count }));
};

// ─── Main Component ─────────────────────────────────────────────────────────────
const AdminAnalyticsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { onMobileMenuClick } = useOutletContext() ?? {};
  
  const [loading, setLoading]           = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [, setReportStats] = useState(null);
  const [timeRange, setTimeRange]       = useState('all');

  const { reports, getAllReports } = useReportStore();

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch core dashboard and account stats
      const [dashboard, stats] = await Promise.all([getAdminDashboardStats(), getReportStats()]);
      setDashboardStats(dashboard);
      setReportStats(stats);
      
      // Ensure reports are loaded in the store for trend/status calculations
      // Admin should see ALL reports
      const { reports: storeReports } = useReportStore.getState();
      if (!storeReports || storeReports.length === 0) {
        await getAllReports();
      }
    } catch (e) {
      console.error('Analytics load error:', e);
    } finally {
      setLoading(false);
    }
  }, [getAllReports]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  // Filtered reports for time-range aware stats
  const filteredReports = useMemo(() => filterByRange(reports, timeRange), [reports, timeRange]);

  const filteredStats = useMemo(() => ({
    total:      filteredReports.length,
    pending:    filteredReports.filter(r => r.status === 'PENDING').length,
    inReview:   filteredReports.filter(r => r.status === 'IN_REVIEW').length,
    inProgress: filteredReports.filter(r => r.status === 'IN_PROGRESS').length,
    resolved:   filteredReports.filter(r => r.status === 'RESOLVED').length,
    rejected:   filteredReports.filter(r => r.status === 'REJECTED').length,
    canceled:   filteredReports.filter(r => r.status === 'CANCELED').length,
  }), [filteredReports]);

  const trendData = useMemo(() => buildTrendData(reports, timeRange), [reports, timeRange]);
  const topCategories = useMemo(() => dashboardStats?.categories?.topCategories || [], [dashboardStats]);

  const statusData = useMemo(() => [
    { name: 'Pending',    value: filteredStats.pending,    color: '#FFB74D' },
    { name: 'Review',     value: filteredStats.inReview,   color: '#64B5F6' },
    { name: 'Proses',     value: filteredStats.inProgress, color: '#9575CD' },
    { name: 'Selesai',    value: filteredStats.resolved,   color: '#81C784' },
    { name: 'Ditolak',    value: filteredStats.rejected,   color: '#E57373' },
    { name: 'Dibatalkan', value: filteredStats.canceled,   color: '#B0BEC5' },
  ].filter(d => d.value > 0), [filteredStats]);

  const resolutionRate = useMemo(() =>
    filteredStats.total > 0 ? ((filteredStats.resolved / filteredStats.total) * 100).toFixed(1) : 0,
    [filteredStats]);

  const userStatsData = useMemo(() => [
    { name: 'Terverifikasi',   value: dashboardStats?.users?.verified || 0,   color: '#4CAF50' },
    { name: 'Belum Verifikasi', value: dashboardStats?.users?.unverified || 0, color: '#FF9800' },
  ], [dashboardStats]);

  const CATEGORY_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) return <LoadingSpinner fullScreen message="Menganalisis data sistem..." />;

  return (
    <Fade in timeout={300}>
      <Box>

        <AdminSectionHeader
          title="Analitik & Wawasan"
          subtitle="Pantau performa sistem secara real-time"
          onMobileMenuClick={onMobileMenuClick}
          onRefresh={loadAnalytics}
          showNotifications={false}
          action={
            <GlassCard variant="glass" sx={{ p: 0.5, display: 'flex', gap: 0.5 }}>
              {TIME_RANGES.map(r => (
                <Button
                  key={r.key}
                  onClick={() => setTimeRange(r.key)}
                  size="small"
                  sx={{
                    minWidth: { xs: 48, sm: 56 },
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontSize: { xs: '0.72rem', sm: '0.78rem' },
                    fontWeight: 700,
                    px: { xs: 1.5, sm: 2 },
                    py: 0.8,
                    bgcolor: timeRange === r.key ? 'background.paper' : 'transparent',
                    color: timeRange === r.key ? 'primary.main' : 'text.secondary',
                    boxShadow: timeRange === r.key ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                    '&:hover': { bgcolor: timeRange === r.key ? 'background.paper' : alpha(theme.palette.primary.main, 0.06) }
                  }}
                >
                  {r.label}
                </Button>
              ))}
            </GlassCard>
          }
        />

        {/* ── KPI Cards (Responsive Grid: 4 Desktop, 2 Tablet, 1 Mobile) ── */}
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, md: 3 } }} alignItems="stretch">
          {[
            { title: 'Total Laporan',       value: filteredStats.total,      icon: <Assignment />,  color: '#2196F3', subtitle: 'Laporan Masuk' },
            { title: 'Tingkat Selesai',     value: `${resolutionRate}%`,    icon: <CheckCircle />, color: '#4CAF50', subtitle: `${filteredStats.resolved} Berhasil` },
            { title: 'Menunggu Review',     value: filteredStats.pending,    icon: <Warning />,     color: '#FFA726', subtitle: 'Butuh Tindakan' },
            { title: 'Total Mahasiswa',     value: dashboardStats?.users?.total || 0, icon: <People />, color: '#9C27B0', subtitle: 'Mahasiswa Aktif' },
          ].map((card, i) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
              <StatCard {...card} />
            </Grid>
          ))}
        </Grid>

        {/* ── Row 2: Status (Donut) | Kategori (Progress Bars) | User Verification (Bar) ── */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 2, md: 3 }, overflowX: 'hidden' }}>

          {/* Distribusi Status */}
          <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
            <GlassCard variant="glass" sx={{ 
              p: { xs: 2, md: 2.5 }, 
              height: '100%',
              minHeight: 320 // Further reduced height
            }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>Distribusi Status</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 2 }}>
                Komposisi tahapan laporan — {TIME_RANGES.find(r => r.key === timeRange)?.label}
              </Typography>

              {statusData.length === 0 ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary" variant="body2">Belum ada data</Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ height: 180, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} dataKey="value" cx="50%" cy="50%"
                          innerRadius={50} outerRadius={75} paddingAngle={4} cornerRadius={6} stroke="none"
                          animationBegin={0} animationDuration={1000}
                        >
                          {statusData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 4px 8px ${alpha(entry.color, 0.2)})` }} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                      <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: -1 }}>{filteredStats.total}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.6rem' }}>Total</Typography>
                    </Box>
                  </Box>
                  <Stack spacing={0.8} sx={{ mt: 0.5 }}>
                    {statusData.map((item, i) => (
                      <Box key={i}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: '0.6rem', noWrap: true }}>{item.name}</Typography>
                          </Box>
                          <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.65rem' }}>{item.value}</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={(item.value / (filteredStats.total || 1)) * 100}
                          sx={{ height: 4, borderRadius: 2, bgcolor: alpha(item.color, 0.08), '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 2 } }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </>
              )}
            </GlassCard>
          </Grid>

          {/* Kategori Terpopuler */}
          <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
            <GlassCard variant="glass" sx={{ 
              p: { xs: 2, md: 2.5 }, 
              height: '100%',
              minHeight: 320 // Further reduced height
            }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>Kategori Terpopuler</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 3 }}>Topik paling sering dilaporkan</Typography>
              {topCategories.length > 0 ? (
                <Stack spacing={2.5}>
                  {topCategories.slice(0, 5).map((cat, i) => {
                    const pct = (cat.reportCount / (topCategories[0]?.reportCount || 1)) * 100;
                    return (
                      <Box key={cat.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: '80%' }}>{cat.name}</Typography>
                          <Chip label={cat.reportCount} size="small" sx={{ height: 22, fontSize: '0.75rem', fontWeight: 800, bgcolor: alpha(CATEGORY_COLORS[i % CATEGORY_COLORS.length], 0.1), color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        </Box>
                        <LinearProgress variant="determinate" value={pct}
                          sx={{ height: 8, borderRadius: 4, bgcolor: alpha(CATEGORY_COLORS[i % CATEGORY_COLORS.length], 0.08),
                            '& .MuiLinearProgress-bar': { bgcolor: CATEGORY_COLORS[i % CATEGORY_COLORS.length], borderRadius: 4 } }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Category sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">Belum ada data kategori</Typography>
                </Box>
              )}
            </GlassCard>
          </Grid>

          {/* Status Verifikasi Mahasiswa */}
          <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
            <GlassCard variant="glass" sx={{ 
              p: { xs: 2, md: 2.5 }, 
              height: '100%',
              minHeight: 320 // Further reduced height
            }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>Status Akun Mahasiswa</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 2 }}>Verifikasi identitas pengguna</Typography>

              <Box sx={{ height: 180, mt: 0.5, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userStatsData} layout="vertical" margin={{ left: -20, right: 20, top: 5, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={90} axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 700, fill: theme.palette.text.primary }} />
                    <Tooltip cursor={{ fill: alpha(theme.palette.divider, 0.1) }} content={<ChartTooltip />} />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={28} animationDuration={1000}>
                      {userStatsData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Box sx={{ mt: 4, p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 3, border: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', width: 32, height: 32 }}>
                    <VerifiedUser sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Typography variant="body2" fontWeight={800} color="success.main">Kesehatan Sistem</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Sistem mencatat <b>{dashboardStats?.users?.verified || 0}</b> dari <b>{dashboardStats?.users?.total || 0}</b> mahasiswa telah menyelesaikan verifikasi.
                </Typography>
              </Box>
            </GlassCard>
          </Grid>
        </Grid>

        {/* ── Tren Pengaduan (Full Width, Bottom) ── */}
        <GlassCard variant="glass" sx={{ 
          p: { xs: 2, md: 2.5 }, 
          minHeight: 380 // Reduced trend chart height
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 40, height: 40, borderRadius: 2 }}>
                <Timeline sx={{ fontSize: 24 }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>Tren Pengaduan</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: 0.5 }}>
                  Statistik laporan — {TIME_RANGES.find(r => r.key === timeRange)?.label}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: alpha(theme.palette.primary.main, 0.04), px: 1.5, py: 0.5, borderRadius: 2 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
              <Typography variant="caption" fontWeight={800} color="primary.main">Jumlah</Typography>
            </Box>
          </Box>

          <Box sx={{ height: { xs: 240, sm: 260, md: 280 }, width: '100%' }}>
            {trendData.length === 0 ? (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Timeline sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Tidak ada aktivitas dalam periode ini</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={theme.palette.primary.main} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.08)} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false}
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12, fontWeight: 700 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false}
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12, fontWeight: 700 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" stroke={theme.palette.primary.main}
                    strokeWidth={4} fillOpacity={1} fill="url(#trendGrad)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Box>
        </GlassCard>

      </Box>
    </Fade>
  );
};

export default AdminAnalyticsPage;