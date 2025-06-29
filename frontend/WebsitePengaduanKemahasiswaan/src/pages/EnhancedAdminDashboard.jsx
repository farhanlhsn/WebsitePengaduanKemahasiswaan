import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Container, Paper, IconButton, Alert,
  Tabs, Tab, Fade, useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon, Notifications, Refresh, Settings
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

// Store imports
import useAuthStore from '../stores/authStore';
import useUserStore from '../stores/userStore';
import useReportStore from '../stores/reportStore';
import useCategoryStore from '../stores/categoryStore';

// Enhanced component imports
import EnhancedAdminSidebar from '../components/admin/EnhancedAdminSidebar';
import AdminDashboardStats from '../components/admin/AdminDashboardStats';
import AdminDataTable from '../components/admin/AdminDataTable';
import ChatInterface from '../components/chat/ChatInterface';
import StatusChart from '../components/dashboard/StatusChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const drawerWidth = 280;

const EnhancedAdminDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuthStore();
  
  // Store hooks
  const { 
    users, 
    stats: userStats, 
    loading: userLoading, 
    error: userError,
    getAllUsers, 
    getUserStats, 
    verifyStudent, 
    deleteUser, 
    restoreUser,
    updateUser,
  } = useUserStore();
  
  const { 
    reports, 
    loading: reportLoading, 
    getAllReports, 
    updateReportStatus, 
    deleteReport, 
    restoreReport 
  } = useReportStore();
  
  const { categories, getCategories } = useCategoryStore();

  // Local state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [selectedChatReport, setSelectedChatReport] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          getAllUsers(true),
          getUserStats(),
          getAllReports({}, false),
          getCategories()
        ]);
      } catch (error) {
        console.error('Failed to load admin data:', error);
      }
    };

    if (user?.role === 'ADMIN') {
      loadData();
    }
  }, [user, getAllUsers, getUserStats, getAllReports, getCategories]);

  // Handler functions
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleRefreshData = async () => {
    try {
      await Promise.all([
        getAllUsers(true),
        getUserStats(),
        getAllReports({}, false),
        getCategories()
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  // Calculate enhanced statistics
  const reportStats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'PENDING').length,
    inProgress: reports.filter(r => ['IN_REVIEW', 'IN_PROGRESS'].includes(r.status)).length,
    resolved: reports.filter(r => r.status === 'RESOLVED').length,
    resolutionRate: reports.length > 0 ? Math.round((reports.filter(r => r.status === 'RESOLVED').length / reports.length) * 100) : 0
  };

  const systemStats = {
    avgResponseTime: '2.5',
    unreadMessages: 12,
    uptime: '99.8'
  };

  const sidebarStats = {
    pendingVerifications: userStats?.unverified || 0,
    pendingReports: reportStats.pending,
    unreadMessages: systemStats.unreadMessages
  };

  // Prepare chart data
  const chartData = [
    { name: 'Menunggu', value: reportStats.pending, color: '#FFC107' },
    { name: 'Ditinjau', value: reports.filter(r => r.status === 'IN_REVIEW').length, color: '#2196F3' },
    { name: 'Diproses', value: reports.filter(r => r.status === 'IN_PROGRESS').length, color: '#FF9800' },
    { name: 'Selesai', value: reportStats.resolved, color: '#4CAF50' },
    { name: 'Ditolak', value: reports.filter(r => r.status === 'REJECTED').length, color: '#F44336' },
    { name: 'Dibatalkan', value: reports.filter(r => r.status === 'CANCELED').length, color: '#9E9E9E' }
  ].filter(item => item.value > 0);

  // Table configurations
  const userTableColumns = [
    { field: 'name', headerName: 'Nama', type: 'avatar', sortable: true },
    { field: 'email', headerName: 'Email', sortable: true },
    { field: 'nim', headerName: 'NIM', sortable: true },
    { field: 'role', headerName: 'Role', type: 'chip', chipColor: 'primary', sortable: true },
    { field: 'isVerified', headerName: 'Status', type: 'boolean', sortable: true },
    { field: 'createdAt', headerName: 'Tanggal Daftar', type: 'date', sortable: true }
  ];

  const reportTableColumns = [
    { field: 'registrationNumber', headerName: 'No. Registrasi', sortable: true },
    { field: 'title', headerName: 'Judul', sortable: true, maxLength: 50 },
    { field: 'status', headerName: 'Status', type: 'status', sortable: true },
    { field: 'category', headerName: 'Kategori', sortable: true },
    { field: 'user', headerName: 'Pelapor', sortable: true },
    { field: 'createdAt', headerName: 'Tanggal', type: 'date', sortable: true }
  ];

  const userTableActions = [
    { id: 'view', label: 'Lihat Detail', icon: <IconButton size="small"><Notifications /></IconButton> },
    { id: 'verify', label: 'Verifikasi', icon: <IconButton size="small"><Settings /></IconButton> },
    { id: 'edit', label: 'Edit', icon: <IconButton size="small"><Settings /></IconButton> },
    { id: 'delete', label: 'Hapus', icon: <IconButton size="small"><Settings /></IconButton> }
  ];

  const reportTableActions = [
    { id: 'view', label: 'Lihat Detail', icon: <IconButton size="small"><Notifications /></IconButton> },
    { id: 'chat', label: 'Chat', icon: <IconButton size="small"><Settings /></IconButton> },
    { id: 'status', label: 'Update Status', icon: <IconButton size="small"><Settings /></IconButton> },
    { id: 'delete', label: 'Hapus', icon: <IconButton size="small"><Settings /></IconButton> }
  ];

  const handleUserAction = async (action, user) => {
    switch (action) {
      case 'verify':
        await verifyStudent(user.id);
        break;
      case 'delete':
        await deleteUser(user.id);
        break;
      case 'restore':
        await restoreUser(user.id);
        break;
      default:
        console.log(`Action ${action} for user:`, user);
    }
  };

  const handleReportAction = async (action, report) => {
    switch (action) {
      case 'chat':
        setSelectedChatReport(report);
        setActiveMenu('chat');
        break;
      case 'delete':
        await deleteReport(report.id);
        break;
      case 'restore':
        await restoreReport(report.id);
        break;
      default:
        console.log(`Action ${action} for report:`, report);
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <Fade in timeout={300}>
            <Box>
              {/* Header */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <IconButton
                      color="inherit"
                      edge="start"
                      onClick={handleDrawerToggle}
                      sx={{ display: { sm: 'none' }, mr: 2 }}
                    >
                      <MenuIcon />
                    </IconButton>
                    <Typography variant="h3" fontWeight={800} sx={{ 
                      letterSpacing: '-0.02em', 
                      mb: 1,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      Dashboard Overview
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Ringkasan sistem dan statistik keseluruhan
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={handleRefreshData}>
                      <Refresh />
                    </IconButton>
                    <IconButton>
                      <Notifications />
                    </IconButton>
                  </Box>
                </Box>
              </Box>

              {/* Statistics Cards */}
              <AdminDashboardStats
                userStats={userStats}
                reportStats={reportStats}
                systemStats={systemStats}
                loading={userLoading || reportLoading}
              />

              {/* Charts and Analytics */}
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} lg={8}>
                  <StatusChart data={chartData} />
                </Grid>
                <Grid item xs={12} lg={4}>
                  <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Aktivitas Terbaru
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ringkasan aktivitas sistem dalam 24 jam terakhir
                    </Typography>
                    {/* Add recent activity list here */}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        );

      case 'users':
        return (
          <Fade in timeout={300}>
            <Box>
              <Box sx={{ mb: 4 }}>
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ display: { sm: 'none' }, mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h3" fontWeight={800} sx={{ 
                  letterSpacing: '-0.02em', 
                  mb: 1,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Manajemen Pengguna
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Kelola pengguna, verifikasi, dan hak akses sistem
                </Typography>
              </Box>

              <AdminDataTable
                data={users}
                columns={userTableColumns}
                loading={userLoading}
                totalCount={users.length}
                onRowAction={handleUserAction}
                actions={userTableActions}
                title="Daftar Pengguna"
                searchPlaceholder="Cari pengguna..."
                selectable
                exportable
                refreshable
                onRefresh={handleRefreshData}
                filters={[
                  {
                    field: 'role',
                    label: 'Role',
                    options: [
                      { value: 'MAHASISWA', label: 'Mahasiswa' },
                      { value: 'ADMIN', label: 'Admin' }
                    ]
                  },
                  {
                    field: 'isVerified',
                    label: 'Status Verifikasi',
                    options: [
                      { value: true, label: 'Terverifikasi' },
                      { value: false, label: 'Belum Verifikasi' }
                    ]
                  }
                ]}
              />
            </Box>
          </Fade>
        );

      case 'reports':
        return (
          <Fade in timeout={300}>
            <Box>
              <Box sx={{ mb: 4 }}>
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ display: { sm: 'none' }, mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h3" fontWeight={800} sx={{ 
                  letterSpacing: '-0.02em', 
                  mb: 1,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Manajemen Laporan
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Kelola dan tindak lanjuti semua laporan pengaduan
                </Typography>
              </Box>

              <AdminDataTable
                data={reports.map(report => ({
                  ...report,
                  category: report.category?.name || 'Tanpa Kategori',
                  user: report.user?.name || 'Anonim'
                }))}
                columns={reportTableColumns}
                loading={reportLoading}
                totalCount={reports.length}
                onRowAction={handleReportAction}
                actions={reportTableActions}
                title="Daftar Laporan"
                searchPlaceholder="Cari laporan..."
                selectable
                exportable
                refreshable
                onRefresh={handleRefreshData}
                filters={[
                  {
                    field: 'status',
                    label: 'Status',
                    options: [
                      { value: 'PENDING', label: 'Menunggu' },
                      { value: 'IN_REVIEW', label: 'Ditinjau' },
                      { value: 'IN_PROGRESS', label: 'Diproses' },
                      { value: 'RESOLVED', label: 'Selesai' },
                      { value: 'REJECTED', label: 'Ditolak' },
                      { value: 'CANCELED', label: 'Dibatalkan' }
                    ]
                  }
                ]}
              />
            </Box>
          </Fade>
        );

      case 'chat':
        return (
          <Fade in timeout={300}>
            <Box>
              <Box sx={{ mb: 4 }}>
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ display: { sm: 'none' }, mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h3" fontWeight={800} sx={{ 
                  letterSpacing: '-0.02em', 
                  mb: 1,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Chat & Komunikasi
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Komunikasi langsung dengan pelapor berdasarkan laporan
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                  <ChatInterface
                    reportId={selectedChatReport?.id}
                    reportTitle={selectedChatReport?.title}
                    messages={selectedChatReport?.messages || []}
                    currentUser={user}
                    placeholder={!selectedChatReport}
                    onSendMessage={(message) => {
                      console.log('Send message:', message);
                      // Implement send message logic
                    }}
                    onSendFile={(file, message) => {
                      console.log('Send file:', file, message);
                      // Implement send file logic
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} lg={4}>
                  <Paper sx={{ p: 3, borderRadius: 4 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Laporan Aktif
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Pilih laporan untuk memulai komunikasi
                    </Typography>
                    
                    {/* List of reports for chat selection */}
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                      {reports.slice(0, 10).map((report) => (
                        <Box
                          key={report.id}
                          sx={{
                            p: 2,
                            mb: 1,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: selectedChatReport?.id === report.id ? 'primary.main' : 'divider',
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'grey.50'
                            }
                          }}
                          onClick={() => setSelectedChatReport(report)}
                        >
                          <Typography variant="body2" fontWeight={500} noWrap>
                            {report.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            #{report.registrationNumber}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        );

      default:
        return (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" color="text.secondary">
              Menu "{activeMenu}" sedang dalam pengembangan
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Fitur ini akan segera tersedia
            </Typography>
          </Box>
        );
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <Box sx={{ display: 'flex', bgcolor: '#f5f7fa', minHeight: '100vh' }}>
        <Box sx={{ p: 3, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Alert severity="error">Akses ditolak. Halaman ini khusus untuk administrator.</Alert>
        </Box>
      </Box>
    );
  }

  if (userLoading && !users.length) {
    return <LoadingSpinner fullScreen message="Memuat dashboard admin..." />;
  }

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Enhanced Sidebar */}
      <Box
        component="nav"
        sx={{ 
          width: { sm: drawerWidth }, 
          flexShrink: { sm: 0 },
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <EnhancedAdminSidebar 
          open={mobileOpen} 
          onClose={handleDrawerToggle}
          drawerWidth={drawerWidth}
          activeMenu={activeMenu}
          onMenuChange={setActiveMenu}
          stats={sidebarStats}
        />
      </Box>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: '#f8f9fa',
          maxWidth: '100%',
          overflow: 'hidden'
        }}
      >
        {renderContent()}

        {/* Error Alerts */}
        {(userError || reportLoading) && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 3,
              borderRadius: 2,
            }}
          >
            {userError || 'Terjadi kesalahan saat memuat data'}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default EnhancedAdminDashboard;