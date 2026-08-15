import React, { useEffect, Suspense, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Alert, IconButton
} from '@mui/material';
import Grid from '@mui/material/Grid'; // Impor Grid yang benar
import { 
  Assignment, CheckCircle, HourglassEmpty, PendingActions, 
  Menu as MenuIcon
} from '@mui/icons-material';
import useReportStore from '../stores/reportStore';
import useCategoryStore from '../stores/categoryStore';
import useUserStore from '../stores/userStore';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';
import { useTranslation } from '../stores/settingsStore';
import { useLocation } from 'react-router-dom';

import StudentSidebar from '../components/dashboard/StudentSidebar';
import EnhancedStatCard from '../components/dashboard/EnhancedStatCard';
import ImprovedReportsTable from '../components/dashboard/ImprovedReportsTable';
import CreateReportModal from '../components/dashboard/CreateReportModal';
import ReportDetailModal from '../components/dashboard/ReportDetailModal';
import StudentNotificationMenu from '../components/dashboard/StudentNotificationMenu';
import ChatList from '../components/chat/ChatList';
import ChatInterface from '../components/chat/ChatInterface';
import ProfilePage from './ProfilePage';
import SettingsPage from './SettingsPage';
import HelpPage from './HelpPage';

import LoadingSpinner from '../components/ui/LoadingSpinner';

const drawerWidth = 300;

export default React.memo(function ImprovedStudentDashboard() {
  const { reports, loading, error, getUserReports, getReportById, pagination, reset, createReport } = useReportStore();
  const { categories, getCategories } = useCategoryStore();
  const { userStats, getUserStatsById } = useUserStore();
  const { user } = useAuthStore();
  const { selectReport } = useChatStore();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [selectedReport, setSelectedReport] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.activeMenu) {
      setActiveMenu(location.state.activeMenu);
      // Clear navigation state to prevent issues on page refresh/reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
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
  }), [totalReports, completedReports, inProgressReports, pendingReports, completionRate]);

  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      getUserReports();
      getCategories();
      getUserStatsById(user.id);
    }
  }, [user?.id, getUserReports, getCategories, getUserStatsById]);

  useEffect(() => {
    const reportId = searchParams.get('report');
    if (!reportId || !user?.id) return;

    const reportFromList = reports.find((item) => String(item.id) === String(reportId));
    if (reportFromList) {
      setSelectedReport(reportFromList);
      return;
    }

    let active = true;
    getReportById(reportId)
      .then((report) => { if (active) setSelectedReport(report); })
      .catch(() => {})
    return () => { active = false; };
  }, [searchParams, reports, user?.id, getReportById]);

  const closeReportDetail = useCallback(() => {
    setSelectedReport(null);
    if (searchParams.has('report')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('report');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
    // Fix M12: teruskan filter aktif saat load-more — sebelumnya mengirim
    // filter kosong sehingga hasil tak terfilter bercampur dengan yang terfilter.
    const filters = {};
    if (statusFilter) filters.status = statusFilter;
    if (categoryFilter) filters.categoryId = categoryFilter;
    if (searchQuery) filters.search = searchQuery;
    getUserReports(filters, true);
  }, [getUserReports, statusFilter, categoryFilter, searchQuery]);

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

  // Setelah mahasiswa mengedit laporannya (masih PENDING), muat ulang daftar
  // dengan filter yang sedang aktif agar tabel menampilkan data terbaru.
  const handleReportEdited = useCallback(() => {
    fetchFilteredReports(statusFilter, categoryFilter, searchQuery);
  }, [fetchFilteredReports, statusFilter, categoryFilter, searchQuery]);


  if (loading && reports.length === 0) {
    return <LoadingSpinner fullScreen message="Memuat dasbor..." />;
  }

  const renderContent = () => {
    // ... (commonHeader tetap sama) ...
    const commonHeader = (title, subtitle) => (
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', minWidth: 0 }}>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ display: { sm: 'none' }, mr: 1, mt: 0.25 }}>
              <MenuIcon />
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h3" fontWeight={800} sx={{ fontSize: { xs: '1.45rem', sm: '1.9rem' }, lineHeight: 1.2 }}>{title}</Typography>
              <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
            </Box>
          </Box>
          <StudentNotificationMenu reports={reports} onOpenReport={setSelectedReport} />
        </Box>
      </Box>
    );

    switch (activeMenu) {
      case 'dashboard':
        return (
          <>
            {commonHeader(t('dashboard.title'), t('dashboard.subtitle'))}
<Box sx={{ mb: 4 }}>
              {/* --- GRID YANG SUDAH DIPERBAIKI --- */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                  <EnhancedStatCard title={t('dashboard.total_reports')} value={memoizedStats.totalReports} icon={<Assignment />} color="#2E7D32" animateValue />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                  <EnhancedStatCard title={t('dashboard.pending')} value={memoizedStats.pendingReports} icon={<PendingActions />} color="#FF9800" animateValue />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                  <EnhancedStatCard title={t('dashboard.in_progress')} value={memoizedStats.inProgressReports} icon={<HourglassEmpty />} color="#2196F3" animateValue />
                </Grid>
                <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                  <EnhancedStatCard title={t('dashboard.resolved')} value={memoizedStats.completedReports} icon={<CheckCircle />} color="#4CAF50" animateValue showProgress progressValue={memoizedStats.completionRate} />
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ width: '100%', mx: 0, px: { xs: 0, sm: 0 } }}>
              <ImprovedReportsTable reports={reports} loading={loading} categories={categories} statusFilter={statusFilter} categoryFilter={categoryFilter} searchQuery={searchQuery} onStatusChange={handleStatusChange} onCategoryChange={handleCategoryChange} onSearchChange={handleSearchChange} onLoadMore={handleLoadMore} hasNextPage={pagination.hasNextPage} onCreateReport={() => setModalOpen(true)} onOpenDetail={setSelectedReport} />
            </Box>
          </>
        );
      // ... (case 'reports' dan 'chat' tetap sama) ...
      case 'reports':
        return (
          <>
            {commonHeader(t('reports.title'), t('reports.subtitle'))}
            <Box sx={{ width: '100%', mx: 0 }}>
              <ImprovedReportsTable reports={reports} loading={loading} categories={categories} statusFilter={statusFilter} categoryFilter={categoryFilter} searchQuery={searchQuery} onStatusChange={handleStatusChange} onCategoryChange={handleCategoryChange} onSearchChange={handleSearchChange} onLoadMore={handleLoadMore} hasNextPage={pagination.hasNextPage} onCreateReport={() => setModalOpen(true)} onOpenDetail={setSelectedReport} />
            </Box>
          </>
        );
      case 'chat':
        return (
          <>
            {commonHeader(t('chat.title'), t('chat.subtitle'))}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, height: { lg: 'calc(100vh - 200px)' } }}>
              <Box sx={{ width: { xs: '100%', lg: '350px' }, flexShrink: 0 }}>
                <ChatList onReportSelect={selectReport} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ChatInterface />
              </Box>
            </Box>
          </>
        );
      case 'profile':
        return (
          <>
            {commonHeader(t('profile.title'), t('profile.subtitle'))}
            <Box sx={{ width: '100%', mx: 0 }}>
              <ProfilePage isEmbedded={true} />
            </Box>
          </>
        );
      case 'settings':
        return (
          <>
            {commonHeader(t('settings.title'), t('settings.subtitle'))}
            <Box sx={{ width: '100%', mx: 0 }}>
              <SettingsPage isEmbedded={true} />
            </Box>
          </>
        );
      case 'help':
        return (
          <Box sx={{ width: '100%', mx: 0 }}>
            <HelpPage isEmbedded={true} />
          </Box>
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
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Box sx={{ flex: 1, p: { xs: 1.5, sm: 2.5 }, overflowY: 'auto', overflowX: 'hidden', bgcolor: 'background.default' }}>
          {renderContent()}
          {error && <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>{error}</Alert>}
        </Box>
      </Box>
      <CreateReportModal open={modalOpen} onClose={() => setModalOpen(false)} categories={categories} onSubmit={handleCreateReport} />
      <ReportDetailModal
        open={Boolean(selectedReport)}
        report={selectedReport}
        onClose={closeReportDetail}
        onEdited={handleReportEdited}
        onOpenChat={async (report) => {
          if (!report) return;
          await selectReport(report);
          closeReportDetail();
          setActiveMenu('chat');
        }}
      />
    </Box>
  );
});