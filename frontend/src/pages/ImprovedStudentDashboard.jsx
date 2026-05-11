import React, { useEffect, Suspense, useState, useCallback, useMemo, useRef } from 'react';
import {
  Box, Typography, Alert, IconButton, Container
} from '@mui/material';
import Grid from '@mui/material/Grid'; // Impor Grid yang benar
import { 
  Assignment, CheckCircle, HourglassEmpty, PendingActions, 
  Menu as MenuIcon, Notifications 
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useReportStore from '../stores/reportStore';
import useCategoryStore from '../stores/categoryStore';
import useUserStore from '../stores/userStore';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';

const StudentSidebar = React.lazy(() => import('../components/dashboard/StudentSidebar'));
const EnhancedStatCard = React.lazy(() => import('../components/dashboard/EnhancedStatCard'));
const ImprovedReportsTable = React.lazy(() => import('../components/dashboard/ImprovedReportsTable'));
const CreateReportModal = React.lazy(() => import('../components/dashboard/CreateReportModal'));
const ChatList = React.lazy(() => import('../components/chat/ChatList'));
const ChatInterface = React.lazy(() => import('../components/chat/ChatInterface'));

import LoadingSpinner from '../components/ui/LoadingSpinner';

const drawerWidth = 300;

export default React.memo(function ImprovedStudentDashboard() {
  // ... (semua hooks dan state tetap sama) ...
  const theme = useTheme();
  const { reports, loading, error, getUserReports, pagination, reset, createReport } = useReportStore();
  const { categories, getCategories } = useCategoryStore();
  const { userStats, getUserStatsById } = useUserStore();
  const { user } = useAuthStore();
  const { selectReport } = useChatStore();

  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebar-open');
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  const safeUserStats = userStats || { total: 0, approved: 0, pending: 0, inProgress: 0, resolved: 0 };
  const totalReports = Number(safeUserStats.total) || 0;
  const completedReports = Number(safeUserStats.resolved || 0);
  const inProgressReports = Number(safeUserStats.inProgress || 0);
  const pendingReports = Number(safeUserStats.pending || 0);
  const completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;

  const memoizedStats = useMemo(() => ({
    totalReports, completedReports, inProgressReports, pendingReports, completionRate
  }), [safeUserStats, totalReports, completedReports, inProgressReports, pendingReports, completionRate]);

  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      getUserReports();
      getCategories();
      getUserStatsById(user.id);
    }
  }, [user?.id, getUserReports, getCategories, getUserStatsById]);

  // ... (semua handler tetap sama) ...
  const fetchFilteredReports = useCallback((status, categoryId, search) => {
    reset();
    const filters = {};
    if (status) filters.status = status;
    if (categoryId) filters.categoryId = categoryId;
    if (search) filters.search = search;
    getUserReports(filters, false);
  }, [reset, getUserReports]);

  const handleStatusChange = useCallback((e) => {
    const value = e.target.value;
    setStatusFilter(value);
    fetchFilteredReports(value, categoryFilter, searchQuery);
  }, [categoryFilter, searchQuery, fetchFilteredReports]);

  const handleCategoryChange = useCallback((e) => {
    const value = e.target.value;
    setCategoryFilter(value);
    fetchFilteredReports(statusFilter, value, searchQuery);
  }, [statusFilter, searchQuery, fetchFilteredReports]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchFilteredReports(statusFilter, categoryFilter, value);
    }, 500);
  }, [statusFilter, categoryFilter, fetchFilteredReports]);

  const handleLoadMore = useCallback(() => {
    getUserReports({}, true);
  }, [getUserReports]);

  const handleDrawerToggle = useCallback(() => setMobileOpen(!mobileOpen), [mobileOpen]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar-open', JSON.stringify(newState));
      return newState;
    });
  }, []);

  const handleCreateReport = useCallback(async (formData) => {
    try {
      const createdReport = await createReport(formData);
      setModalOpen(false);
      getUserReports();
      getUserStatsById(user.id);
      return createdReport;
    } catch (error) {
      console.error('Failed to create report:', error);
      throw error;
    }
  }, [createReport, getUserReports, getUserStatsById, user?.id]);


  if (loading && reports.length === 0) {
    return <LoadingSpinner fullScreen message="Memuat dashboard..." />;
  }

  const renderContent = () => {
    // ... (commonHeader tetap sama) ...
    const commonHeader = (title, subtitle) => (
      <Box sx={{ mb: 4, px: { xs: 2, sm: 0 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ display: { sm: 'none' }, mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h3" fontWeight={800} sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>{title}</Typography>
            <Typography variant="body1" color="text.secondary">{subtitle}</Typography>
          </Box>
        </Box>
      </Box>
    );

    switch (activeMenu) {
      case 'dashboard':
        return (
          <>
            {commonHeader('Dashboard', 'Selamat datang kembali! Berikut ringkasan laporan Anda.')}
            <Box sx={{ px: { xs: 2, sm: 0 }, mb: 4 }}>
              {/* --- GRID YANG SUDAH DIPERBAIKI --- */}
              <Grid container spacing={3} sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', // Membuat kolom yang fleksibel
                gridGap: '20px'
              }}>
                <Grid item xs={12} sm={6} lg={3}>
                  <EnhancedStatCard title="Total Laporan" value={memoizedStats.totalReports} icon={<Assignment />} color="#2E7D32" animateValue />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                  <EnhancedStatCard title="Menunggu" value={memoizedStats.pendingReports} icon={<PendingActions />} color="#FF9800" animateValue />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                  <EnhancedStatCard title="Diproses" value={memoizedStats.inProgressReports} icon={<HourglassEmpty />} color="#2196F3" animateValue />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                  <EnhancedStatCard title="Selesai" value={memoizedStats.completedReports} icon={<CheckCircle />} color="#4CAF50" animateValue showProgress progressValue={memoizedStats.completionRate} />
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ width: '100%', mx: 0, px: { xs: 0, sm: 0 } }}>
              <Suspense fallback={<LoadingSpinner />}>
                <ImprovedReportsTable reports={reports} loading={loading} categories={categories} statusFilter={statusFilter} categoryFilter={categoryFilter} searchQuery={searchQuery} onStatusChange={handleStatusChange} onCategoryChange={handleCategoryChange} onSearchChange={handleSearchChange} onLoadMore={handleLoadMore} hasNextPage={pagination.hasNextPage} onCreateReport={() => setModalOpen(true)} />
              </Suspense>
            </Box>
          </>
        );
      // ... (case 'reports' dan 'chat' tetap sama) ...
      case 'reports':
        return (
          <>
            {commonHeader('Laporan Saya', 'Kelola dan pantau semua laporan yang telah Anda buat.')}
            <Box sx={{ width: '100%', mx: 0 }}>
              <Suspense fallback={<LoadingSpinner />}>
                <ImprovedReportsTable reports={reports} loading={loading} categories={categories} statusFilter={statusFilter} categoryFilter={categoryFilter} searchQuery={searchQuery} onStatusChange={handleStatusChange} onCategoryChange={handleCategoryChange} onSearchChange={handleSearchChange} onLoadMore={handleLoadMore} hasNextPage={pagination.hasNextPage} onCreateReport={() => setModalOpen(true)} />
              </Suspense>
            </Box>
          </>
        );
      case 'chat':
        return (
          <>
            {commonHeader('Chat & Komunikasi', 'Komunikasi langsung dengan admin untuk laporan Anda.')}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, height: { lg: 'calc(100vh - 200px)' }, px: { xs: 2, sm: 0 } }}>
              <Box sx={{ width: { xs: '100%', lg: '350px' }, flexShrink: 0 }}>
                <Suspense fallback={<LoadingSpinner />}><ChatList onReportSelect={selectReport} /></Suspense>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Suspense fallback={<LoadingSpinner />}><ChatInterface /></Suspense>
              </Box>
            </Box>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'grey.100' }}>
      <Suspense fallback={<div style={{ width: drawerWidth }} />}>
        <StudentSidebar 
          open={mobileOpen} 
          onClose={handleDrawerToggle}
          drawerWidth={drawerWidth}
          onCreateReport={() => setModalOpen(true)}
          activeMenu={activeMenu}
          onMenuChange={setActiveMenu}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={handleSidebarToggle}
        />
      </Suspense>
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, overflowY: 'auto', bgcolor: 'background.default' }}>
          {renderContent()}
          {error && <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>{error}</Alert>}
        </Box>
      </Box>
      <Suspense fallback={<div />}>
        <CreateReportModal open={modalOpen} onClose={() => setModalOpen(false)} categories={categories} onSubmit={handleCreateReport} />
      </Suspense>
    </Box>
  );
});