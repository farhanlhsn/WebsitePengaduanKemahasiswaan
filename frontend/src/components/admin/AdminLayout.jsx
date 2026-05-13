import React, { useState, useEffect } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from './EnhancedAdminSidebar';
import useAuthStore from '../../stores/authStore';

const drawerWidth = 280;

const AdminLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
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

  // Sync active menu from route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/audit-logs')) {
      setActiveMenu('audit-logs');
    } else if (path.includes('/unverified-users')) {
      setActiveMenu('unverified-users');
    } else if (path.includes('/analytics')) {
      setActiveMenu('analytics');
    } else if (path.includes('/categories')) {
      setActiveMenu('categories');
    } else if (path.includes('/system')) {
      setActiveMenu('system');
    } else if (path.includes('/chat')) {
      setActiveMenu('chat');
    } else if (path.includes('/reports')) {
      setActiveMenu('reports');
    } else if (path.includes('/users')) {
      setActiveMenu('users');
    } else if (path.includes('/settings')) {
      setActiveMenu('settings');
    } else if (path.includes('/admin')) {
      setActiveMenu('dashboard');
    }
  }, [location.pathname]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebar-open-admin', JSON.stringify(newState));
  };

  const handleMenuChange = (menuId) => {
    setActiveMenu(menuId);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Sidebar */}
      <AdminSidebar
        open={mobileOpen}
        onClose={handleDrawerToggle}
        drawerWidth={drawerWidth}
        activeMenu={activeMenu}
        onMenuChange={handleMenuChange}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={handleSidebarToggle}
      />

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden' 
        }}
      >
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflowY: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;

