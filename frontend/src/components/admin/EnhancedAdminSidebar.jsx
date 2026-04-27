import React, { useState, useCallback } from 'react';
import {
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Avatar, 
  Typography, 
  Badge, 
  IconButton,
  Tooltip,
  Divider,
  useMediaQuery,
  Dialog
} from '@mui/material';
import { 
  Dashboard, 
  People, 
  Assignment, 
  Analytics, 
  Category, 
  Security, 
  Chat, 
  Settings, 
  HelpOutline, 
  Logout, 
  AdminPanelSettings, 
  ChevronLeft,
  History,
  PersonAdd
} from '@mui/icons-material';
import { alpha, styled, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import UBHLogo from '../ui/UBHLogo';

// Enhanced StyledListItem with better animations and states
const StyledListItem = styled(ListItem)(({ theme, active, disabled, collapsed }) => ({
  borderRadius: collapsed ? 12 : 16,
  padding: collapsed ? '12px' : '14px 20px',
  position: 'relative',
  overflow: 'hidden',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
  border: active ? `2px solid ${alpha(theme.palette.primary.main, 0.3)}` : '2px solid transparent',
  opacity: disabled ? 0.5 : 1,
  justifyContent: collapsed ? 'center' : 'flex-start',
  minHeight: collapsed ? 48 : 'auto',
  width: collapsed ? 48 : 'auto',
  margin: collapsed ? '4px auto' : '6px 12px',
  
  // Glassmorphism effect for active items
  ...(active && {
    backdropFilter: 'blur(10px)',
    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`,
  }),
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: active 
      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`
      : 'transparent',
    transition: 'all 0.3s ease',
    zIndex: -1,
  },
  
  '&:hover': {
    backgroundColor: active 
      ? alpha(theme.palette.primary.main, 0.2) 
      : alpha(theme.palette.grey[500], 0.08),
    transform: disabled ? 'none' : (collapsed ? 'scale(1.05)' : 'translateX(8px) scale(1.02)'),
    boxShadow: disabled 
      ? 'none' 
      : `0 12px 40px ${alpha(theme.palette.grey[500], 0.15)}`,
    
    '&::before': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.03)})`,
    },
    
    '& .MuiListItemIcon-root': {
      transform: 'scale(1.1)',
      color: theme.palette.primary.main,
    },
    
    '& .sidebar-item-indicator': {
      opacity: 1,
      transform: 'scale(1)',
    }
  },
  
  '& .MuiListItemIcon-root': {
    minWidth: collapsed ? 0 : 48,
    justifyContent: 'center',
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  '& .MuiListItemText-root': {
    opacity: collapsed ? 0 : 1,
    transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
    transition: 'all 0.3s ease',
    margin: collapsed ? 0 : undefined,
  },
  
  '& .MuiListItemText-primary': {
    fontWeight: active ? 700 : 500,
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
  },
  
  '& .sidebar-item-indicator': {
    position: 'absolute',
    right: collapsed ? 6 : 16,
    width: collapsed ? 4 : 6,
    height: collapsed ? 4 : 6,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    opacity: active ? 1 : 0,
    transform: active ? 'scale(1)' : 'scale(0)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  }
}));

// Enhanced toggle button with better positioning and animation
const SidebarToggleButton = styled(IconButton)(({ theme, open }) => ({
  position: 'absolute',
  top: '32px',
  right: -18,
  zIndex: theme.zIndex.drawer + 2,
  width: 36,
  height: 36,
  backgroundColor: alpha(theme.palette.background.paper, 0.95),
  border: `2px solid ${theme.palette.divider}`,
  backdropFilter: 'blur(12px)',
  boxShadow: `0 4px 20px ${alpha(theme.palette.grey[500], 0.2)}`,
  
  '&:hover': { 
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    borderColor: alpha(theme.palette.primary.main, 0.3),
    transform: 'scale(1.1)',
    boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.25)}`,
  },
  
  '& .MuiSvgIcon-root': {
    fontSize: '1.2rem',
    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
    color: theme.palette.primary.main,
  },
}));

// Enhanced drawer paper styling function
const getDrawerPaperStyles = (theme, sidebarOpen, drawerWidth) => ({
  width: sidebarOpen ? drawerWidth : 72, // Mini width when collapsed
  overflowX: 'hidden',
  background: `linear-gradient(180deg, 
    ${alpha(theme.palette.background.paper, 0.98)} 0%, 
    ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
  backdropFilter: 'blur(20px)',
  borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
});

// Enhanced user profile section
const UserProfileSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.02)} 0%, 
    ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
  backdropFilter: 'blur(10px)',
  position: 'relative',
  flexShrink: 0,
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80%',
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
    opacity: 0.3,
  }
}));

const AdminSidebar = ({ 
  open, 
  onClose, 
  drawerWidth = 300, 
  activeMenu, 
  onMenuChange,
  sidebarOpen,
  onSidebarToggle
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { logout, user } = useAuthStore();
  const [hoveredItem, setHoveredItem] = useState(null);

  const isActive = (menuId) => activeMenu === menuId;

  const handleMenuItemClick = useCallback((item) => {
    if (item.disabled) return;

    if (item.syncWithState && item.id && onMenuChange) {
      onMenuChange(item.id);
    }

    if (item.path) {
      navigate(item.path);
    } else if (item.action) {
      item.action();
    }

    if (isMobile && onClose) {
      onClose();
    }
  }, [navigate, onMenuChange, isMobile, onClose]);

  // Enhanced admin menu with better organization
  const adminMenu = [
    { 
      id: 'dashboard', 
      text: 'Dashboard', 
      icon: <Dashboard />, 
      path: '/admin',
      description: 'Ringkasan sistem dan aktivitas',
      syncWithState: true
    },
    { 
      id: 'users', 
      text: 'Manajemen Pengguna', 
      icon: <People />, 
      path: '/admin/users',
      description: 'Kelola pengguna dan akses',
      syncWithState: true
    },
    { 
      id: 'unverified-users', 
      text: 'Unverified Users', 
      icon: <PersonAdd />, 
      path: '/admin/unverified-users',
      description: 'Verifikasi pengguna baru'
    },
    { 
      id: 'reports', 
      text: 'Semua Laporan', 
      icon: <Assignment />, 
      path: '/admin/reports',
      description: 'Monitor dan kelola laporan',
      syncWithState: true
    },
    { 
      id: 'chat', 
      text: 'Chat & Komunikasi', 
      icon: <Chat />, 
      path: '/admin/chat',
      description: 'Komunikasi dengan mahasiswa',
      syncWithState: true
    },
    { 
      id: 'analytics', 
      text: 'Analytics', 
      icon: <Analytics />, 
      path: '/admin/analytics',
      description: 'Analisis dan laporan statistik'
    },
    { 
      id: 'categories', 
      text: 'Kategori Laporan', 
      icon: <Category />, 
      path: '/admin/categories',
      description: 'Kelola kategori pengaduan'
    },
    { 
      id: 'audit-logs', 
      text: 'Audit Logs', 
      icon: <History />, 
      path: '/admin/audit-logs',
      description: 'Riwayat aktivitas admin'
    },
    { 
      id: 'system', 
      text: 'Sistem & Keamanan', 
      icon: <Security />, 
      path: '/admin/system',
      description: 'Pengaturan sistem dan keamanan'
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const bottomMenu = [
    { 
      id: 'settings',
      text: 'Pengaturan', 
      icon: <Settings />, 
      path: '/admin/settings',
      description: 'Konfigurasi sistem',
      syncWithState: true
    },
    { 
      id: 'help',
      text: 'Bantuan', 
      icon: <HelpOutline />, 
      path: '/admin/help',
      description: 'Panduan dan dukungan',
      syncWithState: true
    },
    { 
      text: 'Logout', 
      icon: <Logout />, 
      action: handleLogout, 
      color: 'error.main',
      description: 'Keluar dari sistem'
    },
  ];

  const MenuSection = ({ title, items, spacing = 1 }) => (
    <Box sx={{ mb: sidebarOpen ? 1.5 : 1 }}>
      {title && !sidebarOpen && (
        // Mini divider for collapsed state
        <Box sx={{ 
          mx: 2, 
          my: 0.5, 
          height: 1, 
          bgcolor: alpha(theme.palette.divider, 0.3) 
        }} />
      )}
      {title && sidebarOpen && (
        <Typography 
          variant="overline" 
          sx={{ 
            px: 3, 
            py: 0.5, 
            display: 'block',
            fontWeight: 700,
            fontSize: '0.75rem',
            color: 'text.secondary',
            letterSpacing: '0.5px'
          }}
        >
          {title}
        </Typography>
      )}
      <List sx={{ py: spacing }}>
        {items.map((item) => (
          <Tooltip 
            key={item.id || item.text}
            title={!sidebarOpen ? item.text : ""} 
            placement="right"
            arrow
          >
            <StyledListItem 
              onClick={() => handleMenuItemClick(item)} 
              active={isActive(item.id) ? 1 : 0}
              collapsed={!sidebarOpen ? 1 : 0}
              onMouseEnter={() => setHoveredItem(item.id || item.text)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <ListItemIcon>
                {item.badge ? (
                  <Badge 
                    badgeContent={item.badge} 
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        animation: 'pulse 2s infinite',
                        fontSize: sidebarOpen ? '0.75rem' : '0.6rem',
                        minWidth: sidebarOpen ? 20 : 16,
                        height: sidebarOpen ? 20 : 16,
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.1)' },
                          '100%': { transform: 'scale(1)' }
                        }
                      }
                    }}
                  >
                    {item.icon}
                  </Badge>
                ) : item.icon}
              </ListItemIcon>
              {sidebarOpen && (
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{ 
                    color: item.color
                  }} 
                />
              )}
              <Box className="sidebar-item-indicator" />
            </StyledListItem>
          </Tooltip>
        ))}
      </List>
    </Box>
  );

  const drawerContent = (
    <Box sx={{
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
    }}>
      {/* Enhanced Header */}
      <Box sx={{ 
        p: sidebarOpen ? 3 : 1.5, 
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.main, 0.05)} 0%, 
          ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
        backdropFilter: 'blur(10px)',
        position: 'relative',
        minHeight: sidebarOpen ? 'auto' : 80,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: sidebarOpen ? 2 : 0, 
          mb: sidebarOpen ? 1 : 0,
          justifyContent: sidebarOpen ? 'flex-start' : 'center'
        }}>
          <UBHLogo size={sidebarOpen ? "large" : "small"} />
          {sidebarOpen && (
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2
              }}>
                Portal Admin
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8 }}>
                Sistem Pengaduan Mahasiswa
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Welcome message - only show when expanded */}
        {sidebarOpen && (
          <Box sx={{ 
            mt: 1, 
            p: 1.5, 
            borderRadius: 2, 
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <Typography variant="body2" color="primary" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
              Selamat datang, {user?.name || 'Admin'}!
            </Typography>
          </Box>
        )}
      </Box>

      {/* Enhanced Menu Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: sidebarOpen ? 1 : 0.5, minHeight: 0 }}>
        <MenuSection title="Menu Utama" items={adminMenu} spacing={0.5} />
        
        <Divider sx={{ mx: sidebarOpen ? 2 : 1, my: 1 }} />
        
        <MenuSection items={bottomMenu} spacing={0.5} />
      </Box>

      {/* Enhanced User Profile */}
      {sidebarOpen && (
        <UserProfileSection>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'success.main',
                width: 48,
                height: 48,
                boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.3)}`,
                border: `3px solid ${alpha(theme.palette.success.main, 0.1)}`
              }}
            >
              <AdminPanelSettings sx={{ fontSize: '1.5rem' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={700} noWrap sx={{ 
                color: 'text.primary',
                mb: 0.5 
              }}>
                {user?.name || 'Administrator'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ 
                opacity: 0.8,
                fontSize: '0.75rem'
              }}>
                {user?.email}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mt: 0.5 
              }}>
                <Box sx={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  bgcolor: 'success.main',
                }} />
                <Typography variant="caption" color="success.main" sx={{ 
                  fontSize: '0.7rem',
                  fontWeight: 500
                }}>
                  Online
                </Typography>
              </Box>
            </Box>
          </Box>
        </UserProfileSection>
      )}

      {/* Mini user indicator when collapsed */}
      {!sidebarOpen && (
        <Box sx={{ 
          p: 1.5, 
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Tooltip title={`${user?.name || 'Administrator'} - Admin Active`} placement="right" arrow>
            <Avatar 
              sx={{ 
                bgcolor: 'success.main',
                width: 36,
                height: 36,
                boxShadow: `0 2px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`
              }}
            >
              <AdminPanelSettings sx={{ fontSize: '1.2rem' }} />
            </Avatar>
          </Tooltip>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer 
        variant="temporary" 
        open={open} 
        onClose={onClose} 
        ModalProps={{ keepMounted: true }}
        sx={{ 
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            width: drawerWidth,
            background: `linear-gradient(180deg, 
              ${alpha(theme.palette.background.paper, 0.98)} 0%, 
              ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop Drawer */}
      <Box sx={{ position: 'relative', display: { xs: 'none', sm: 'block' } }}>
        <Drawer 
          variant="permanent"
          sx={{
            '& .MuiDrawer-paper': {
              position: 'relative',
              ...getDrawerPaperStyles(theme, sidebarOpen, drawerWidth)
            }
          }}
        >
          {drawerContent}
        </Drawer>
        
        <SidebarToggleButton 
          onClick={onSidebarToggle} 
          open={sidebarOpen}
        >
          <ChevronLeft />
        </SidebarToggleButton>
      </Box>
    </>
  );
};

export default AdminSidebar;