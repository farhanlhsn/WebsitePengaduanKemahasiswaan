import React, { useState } from 'react';
import {
  Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Avatar, Typography, Divider, Badge, Button
} from '@mui/material';
import { 
  Dashboard, Description, AddCircle, BarChart, Settings, HelpOutline, Logout, AccountCircle, 
  DevicesOther, Person, AdminPanelSettings, People, Assignment, Category, Analytics, 
  Notifications, Security, TrendingUp, Schedule
} from '@mui/icons-material';
import { alpha, styled, useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import DeviceManagement from '../DeviceManagement';
import logo from '../../assets/logo-ubh.png';

const StyledListItem = styled(ListItem)(({ theme, active }) => ({
  borderRadius: 12,
  margin: '4px 16px',
  padding: '12px 16px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  pointerEvents: 'auto', // Ensure pointer events are enabled
  userSelect: 'none', // Prevent text selection
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
  border: active ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}` : '1px solid transparent',
  '&:hover': {
    backgroundColor: active ? alpha(theme.palette.primary.main, 0.16) : alpha(theme.palette.grey[500], 0.08),
    transform: 'translateX(4px)',
    boxShadow: active ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}` : '0 2px 8px rgba(0,0,0,0.1)',
  },
  '&:active': {
    transform: 'translateX(4px) scale(0.98)',
  },
  '& .MuiListItemIcon-root': {
    minWidth: 40,
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
    transition: 'color 0.2s ease',
    pointerEvents: 'none', // Prevent icon from blocking clicks
  },
  '& .MuiListItemText-primary': {
    fontWeight: active ? 700 : 500,
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    pointerEvents: 'none', // Prevent text from blocking clicks
  }
}));

const DashboardSidebar = ({ open, onClose, drawerWidth = 280, onCreateReport, activeMenu, onMenuChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { logout, user } = useAuthStore();
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);

  // Check if current path matches menu item
  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Enhanced menu structure for admin
  const adminMenu = [
    { 
      id: 'dashboard',
      text: 'Dashboard Overview', 
      icon: <Dashboard />, 
      path: '/admin',
      action: () => {
        if (onMenuChange) onMenuChange('dashboard');
      },
      badge: null
    },
    { 
      id: 'users',
      text: 'Manajemen Pengguna', 
      icon: <People />, 
      path: '/admin/users',
      action: () => {
        if (onMenuChange) onMenuChange('users');
      },
      badge: 5 // Example: pending verifications
    },
    { 
      id: 'reports',
      text: 'Semua Laporan', 
      icon: <Assignment />, 
      path: '/admin/reports',
      action: () => {
        if (onMenuChange) onMenuChange('reports');
      },
      badge: 12 // Example: pending reports
    },
    { 
      id: 'analytics',
      text: 'Analytics & Reports', 
      icon: <Analytics />, 
      path: '/admin/analytics',
      action: () => {
        // navigate('/admin/analytics'); // Uncomment when page exists
      },
      badge: null
    },
    { 
      id: 'categories',
      text: 'Kategori Laporan', 
      icon: <Category />, 
      path: '/admin/categories',
      action: () => {
        // navigate('/admin/categories'); // Uncomment when page exists
      },
      badge: null
    },
    { 
      id: 'system',
      text: 'Sistem & Keamanan', 
      icon: <Security />, 
      path: '/admin/system',
      action: () => {
        // navigate('/admin/system'); // Uncomment when page exists
      },
      badge: null
    }
  ];

  const studentMenu = [
    { 
      id: 'dashboard',
      text: 'Dashboard', 
      icon: <Dashboard />, 
      path: '/dashboard',
      action: () => {
        navigate('/dashboard');
        if (onMenuChange) onMenuChange('dashboard');
      },
      badge: null
    },
    { 
      id: 'reports',
      text: 'Laporan Saya', 
      icon: <Description />, 
      path: '/dashboard/reports',
      action: () => {
        if (onMenuChange) onMenuChange('reports');
      },
      badge: null
    },
    { 
      id: 'create',
      text: 'Buat Laporan', 
      icon: <AddCircle />, 
      path: '/create-report',
      action: () => {
        if (onCreateReport) {
          onCreateReport();
        } else {
          navigate('/create-report');
        }
      },
      badge: null
    },
    { 
      id: 'tracking',
      text: 'Lacak Progress', 
      icon: <TrendingUp />, 
      path: '/dashboard/tracking',
      action: () => {
        if (onMenuChange) onMenuChange('tracking');
      },
      badge: null
    }
  ];

  const menu = user?.role === 'ADMIN' ? adminMenu : studentMenu;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const bottomMenu = [
    { 
      text: 'Profil', 
      icon: <Person />, 
      action: () => navigate('/profile'),
      color: 'inherit'
    },
    { 
      text: 'Perangkat', 
      icon: <DevicesOther />, 
      action: () => setDeviceModalOpen(true),
      color: 'inherit'
    },
    { 
      text: 'Pengaturan', 
      icon: <Settings />, 
      action: () => navigate('/settings'),
      color: 'inherit'
    },
    { 
      text: 'Bantuan', 
      icon: <HelpOutline />, 
      action: () => navigate('/help'),
      color: 'inherit'
    },
    { 
      text: 'Logout', 
      icon: <Logout />, 
      action: handleLogout,
      color: 'error.main'
    }
  ];

  function capitalizeFirstLetter(text) {
    if (typeof text !== 'string' || text.length === 0) {
      return '';
    }
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)'
    }}>
      {/* Logo Section */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            component="img"
            src={logo}
            alt="Logo Universitas Bung Hatta"
            sx={{ 
              width: 50, 
              height: 50, 
              objectFit: 'contain',
              filter: `drop-shadow(0 4px 12px ${alpha(theme.palette.primary.main, 0.2)})`
            }}
          />
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ 
              fontSize: '1.1rem',
              background: user?.role === 'ADMIN' 
                ? 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)'
                : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Portal {capitalizeFirstLetter(user?.role || 'Student')}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {user?.role === 'ADMIN' ? 'Sistem Manajemen' : 'Pengaduan Mahasiswa'}
            </Typography>
          </Box>
        </Box>
      </Box>



      {/* Main Menu */}
      <Box sx={{ 
        flex: 1, 
        py: 2, 
        overflowY: 'auto',
        position: 'relative',
        zIndex: 10 
      }}>
        <List sx={{ 
          position: 'relative',
          zIndex: 10,
          pointerEvents: 'auto'
        }}>
          {menu.map((item) => (
            <StyledListItem 
              key={item.text}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (item.action && typeof item.action === 'function') {
                  item.action();
                }
                
                // Close mobile drawer when item is clicked
                if (onClose && window.innerWidth < 600) {
                  onClose();
                }
              }}
              active={isActive(item.path) ? 1 : 0}
              style={{ 
                position: 'relative',
                zIndex: 1,
                minHeight: '48px',
                display: 'flex'
              }}
            >
              <ListItemIcon sx={{ pointerEvents: 'none' }}>
                {item.badge && item.badge > 0 ? (
                  <Badge 
                    badgeContent={item.badge} 
                    color="error"
                    sx={{
                      pointerEvents: 'none',
                      '& .MuiBadge-badge': {
                        fontSize: '0.7rem',
                        height: '16px',
                        minWidth: '16px',
                        pointerEvents: 'none'
                      }
                    }}
                  >
                    {item.icon}
                  </Badge>
                ) : item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ pointerEvents: 'none' }}
              />
            </StyledListItem>
          ))}
        </List>

        {/* Quick Stats for Admin */}
        {user?.role === 'ADMIN' && (
          <Box sx={{ mx: 2, mt: 3, mb: 2 }}>
            <Box sx={{ 
              p: 2, 
              borderRadius: 3, 
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                RINGKASAN HARI INI
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Laporan Baru
                </Typography>
                <Typography variant="body2" fontWeight={600} color="primary.main">
                  +5
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Pending Review
                </Typography>
                <Typography variant="body2" fontWeight={600} color="warning.main">
                  12
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Bottom Menu */}
      <Box sx={{ 
        borderTop: '1px solid rgba(0,0,0,0.06)', 
        py: 2,
        position: 'relative',
        zIndex: 10 
      }}>
        <List sx={{ 
          position: 'relative',
          zIndex: 10,
          pointerEvents: 'auto'
        }}>
          {bottomMenu.map((item) => (
            <StyledListItem 
              key={item.text}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (item.action && typeof item.action === 'function') {
                  item.action();
                }
                
                // Close mobile drawer when item is clicked
                if (onClose && window.innerWidth < 600) {
                  onClose();
                }
              }}
              style={{ 
                position: 'relative',
                zIndex: 1,
                minHeight: '48px',
                display: 'flex'
              }}
            >
              <ListItemIcon sx={{ 
                color: item.color === 'error.main' ? 'error.main' : 'inherit',
                pointerEvents: 'none' 
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{ 
                  color: item.color === 'error.main' ? 'error.main' : 'inherit' 
                }}
                sx={{ pointerEvents: 'none' }}
              />
            </StyledListItem>
          ))}
        </List>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.06)', bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            width: 44, 
            height: 44, 
            bgcolor: user?.role === 'ADMIN' ? 'success.main' : 'primary.main',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {user?.role === 'ADMIN' ? <AdminPanelSettings /> : <AccountCircle />}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {user?.name || 'Pengguna'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email || 'user@bunghatta.ac.id'}
            </Typography>
            {user?.role === 'ADMIN' && (
              <Typography variant="caption" color="success.main" fontWeight={600} sx={{ display: 'block' }}>
                Administrator
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Device Management Modal */}
      <DeviceManagement 
        open={deviceModalOpen} 
        onClose={() => setDeviceModalOpen(false)} 
      />
      
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            border: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            border: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            position: 'relative'
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default DashboardSidebar; 