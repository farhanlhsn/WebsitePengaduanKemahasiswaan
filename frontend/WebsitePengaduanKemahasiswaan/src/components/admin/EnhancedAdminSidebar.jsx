import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Avatar, Typography, 
  Divider, Badge, Button, Collapse, useTheme, alpha, Tooltip
} from '@mui/material';
import { 
  Dashboard, People, Assignment, Category, Analytics, Security, Settings, 
  HelpOutline, Logout, AdminPanelSettings, ExpandLess, ExpandMore,
  TrendingUp, Notifications, DevicesOther, Person, Schedule, Chat
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import DeviceManagement from '../DeviceManagement';
import logo from '../../assets/logo-ubh.png';

const StyledListItem = styled(ListItem)(({ theme, active, level = 0 }) => ({
  borderRadius: 12,
  margin: '4px 16px',
  padding: '12px 16px',
  paddingLeft: 16 + (level * 24),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  
  // Active state styling
  backgroundColor: active 
    ? alpha(theme.palette.primary.main, 0.12) 
    : 'transparent',
  border: active 
    ? `2px solid ${alpha(theme.palette.primary.main, 0.3)}` 
    : '2px solid transparent',
  
  // Hover effects
  '&:hover': {
    backgroundColor: active 
      ? alpha(theme.palette.primary.main, 0.16) 
      : alpha(theme.palette.grey[500], 0.08),
    transform: 'translateX(4px)',
    boxShadow: active 
      ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}` 
      : '0 4px 12px rgba(0,0,0,0.1)',
  },
  
  // Active state glow effect
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: active 
      ? `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`
      : 'transparent',
    borderRadius: 'inherit',
    transition: 'all 0.3s ease',
  },
  
  // Icon styling
  '& .MuiListItemIcon-root': {
    minWidth: 40,
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
    transition: 'all 0.3s ease',
    zIndex: 1,
    position: 'relative',
  },
  
  // Text styling
  '& .MuiListItemText-primary': {
    fontWeight: active ? 700 : 500,
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    zIndex: 1,
    position: 'relative',
  },
  
  // Animation for active state
  ...(active && {
    animation: 'slideIn 0.3s ease-out',
  }),
  
  '@keyframes slideIn': {
    '0%': {
      transform: 'translateX(-10px)',
      opacity: 0.8,
    },
    '100%': {
      transform: 'translateX(0)',
      opacity: 1,
    },
  },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.error.main,
    color: 'white',
    fontWeight: 600,
    fontSize: '0.7rem',
    minWidth: '18px',
    height: '18px',
    borderRadius: '9px',
    animation: 'pulse 2s infinite',
  },
  
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(1)',
      boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0.7)}`,
    },
    '70%': {
      transform: 'scale(1.1)',
      boxShadow: `0 0 0 10px ${alpha(theme.palette.error.main, 0)}`,
    },
    '100%': {
      transform: 'scale(1)',
      boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0)}`,
    },
  },
}));

const EnhancedAdminSidebar = ({ 
  open, 
  onClose, 
  drawerWidth = 280, 
  activeMenu, 
  onMenuChange,
  stats = {} 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { logout, user } = useAuthStore();
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  // Persist active menu in localStorage
  useEffect(() => {
    const savedActiveMenu = localStorage.getItem('admin-active-menu');
    if (savedActiveMenu && onMenuChange) {
      onMenuChange(savedActiveMenu);
    }
  }, [onMenuChange]);

  useEffect(() => {
    if (activeMenu) {
      localStorage.setItem('admin-active-menu', activeMenu);
    }
  }, [activeMenu]);

  // Enhanced menu structure with nested items and badges
  const menuItems = [
    {
      id: 'dashboard',
      text: 'Dashboard Overview',
      icon: <Dashboard />,
      path: '/admin',
      badge: null,
      description: 'Ringkasan sistem dan statistik'
    },
    {
      id: 'users',
      text: 'Manajemen Pengguna',
      icon: <People />,
      path: '/admin/users',
      badge: stats.pendingVerifications || 0,
      description: 'Kelola pengguna dan verifikasi',
      subItems: [
        { id: 'users-list', text: 'Daftar Pengguna', path: '/admin/users' },
        { id: 'users-verification', text: 'Verifikasi Pending', path: '/admin/users/verification', badge: stats.pendingVerifications },
        { id: 'users-analytics', text: 'Analitik Pengguna', path: '/admin/users/analytics' }
      ]
    },
    {
      id: 'reports',
      text: 'Manajemen Laporan',
      icon: <Assignment />,
      path: '/admin/reports',
      badge: stats.pendingReports || 0,
      description: 'Kelola dan tindak lanjuti laporan',
      subItems: [
        { id: 'reports-all', text: 'Semua Laporan', path: '/admin/reports' },
        { id: 'reports-pending', text: 'Menunggu Review', path: '/admin/reports/pending', badge: stats.pendingReports },
        { id: 'reports-in-progress', text: 'Sedang Diproses', path: '/admin/reports/in-progress' },
        { id: 'reports-resolved', text: 'Selesai', path: '/admin/reports/resolved' }
      ]
    },
    {
      id: 'chat',
      text: 'Chat & Komunikasi',
      icon: <Chat />,
      path: '/admin/chat',
      badge: stats.unreadMessages || 0,
      description: 'Komunikasi dengan pelapor'
    },
    {
      id: 'analytics',
      text: 'Analytics & Reports',
      icon: <Analytics />,
      path: '/admin/analytics',
      badge: null,
      description: 'Laporan dan analisis data'
    },
    {
      id: 'categories',
      text: 'Kategori Laporan',
      icon: <Category />,
      path: '/admin/categories',
      badge: null,
      description: 'Kelola kategori pengaduan'
    },
    {
      id: 'system',
      text: 'Sistem & Keamanan',
      icon: <Security />,
      path: '/admin/system',
      badge: null,
      description: 'Pengaturan sistem dan keamanan'
    }
  ];

  const bottomMenuItems = [
    {
      id: 'profile',
      text: 'Profil Admin',
      icon: <Person />,
      action: () => navigate('/admin/profile')
    },
    {
      id: 'devices',
      text: 'Perangkat',
      icon: <DevicesOther />,
      action: () => setDeviceModalOpen(true)
    },
    {
      id: 'settings',
      text: 'Pengaturan',
      icon: <Settings />,
      action: () => navigate('/admin/settings')
    },
    {
      id: 'help',
      text: 'Bantuan',
      icon: <HelpOutline />,
      action: () => navigate('/help')
    },
    {
      id: 'logout',
      text: 'Logout',
      icon: <Logout />,
      action: handleLogout,
      color: 'error.main'
    }
  ];

  const isActive = (menuId) => activeMenu === menuId;

  const handleMenuClick = (item) => {
    if (item.subItems) {
      setExpandedMenus(prev => ({
        ...prev,
        [item.id]: !prev[item.id]
      }));
    } else {
      if (onMenuChange) {
        onMenuChange(item.id);
      }
      if (onClose && window.innerWidth < 600) {
        onClose();
      }
    }
  };

  const handleSubMenuClick = (subItem) => {
    if (onMenuChange) {
      onMenuChange(subItem.id);
    }
    if (onClose && window.innerWidth < 600) {
      onClose();
    }
  };

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const drawerContent = (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: `linear-gradient(180deg, 
        ${alpha(theme.palette.background.paper, 0.98)} 0%, 
        ${alpha(theme.palette.background.default, 0.95)} 100%)`,
      backdropFilter: 'blur(20px)',
      overflowX: 'hidden',
    }}>
      {/* Enhanced Logo Section */}
      <Box sx={{ 
        p: 3, 
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.main, 0.05)} 0%, 
          ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            component="img"
            src={logo}
            alt="Logo Universitas Bung Hatta"
            sx={{ 
              width: 50, 
              height: 50, 
              objectFit: 'contain',
              filter: `drop-shadow(0 4px 12px ${alpha(theme.palette.primary.main, 0.3)})`
            }}
          />
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ 
              fontSize: '1.3rem',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2
            }}>
              Admin Portal
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Sistem Pengaduan UBH
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Menu */}
      <Box sx={{ 
        flex: 1,
        py: 2, 
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          width: 6,
        },
        '&::-webkit-scrollbar-track': {
          background: alpha(theme.palette.grey[300], 0.2),
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha(theme.palette.grey[500], 0.3),
          borderRadius: 3,
        },
      }}>
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => (
            <Box key={item.id}>
              <Tooltip 
                title={item.description} 
                placement="right" 
                arrow
                enterDelay={500}
              >
                <StyledListItem 
                  onClick={() => handleMenuClick(item)}
                  active={isActive(item.id)}
                >
                  <ListItemIcon>
                    {item.badge && item.badge > 0 ? (
                      <StyledBadge badgeContent={item.badge}>
                        {item.icon}
                      </StyledBadge>
                    ) : item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                  {item.subItems && (
                    expandedMenus[item.id] ? <ExpandLess /> : <ExpandMore />
                  )}
                </StyledListItem>
              </Tooltip>
              
              {/* Sub Menu Items */}
              {item.subItems && (
                <Collapse in={expandedMenus[item.id]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => (
                      <Tooltip 
                        key={subItem.id}
                        title={subItem.text} 
                        placement="right" 
                        arrow
                      >
                        <StyledListItem 
                          level={1}
                          onClick={() => handleSubMenuClick(subItem)}
                          active={isActive(subItem.id)}
                        >
                          <ListItemIcon>
                            {subItem.badge && subItem.badge > 0 ? (
                              <StyledBadge badgeContent={subItem.badge}>
                                <TrendingUp fontSize="small" />
                              </StyledBadge>
                            ) : (
                              <TrendingUp fontSize="small" />
                            )}
                          </ListItemIcon>
                          <ListItemText 
                            primary={subItem.text}
                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                          />
                        </StyledListItem>
                      </Tooltip>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          ))}
        </List>
      </Box>

      {/* Bottom Menu */}
      <Box sx={{ 
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, 
        py: 2,
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.background.default, 0.8)} 0%, 
          ${alpha(theme.palette.background.paper, 0.9)} 100%)`
      }}>
        <List sx={{ px: 1 }}>
          {bottomMenuItems.map((item) => (
            <StyledListItem 
              key={item.id}
              onClick={item.action}
            >
              <ListItemIcon sx={{ 
                color: item.color || 'inherit'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{ 
                  color: item.color || 'inherit',
                  fontSize: '0.9rem'
                }}
              />
            </StyledListItem>
          ))}
        </List>
      </Box>

      {/* Enhanced User Info */}
      <Box sx={{ 
        p: 3, 
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.main, 0.05)} 0%, 
          ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            width: 48, 
            height: 48, 
            bgcolor: 'primary.main',
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }}>
            <AdminPanelSettings />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {user?.name || 'Administrator'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email || 'admin@bunghatta.ac.id'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: 'success.main',
                animation: 'pulse 2s infinite'
              }} />
              <Typography variant="caption" color="success.main" fontWeight={600}>
                Online
              </Typography>
            </Box>
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
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            overflowX: 'hidden',
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
            position: 'relative',
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default EnhancedAdminSidebar;