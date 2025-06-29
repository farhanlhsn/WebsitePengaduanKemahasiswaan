import React, { useEffect } from 'react';
import {
  Box, Typography, Alert, IconButton, Grid, Container
} from '@mui/material';
import { 
  Assignment, CheckCircle, HourglassEmpty, PendingActions, 
  Menu as MenuIcon, Notifications 
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import useReportStore from '../stores/reportStore';
import useCategoryStore from '../stores/categoryStore';

// Import enhanced components
import DashboardSidebar from '../components/dashboard/Sidebar';
import EnhancedStatCard from '../components/dashboard/EnhancedStatCard';
import ImprovedReportsTable from '../components/dashboard/ImprovedReportsTable';
import CreateReportModal from '../components/dashboard/CreateReportModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const drawerWidth = 280;

export default function ImprovedStudentDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { reports, loading, error, getUserReports, pagination, reset, createReport } = useReportStore();
  const { categories, getCategories } = useCategoryStore();

  const [statusFilter, setStatusFilter] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [activeMenu, setActiveMenu] = React.useState('dashboard');

  // Statistics with enhanced calculations
  const totalReports = reports.length;
  const completedReports = reports.filter(r => r.status === 'RESOLVED').length;
  const inProgressReports = reports.filter(r => ['IN_REVIEW', 'IN_PROGRESS'].includes(r.status)).length;
  const pendingReports = reports.filter(r => r.status === 'PENDING').length;
  const completionRate = totalReports > 0 ? (completedReports / totalReports) * 100 : 0;

  const searchTimeoutRef = React.useRef(null);

  React.useEffect(() => {
    getUserReports();
    getCategories();
  }, []);

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    fetchFilteredReports(e.target.value, categoryFilter, searchQuery);
  };

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    fetchFilteredReports(statusFilter, e.target.value, searchQuery);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchFilteredReports(statusFilter, categoryFilter, value);
    }, 500);
  };

  const fetchFilteredReports = (status, categoryId, search) => {
    reset();
    const filters = {};
    if (status) filters.status = status;
    if (categoryId) filters.categoryId = categoryId;
    if (search) filters.search = search;
    getUserReports(filters, false);
  };

  const handleLoadMore = () => {
    getUserReports({}, true);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCreateReport = async (formData) => {
    try {
      await createReport(formData);
      setModalOpen(false);
      getUserReports();
    } catch (error) {
      console.error('Failed to create report:', error);
      throw error;
    }
  };

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
                    trend="up"
                    trendValue={`${Math.round(completionRate)}%`}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Enhanced Reports Table */}
            <Box sx={{ width: '100%', mx: 0, px: { xs: 0, sm: 0 } }}>
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
        <DashboardSidebar 
          open={mobileOpen} 
          onClose={handleDrawerToggle}
          drawerWidth={drawerWidth}
          onCreateReport={() => setModalOpen(true)}
          activeMenu={activeMenu}
          onMenuChange={setActiveMenu}
        />
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
      <CreateReportModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        onSubmit={handleCreateReport}
      />
    </Box>
  );
}