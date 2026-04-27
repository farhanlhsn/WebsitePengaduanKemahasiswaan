import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, IconButton, Alert, Fade, Grid
} from '@mui/material';
import {
  Menu as MenuIcon, Notifications, Refresh, Visibility, Edit, CheckCircle, Delete, Restore
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';

// Store imports
import useAuthStore from '../stores/authStore';
import useUserStore from '../stores/userStore';
import useReportStore from '../stores/reportStore';
import useCategoryStore from '../stores/categoryStore';
import useChatStore from '../stores/chatStore';

// Sidebar khusus untuk Admin
import AdminSidebar from '../components/admin/EnhancedAdminSidebar'; 

// Component imports
import AdminDashboardStats from '../components/admin/AdminDashboardStats';
import AdminDataTable from '../components/admin/AdminDataTable';
import ChatInterface from '../components/chat/ChatInterface';
import ChatList from '../components/chat/ChatList';
import StatusChart from '../components/dashboard/StatusChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import UserDetailModal from '../components/admin/UserDetailModal';
import UserStatistics from '../components/admin/UserStatistics';
import AdminNotifications from '../components/admin/AdminNotifications';
import HelpPage from './HelpPage';

// Utils imports
import { exportUsersToExcel, generateUserReport } from '../utils/exportUtils';

const drawerWidth = 280;

const EnhancedAdminDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  
  // Store hooks - HAPUS getUserStats dari destrukturisasi
  const { users, stats: userStats, loading: userLoading, error: userError, getAllUsers, verifyStudent, deleteUser, restoreUser } = useUserStore();
  const { reports, loading: reportLoading, error: reportError, getAllReports, deleteReport, restoreReport } = useReportStore();
  const { getCategories } = useCategoryStore();
  const { selectReport } = useChatStore();

  // Local state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebar-open-admin');
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  // Check if user is admin
  useEffect(() => {
    if (user && user.role === 'MAHASISWA') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Load data on component mount - HAPUS pemanggilan getUserStats
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      const loadData = async () => {
        try {
          await Promise.all([
            getAllUsers(true),
            getAllReports({}, false),
            getCategories()
          ]);
        } catch (error) {
          console.error('Failed to load admin data:', error);
        }
      };
      loadData();
    }
  }, [user?.role, getAllUsers, getAllReports, getCategories]);

  // Sync active menu from route
  useEffect(() => {
    if (location.pathname.startsWith('/admin/chat')) {
      setActiveMenu('chat');
    } else if (location.pathname.startsWith('/admin/reports')) {
      setActiveMenu('reports');
    } else if (location.pathname.startsWith('/admin/users')) {
      setActiveMenu('users');
    } else if (location.pathname.startsWith('/admin/help')) {
      setActiveMenu('help');
    } else if (location.pathname.startsWith('/admin')) {
      setActiveMenu('dashboard');
    }
  }, [location.pathname]);

  // Handler functions
  const handleDrawerToggle = useCallback(() => setMobileOpen(!mobileOpen), [mobileOpen]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar-open-admin', JSON.stringify(newState));
      return newState;
    });
  }, []);

  const handleRefreshData = useCallback(async () => {
    try {
      await Promise.all([
        getAllUsers(true),
        getAllReports({}, false),
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, [getAllUsers, getAllReports]);

  // Memoized statistics
  const reportStats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => r.status === 'PENDING').length,
    inProgress: reports.filter(r => ['IN_REVIEW', 'IN_PROGRESS'].includes(r.status)).length,
    resolved: reports.filter(r => r.status === 'RESOLVED').length,
  }), [reports]);
  
  // Process users to include computed status
  const processedUsers = useMemo(() => {
    return users.map(user => ({
      ...user,
      // Compute a 'status' field for the table
      status: user.deletedAt 
        ? 'DELETED' 
        : (user.isVerified ? 'ACTIVE' : 'PENDING')
    }));
  }, [users]);

  const systemStats = useMemo(() => ({
    avgResponseTime: '2.5h',
    uptime: '99.8%',
  }), []);

  const chartData = useMemo(() => [
    { name: 'Menunggu', value: reportStats.pending, color: theme.palette.warning.main },
    { name: 'Ditinjau', value: reports.filter(r => r.status === 'IN_REVIEW').length, color: theme.palette.info.main },
    { name: 'Diproses', value: reports.filter(r => r.status === 'IN_PROGRESS').length, color: theme.palette.secondary.main },
    { name: 'Selesai', value: reportStats.resolved, color: theme.palette.success.main },
    { name: 'Ditolak', value: reports.filter(r => r.status === 'REJECTED').length, color: theme.palette.error.main },
    { name: 'Dibatalkan', value: reports.filter(r => r.status === 'CANCELED').length, color: theme.palette.grey[500] }
  ].filter(item => item.value > 0), [reports, reportStats, theme]);

  // Table configurations
  const userTableColumns = useMemo(() => [
    { field: 'name', headerName: 'Nama', sortable: true },
    { field: 'nim', headerName: 'NIM', sortable: true },
    { field: 'email', headerName: 'Email', sortable: true, maxLength: 30 },
    { field: 'status', headerName: 'Status', type: 'status', sortable: true },
    { field: 'isVerified', headerName: 'Terverifikasi', type: 'boolean', sortable: true },
    { field: 'role', headerName: 'Role', type: 'chip', chipColor: 'primary', sortable: true },
    { field: 'createdAt', headerName: 'Tanggal Daftar', type: 'date', sortable: true }
  ], []);

  const userTableActions = useMemo(() => [
    { id: 'view', label: 'Lihat Detail', icon: <Visibility /> },
    { id: 'edit', label: 'Edit Pengguna', icon: <Edit /> },
    { id: 'verify', label: 'Verifikasi', icon: <CheckCircle /> },
    { id: 'delete', label: 'Hapus', icon: <Delete /> },
    { id: 'restore', label: 'Restore', icon: <Restore /> }
  ], []);

  const userTableFilters = useMemo(() => [
    { field: 'status', label: 'Status', options: [
      { value: 'ACTIVE', label: 'Aktif' },
      { value: 'INACTIVE', label: 'Tidak Aktif' },
      { value: 'DELETED', label: 'Dihapus' }
    ]},
    { field: 'isVerified', label: 'Verifikasi', options: [
      { value: 'true', label: 'Terverifikasi' },
      { value: 'false', label: 'Belum Terverifikasi' }
    ]},
    { field: 'role', label: 'Role', options: [
      { value: 'MAHASISWA', label: 'Mahasiswa' },
      { value: 'ADMIN', label: 'Admin' }
    ]}
  ], []);

  const reportTableColumns = useMemo(() => [
    { field: 'title', headerName: 'Judul', sortable: true },
    { field: 'status', headerName: 'Status', type: 'status', sortable: true },
    { field: 'category', headerName: 'Kategori', sortable: true },
    { field: 'user', headerName: 'Pelapor', sortable: true },
    { field: 'createdAt', headerName: 'Tanggal', type: 'date', sortable: true }
  ], []);

  const reportTableActions = useMemo(() => [
    { id: 'detail', label: 'Lihat Detail', icon: <Visibility /> },
  ], []);

  const handleUserAction = useCallback(async (action, user) => {
    try {
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
        case 'view':
          setSelectedUser(user);
          setUserDetailModalOpen(true);
          break;
        case 'edit':
          // TODO: Implement user edit modal
          console.log('Edit user:', user);
          break;
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('Failed to perform user action:', error);
    }
  }, [verifyStudent, deleteUser, restoreUser]);

  const handleUserDetailAction = useCallback(async (action, user) => {
    try {
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
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('Failed to perform user action:', error);
    }
  }, [verifyStudent, deleteUser, restoreUser]);

  const handleBulkUserAction = useCallback(async (action, selectedUsers) => {
    try {
      const promises = selectedUsers.map(userId => {
        switch (action) {
          case 'verify':
            return verifyStudent(userId);
          case 'delete':
            return deleteUser(userId);
          case 'restore':
            return restoreUser(userId);
          default:
            return Promise.resolve();
        }
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to perform bulk user action:', error);
    }
  }, [verifyStudent, deleteUser, restoreUser]);

  const handleReportAction = useCallback(async (action, report) => {
    if (action === 'detail') {
      navigate(`/admin/reports/${report.id}`);
      return;
    }
    if (action === 'chat') {
      selectReport(report);
      setActiveMenu('chat');
      navigate('/admin/chat');
      return;
    }
    if (action === 'delete') await deleteReport(report.id);
    if (action === 'restore') await restoreReport(report.id);
  }, [selectReport, deleteReport, restoreReport, navigate]);
  
  const handleExportUsers = useCallback(() => {
    try {
      exportUsersToExcel(users);
    } catch (error) {
      console.error('Failed to export users:', error);
    }
  }, [users]);

  const renderContent = () => {
    const commonHeader = (title, subtitle) => (
       <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box>
                  <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ display: { sm: 'none' }, mr: 2 }}><MenuIcon /></IconButton>
                  <Typography variant="h3" fontWeight={800}>{title}</Typography>
                  <Typography variant="body1" color="text.secondary">{subtitle}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={handleRefreshData}><Refresh /></IconButton>
                  <IconButton><Notifications /></IconButton>
              </Box>
          </Box>
      </Box>
    );

    switch (activeMenu) {
      case 'dashboard':
        return (
          <Fade in timeout={300}>
            <Box>
              {commonHeader('Dashboard', 'Ringkasan sistem dan statistik keseluruhan')}
              <AdminDashboardStats userStats={userStats} reportStats={reportStats} systemStats={systemStats} loading={userLoading || reportLoading} />
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid 
                  xs={12} 
                  lg={8} 
                  xl={9}
                  sx={{
                    '@media (min-width: 1920px)': {
                      minHeight: 500
                    }
                  }}
                >
                  <StatusChart data={chartData} />
                </Grid>
                <Grid 
                  xs={12} 
                  lg={4} 
                  xl={3}
                  sx={{
                    '@media (min-width: 1920px)': {
                      minHeight: 500
                    }
                  }}
                >
                  <AdminNotifications 
                    users={users} 
                    reports={reports} 
                    loading={userLoading || reportLoading} 
                  />
                </Grid>
              </Grid>
            </Box>
          </Fade>
        );
      case 'users':
        return (
          <Fade in timeout={300}>
            <Box>
              {commonHeader('Manajemen Pengguna', 'Kelola pengguna dan verifikasi')}
              
              {/* User Statistics Cards */}
              <UserStatistics users={users} loading={userLoading} />

              <AdminDataTable 
                data={processedUsers} 
                columns={userTableColumns} 
                loading={userLoading} 
                onRowAction={handleUserAction}
                onBulkAction={handleBulkUserAction}
                actions={userTableActions}
                filters={userTableFilters}
                title="Daftar Pengguna"
                searchPlaceholder="Cari nama, NIM, atau email..."
                selectable={true}
                exportable={true}
                refreshable={true}
                onRefresh={handleRefreshData}
                onExport={handleExportUsers}
              />
            </Box>
          </Fade>
        );
      case 'reports':
        return (
          <Fade in timeout={300}>
            <Box>
              {commonHeader('Manajemen Laporan', 'Kelola dan tindak lanjuti semua laporan pengaduan')}
              <AdminDataTable 
                data={reports.map(r => ({ ...r, category: r.category?.name, user: r.user?.name }))}
                columns={reportTableColumns}
                loading={reportLoading}
                onRowAction={handleReportAction}
                actions={reportTableActions}
                title="Daftar Laporan" 
              />
            </Box>
          </Fade>
        );
      case 'chat':
        return (
          <Fade in timeout={300}>
            <Box>
              {commonHeader('Chat & Komunikasi', 'Komunikasi langsung dengan pelapor')}
              <Grid container spacing={3} sx={{ height: 'calc(100vh - 220px)' }}>
                <Grid 
                  xs={12} 
                  lg={4} 
                  xl={3}
                  sx={{
                    '@media (min-width: 1920px)': {
                      minHeight: 600
                    }
                  }}
                >
                  <ChatList onReportSelect={selectReport} />
                </Grid>
                <Grid 
                  xs={12} 
                  lg={8} 
                  xl={9}
                  sx={{
                    '@media (min-width: 1920px)': {
                      minHeight: 600
                    }
                  }}
                >
                  <ChatInterface />
                </Grid>
              </Grid>
            </Box>
          </Fade>
        );
      case 'help':
        return (
          <Fade in timeout={300}>
            <Box>
              {commonHeader('Pusat Bantuan', 'Temukan jawaban untuk pertanyaan Anda dengan cepat')}
              <HelpPage isEmbedded={true} />
            </Box>
          </Fade>
        );
      default:
        return (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5">Menu "{activeMenu}" sedang dalam pengembangan.</Typography>
          </Box>
        );
    }
  };

  if (user?.role === 'MAHASISWA') {
    return <LoadingSpinner fullScreen message="Mengalihkan..." />;
  }

  if (userLoading && !users.length) {
    return <LoadingSpinner fullScreen message="Memuat dashboard admin..." />;
  }

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <AdminSidebar 
        open={mobileOpen} 
        onClose={handleDrawerToggle}
        drawerWidth={drawerWidth}
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={handleSidebarToggle}
      />
      
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflowY: 'auto' }}>
          {renderContent()}
          {(userError || reportError) && (
            <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
              {userError || reportError || 'Terjadi kesalahan saat memuat data'}
            </Alert>
          )}
        </Box>
      </Box>
      
      {/* User Detail Modal */}
      <UserDetailModal
        open={userDetailModalOpen}
        onClose={() => {
          setUserDetailModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onAction={handleUserDetailAction}
      />
    </Box>
  );
};

export default EnhancedAdminDashboard;