import React, { useEffect, Suspense } from 'react';
import {
  Box, Typography, Alert, IconButton, Grid, Container
} from '@mui/material';
import { 
  Assignment, CheckCircle, HourglassEmpty, PendingActions, 
  Menu as MenuIcon, Notifications 
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useReportStore from '../stores/reportStore';
import useCategoryStore from '../stores/categoryStore';
import useUserStore from '../stores/userStore';
import useAuthStore from '../stores/authStore';

// Lazy load heavy components
const DashboardSidebar = React.lazy(() => import('../components/dashboard/Sidebar'));
const EnhancedStatCard = React.lazy(() => import('../components/dashboard/EnhancedStatCard'));
const ImprovedReportsTable = React.lazy(() => import('../components/dashboard/ImprovedReportsTable'));
const CreateReportModal = React.lazy(() => import('../components/dashboard/CreateReportModal'));

// Import lightweight components normally
import LoadingSpinner from '../components/ui/LoadingSpinner';

const drawerWidth = 280;

export default React.memo(function ImprovedStudentDashboard() {
  const theme = useTheme();
  const { reports, loading, error, getUserReports, pagination, reset, createReport } = useReportStore();
  const { categories, getCategories } = useCategoryStore();
  const { userStats, getUserStatsById } = useUserStore();
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [activeMenu, setActiveMenu] = React.useState('dashboard');

  // Statistics with enhanced calculations
  // These stats should remain constant regardless of filtering - they represent overall user statistics
  const safeUserStats = userStats || {
    total: 0,
    approved: 0, // This maps to RESOLVED status from backend
    pending: 0,  // This maps to PENDING status from backend
    rejected: 0, // This maps to REJECTED status from backend
    inReview: 0, // This maps to IN_REVIEW status from backend
    inProgress: 0, // This maps to IN_PROGRESS status from backend
    resolved: 0, // This maps to RESOLVED status from backend
    canceled: 0  // This maps to CANCELED status from backend
  };
  
  // Debug log to track userStats changes
  React.useEffect(() => {
    if (userStats) {
      console.log('userStats changed:', userStats);
    }
  }, [userStats]);
  
  // Ensure stats are calculated consistently and don't change with filtering
  const totalReports = Number(safeUserStats.total) || 0;
  const completedReports = Number(safeUserStats.approved || safeUserStats.resolved || 0); // Use resolved as completed
  const inProgressReports = Number(safeUserStats.inProgress || 0); // Reports currently being processed
  const pendingReports = Number(safeUserStats.pending || 0); // Reports waiting for review
  const completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;
  
  // Memoize calculated stats to prevent unnecessary recalculations
  const memoizedStats = React.useMemo(() => ({
    totalReports,
    completedReports,
    inProgressReports,
    pendingReports,
    completionRate
  }), [safeUserStats]);
  
  // Log stats for debugging
  React.useEffect(() => {
    if (memoizedStats) {
      console.log('Calculated stats:', memoizedStats);
    }
  }, [memoizedStats]);

  const searchTimeoutRef = React.useRef(null);

  // Optimized useEffect - combine all data loading into one effect
  React.useEffect(() => {
    if (user?.id) {
      const loadInitialData = async () => {
        try {
          await Promise.all([
            getUserReports(),
            getCategories(),
            getUserStatsById(user.id)
          ]);
        } catch (error) {
          console.error('Failed to load initial data:', error);
        }
      };
      loadInitialData();
    }
  }, [user?.id, getUserReports, getCategories, getUserStatsById]); // Add all dependencies

  // Define fetchFilteredReports first since it's used by other handlers
  const fetchFilteredReports = React.useCallback((status, categoryId, search) => {
    // Note: This function only filters the reports list, it should NOT affect the stats
    // Stats are calculated from userStats which represents overall user statistics
    reset();
    const filters = {};
    if (status) filters.status = status;
    if (categoryId) filters.categoryId = categoryId;
    if (search) filters.search = search;
    getUserReports(filters, false);
  }, []); // Remove dependencies to prevent initialization issues

  // Memoize handlers to prevent unnecessary re-renders
  const handleStatusChange = React.useCallback((e) => {
    setStatusFilter(e.target.value);
    fetchFilteredReports(e.target.value, categoryFilter, searchQuery);
  }, [categoryFilter, searchQuery]);

  const handleCategoryChange = React.useCallback((e) => {
    setCategoryFilter(e.target.value);
    fetchFilteredReports(statusFilter, e.target.value, searchQuery);
  }, [statusFilter, searchQuery]);

  const handleSearchChange = React.useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchFilteredReports(statusFilter, categoryFilter, value);
    }, 500);
  }, [statusFilter, categoryFilter]);

  const handleLoadMore = React.useCallback(() => {
    getUserReports({}, true);
  }, []); // Remove dependencies to prevent initialization issues

  const handleDrawerToggle = React.useCallback(() => {
    setMobileOpen(!mobileOpen);
  }, [mobileOpen]);

  const handleCreateReport = React.useCallback(async (formData) => {
    try {
      await createReport(formData);
      setModalOpen(false);
      getUserReports();
    } catch (error) {
      console.error('Failed to create report:', error);
      throw error;
    }
  }, []); // Remove dependencies to prevent initialization issues

  if (loading && reports.length === 0) {
    return <LoadingSpinner fullScreen message="Memuat dashboard..." />;
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <>
            {/* Header */}
            <Box sx={{ mb: 4, px: { xs: 2, sm: 0 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                    fontSize: { xs: '1.75rem', sm: '2.125rem' },
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Dashboard
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    Selamat datang kembali! Berikut ringkasan laporan Anda.
                  </Typography>
                </Box>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
                  <IconButton sx={{ 
                    bgcolor: 'white', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                    }
                  }}>
                    <Notifications />
                  </IconButton>
                </Box>
              </Box>
            </Box>

            {/* Enhanced Statistics Cards */}
            <Box sx={{ px: { xs: 2, sm: 0 }, mb: 4 }}>
              <Suspense fallback={<LoadingSpinner message="Memuat statistik..." />}>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <EnhancedStatCard
                      title="Total Laporan"
                      value={totalReports}
                      icon={<Assignment />}
                      color="#2E7D32"
                      animateValue
                      trend={totalReports > 0 ? 'up' : undefined}
                      trendValue={totalReports > 0 ? '+' + totalReports : undefined}
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <EnhancedStatCard
                      title="Menunggu"
                      value={pendingReports}
                      icon={<PendingActions />}
                      color="#FF9800"
                      animateValue
                      subtitle="Perlu tindakan"
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <EnhancedStatCard
                      title="Diproses"
                      value={inProgressReports}
                      icon={<HourglassEmpty />}
                      color="#2196F3"
                      animateValue
                      subtitle="Sedang ditangani"
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <EnhancedStatCard
                      title="Selesai"
                      value={completedReports}
                      icon={<CheckCircle />}
                      color="#4CAF50"
                      animateValue
                      showProgress
                      progressValue={completionRate}
                    />
                  </Grid>
                </Grid>
              </Suspense>
            </Box>

            {/* Enhanced Reports Table */}
            <Box sx={{ width: '100%', mx: 0, px: { xs: 0, sm: 0 } }}>
              <Suspense fallback={<LoadingSpinner message="Memuat tabel laporan..." />}>
                <ImprovedReportsTable
                  reports={reports}
                  loading={loading}
                  categories={categories}
                  statusFilter={statusFilter}
                  categoryFilter={categoryFilter}
                  searchQuery={searchQuery}
                  onStatusChange={handleStatusChange}
                  onCategoryChange={handleCategoryChange}
                  onSearchChange={handleSearchChange}
                  onLoadMore={handleLoadMore}
                  hasNextPage={pagination.hasNextPage}
                  onCreateReport={() => setModalOpen(true)}
                />
              </Suspense>
            </Box>
          </>
        );

      case 'reports':
        return (
          <>
            {/* Header */}
            <Box sx={{ mb: 4, px: { xs: 2, sm: 0 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                    fontSize: { xs: '1.75rem', sm: '2.125rem' },
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Laporan Saya
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}>
                    Kelola dan pantau semua laporan yang telah Anda buat.
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Reports Table */}
            <Box sx={{ width: '100%', mx: 0 }}>
              <Suspense fallback={<LoadingSpinner message="Memuat tabel laporan..." />}>
                <ImprovedReportsTable
                  reports={reports}
                  loading={loading}
                  categories={categories}
                  statusFilter={statusFilter}
                  categoryFilter={categoryFilter}
                  searchQuery={searchQuery}
                  onStatusChange={handleStatusChange}
                  onCategoryChange={handleCategoryChange}
                  onSearchChange={handleSearchChange}
                  onLoadMore={handleLoadMore}
                  hasNextPage={pagination.hasNextPage}
                  onCreateReport={() => setModalOpen(true)}
                />
              </Suspense>
            </Box>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        minHeight: '100vh',
        bgcolor: '#f8f9fa',
      }}
    >
      {/* Sidebar */}
      <Box sx={{ 
        order: { xs: 2, sm: 1 }, 
        width: { xs: '100%', sm: '280px' }, 
        height: { xs: 'auto', sm: '100vh' },
        flexShrink: 0 
      }}>
        <Suspense fallback={<LoadingSpinner fullScreen message="Memuat sidebar..." />}>
          <DashboardSidebar 
            open={mobileOpen} 
            onClose={handleDrawerToggle}
            drawerWidth={drawerWidth}
            onCreateReport={() => setModalOpen(true)}
            activeMenu={activeMenu}
            onMenuChange={setActiveMenu}
          />
        </Suspense>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          order: { xs: 1, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: '#f8f9fa',
          minHeight: { xs: '100vh', sm: 'auto' },
          width: { xs: '100%', sm: 'auto' }
        }}
      >
        <Box
          sx={{
            flex: 1,
            p: { xs: 0, sm: 2, md: 3 },
            overflow: 'auto',
            bgcolor: '#f8f9fa'
          }}
        >
          {renderContent()}

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 3,
                mx: { xs: 2, sm: 0 },
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}
        </Box>
      </Box>

      {/* Create Report Modal */}
      <Suspense fallback={<LoadingSpinner fullScreen message="Memuat modal..." />}>
        <CreateReportModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          categories={categories}
          onSubmit={handleCreateReport}
        />
      </Suspense>
    </Box>
  );
});