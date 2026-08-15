import React, { useState, useCallback, useEffect } from 'react';
import { Box, Alert } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import AdminSidebar from '../../components/admin/AdminSidebar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const drawerWidth = 280;

/**
 * AdminLayout — persistent shell shared by every /admin/* route.
 *
 * Renders the sidebar plus an <Outlet/> for the active section page. The
 * previous monolithic EnhancedAdminDashboard switched sections via local
 * state (activeMenu); now each section is its own route, so:
 *   - Deep links work (/admin/reports refreshes to the reports view).
 *   - Lazy-loaded section pages no longer all download on first visit.
 *   - Future role-aware gating (SUPERADMIN-only routes) is straightforward.
 *
 * Auth guarding: redirect MAHASISWA away to their dashboard. ADMIN/SUPERADMIN
 * proceed.
 */
const AdminLayout = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar-open-admin');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    if (user && user.role === 'MAHASISWA') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleDrawerToggle = useCallback(() => setMobileOpen((m) => !m), []);
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-open-admin', JSON.stringify(next));
      return next;
    });
  }, []);

  if (user?.role === 'MAHASISWA') {
    return <LoadingSpinner fullScreen message="Mengalihkan..." />;
  }

  return (
    <Box data-admin-layout-shell sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100dvh' }}>
      <AdminSidebar
        open={mobileOpen}
        onClose={handleDrawerToggle}
        drawerWidth={drawerWidth}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={handleSidebarToggle}
        onMobileMenuClick={handleDrawerToggle}
      />

      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflowY: 'auto' }}>
          <Outlet context={{ onMobileMenuClick: handleDrawerToggle }} />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
