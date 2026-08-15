import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  Avatar,
  Typography,
  Badge,
  IconButton,
  Tooltip,
  Divider,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Dashboard,
  Description,
  Assignment,
  AddCircle,
  Chat,
  Settings,
  HelpOutline,
  Help,
  Logout,
  AccountCircle,
  DevicesOther,
  ChevronLeft,
  Person,
} from '@mui/icons-material';
import { alpha, styled, useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { useTranslation } from '../../stores/settingsStore';
import useChatStore from '../../stores/chatStore';
import DeviceManagement from '../DeviceManagement';
import UBHLogo from '../ui/UBHLogo';

// ─── Constants ───────────────────────────────────────────────────────────────
const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 64;

// ─── Styled Components ────────────────────────────────────────────────────────

/** Single menu item row */
const NavItem = styled(ListItem)(({ theme, active, collapsed, isprimary }) => ({
  borderRadius: '0.625rem',
  padding: collapsed ? '0.5rem' : '0.5rem 0.875rem',
  margin: collapsed ? '0.125rem auto' : '0.125rem 0.5rem',
  width: collapsed ? `${COLLAPSED_WIDTH - 16}px` : 'auto',
  minHeight: '2.25rem',
  cursor: 'pointer',
  overflow: 'hidden',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: collapsed ? 'center' : 'flex-start',
  gap: collapsed ? 0 : '0.625rem',
  transition: 'all 0.25s ease',
  backgroundColor: isprimary
    ? alpha(theme.palette.primary.main, 0.1)
    : active
      ? alpha(theme.palette.primary.main, 0.12)
      : 'transparent',
  border: `1.5px solid ${
    isprimary
      ? alpha(theme.palette.primary.main, 0.25)
      : active
        ? alpha(theme.palette.primary.main, 0.3)
        : 'transparent'
  }`,

  '& .nav-icon': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: isprimary
      ? theme.palette.primary.main
      : active
        ? theme.palette.primary.main
        : theme.palette.text.secondary,
    transition: 'color 0.2s ease',
    '& svg': { fontSize: '1.2rem' },
  },

  '& .nav-label': {
    opacity: collapsed ? 0 : 1,
    width: collapsed ? 0 : 'auto',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.2s ease, width 0.25s ease',
    fontSize: '0.8125rem',
    fontWeight: active || isprimary ? 700 : 500,
    color: isprimary
      ? theme.palette.primary.main
      : active
        ? theme.palette.primary.main
        : theme.palette.text.primary,
    lineHeight: 1.3,
  },

  '&:hover': {
    backgroundColor: isprimary
      ? alpha(theme.palette.primary.main, 0.18)
      : active
        ? alpha(theme.palette.primary.main, 0.18)
        : alpha(theme.palette.action.hover, 0.06),
    '& .nav-icon': { color: theme.palette.primary.main },
  },
}));

/** Floating toggle button */
const ToggleBtn = styled(IconButton)(({ theme, open }) => ({
  position: 'fixed',
  top: '1.5rem',
  left: open ? `${EXPANDED_WIDTH - 14}px` : `${COLLAPSED_WIDTH - 14}px`,
  zIndex: 1300,
  width: 28,
  height: 28,
  backgroundColor: theme.palette.background.paper,
  border: `1.5px solid ${alpha(theme.palette.divider, 0.5)}`,
  boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.12)}`,
  transition: 'left 0.25s ease',

  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    borderColor: theme.palette.primary.main,
  },

  '& svg': {
    fontSize: '1rem',
    color: theme.palette.text.secondary,
    transition: 'transform 0.3s ease',
    transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
  },
}));

/** Profile strip at bottom */
const ProfileStrip = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  padding: '0.625rem 0.75rem',
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  overflow: 'hidden',
}));

// ─── Main Component ───────────────────────────────────────────────────────────

const StudentSidebar = ({
  open,
  onClose,
  onCreateReport,
  activeMenu,
  onMenuChange,
  sidebarOpen,
  onSidebarToggle
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const { totalUnread } = useChatStore();
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const isActive = (id) => activeMenu === id;

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const location = useLocation();

  const handleClick = (item) => {
    if (item.disabled) return;
    
    const isDashboardPath = location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    
    if (isDashboardPath) {
      if (item.action) item.action();
      if (item.path) navigate(item.path);
    } else {
      // If we click profile, settings, or help, redirect to their standalone routes
      if (item.id === 'profile') {
        navigate('/profile');
      } else if (item.id === 'settings') {
        navigate('/settings');
      } else if (item.id === 'help') {
        navigate('/help');
      } else if (['dashboard', 'reports', 'chat'].includes(item.id)) {
        navigate('/dashboard', { state: { activeMenu: item.id } });
      } else {
        if (item.action) item.action();
        if (item.path) navigate(item.path);
      }
    }
    if (isMobile && onClose) onClose();
  };

  // Enhanced menu with better organization and new items
  const mainMenu = [
    { 
      id: 'dashboard', 
      text: t('sidebar.dashboard'), 
      icon: <Dashboard />, 
      action: () => onMenuChange('dashboard'),
      description: t('sidebar.desc.dashboard')
    },
    { 
      id: 'reports', 
      text: t('sidebar.reports'), 
      icon: <Description />, 
      action: () => onMenuChange('reports'),
      description: t('sidebar.desc.reports')
    },
    { 
      id: 'chat', 
      text: t('sidebar.chat'), 
      icon: <Chat />, 
      action: () => onMenuChange('chat'), 
      badge: totalUnread > 0 ? totalUnread : null,
      description: t('sidebar.desc.chat')
    },
  ];

  // Quick action for creating reports
  const quickActions = [
    { 
      id: 'create', 
      text: t('sidebar.createReport'), 
      icon: <AddCircle />, 
      action: onCreateReport,
      primary: true,
      description: t('sidebar.desc.createReport')
    },
  ];

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = async () => {
    await logout();
    navigate('/login');
  };

  const bottomMenu = [
    { 
      id: 'profile',
      text: t('sidebar.profile'), 
      icon: <Person />, 
      action: () => {
        if (onMenuChange) {
          onMenuChange('profile');
        } else {
          navigate('/profile');
        }
      },
      description: t('sidebar.desc.profile')
    },
    { 
      text: t('sidebar.devices'), 
      icon: <DevicesOther />, 
      action: () => setDeviceModalOpen(true),
      description: t('sidebar.desc.devices')
    },
    { 
      id: 'settings',
      text: t('sidebar.settings'), 
      icon: <Settings />, 
      action: () => {
        if (onMenuChange) {
          onMenuChange('settings');
        } else {
          navigate('/settings');
        }
      },
      description: t('sidebar.desc.settings')
    },
    { 
      id: 'help',
      text: t('sidebar.help'), 
      icon: <HelpOutline />, 
      action: () => {
        if (onMenuChange) {
          onMenuChange('help');
        } else {
          navigate('/help');
        }
      },
      description: t('sidebar.desc.help')
    },
    { 
      text: t('sidebar.logout'), 
      icon: <Logout />, 
      action: handleLogout, 
      color: 'error',
      description: t('sidebar.desc.logout')
    },
  ];

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderItems = (items) =>
    items.map((item) => (
      <Tooltip
        key={item.id || item.text}
        title={!sidebarOpen ? item.text : ''}
        placement="right"
        arrow
        disableHoverListener={!!sidebarOpen}
      >
        <NavItem
          active={isActive(item.id) ? 1 : 0}
          collapsed={!sidebarOpen ? 1 : 0}
          isprimary={item.primary ? 1 : 0}
          onClick={() => handleClick(item)}
        >
          <Box className="nav-icon">
            {item.badge ? (
              <Badge badgeContent={item.badge} color="error">
                {item.icon}
              </Badge>
            ) : item.icon}
          </Box>
          <Box
            className="nav-label"
            sx={{ color: item.color === 'error' ? 'error.main' : undefined }}
          >
            {item.text}
          </Box>
        </NavItem>
      </Tooltip>
    ));

  // ── Drawer content ─────────────────────────────────────────────────────────

  const content = (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <Box sx={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: sidebarOpen ? 'flex-start' : 'center',
        gap: sidebarOpen ? '0.75rem' : 0,
        px: sidebarOpen ? '1rem' : 0,
        py: '0.875rem',
        overflow: 'hidden',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, transparent 100%)`,
        transition: 'padding 0.25s ease',
      }}>
        <Box sx={{ flexShrink: 0, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UBHLogo size="small" style={{ width: 32, height: 32 }} />
        </Box>

        <Box sx={{
          overflow: 'hidden',
          opacity: sidebarOpen ? 1 : 0,
          width: sidebarOpen ? 'auto' : 0,
          transition: 'opacity 0.2s ease, width 0.25s ease',
          whiteSpace: 'nowrap',
        }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '0.875rem',
            lineHeight: 1.2,
          }}>
            Pengaduan Mahasiswa
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', opacity: 0.8 }}>
            Universitas Bung Hatta
          </Typography>
        </Box>
      </Box>

      {/* ── Scrollable menu area ─────────────────────────────────────── */}
      <Box sx={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        py: '0.25rem',
        '&::-webkit-scrollbar': { width: 3 },
        '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.primary.main, 0.2), borderRadius: 4 },
      }}>
        {/* Quick action */}
        <List sx={{ py: 0, mb: 0.5 }}>
          {renderItems(quickActions)}
        </List>

        <Divider sx={{ mx: sidebarOpen ? '1rem' : '0.5rem', my: '0.25rem', opacity: 0.4 }} />

        {/* Main menu */}
        {sidebarOpen && (
          <Typography variant="overline" sx={{
            display: 'block',
            px: '1.25rem',
            pt: '0.25rem',
            pb: 0,
            fontSize: '0.6rem',
            fontWeight: 700,
            color: 'text.disabled',
            letterSpacing: '0.08em',
          }}>
            Menu Utama
          </Typography>
        )}
        <List sx={{ py: 0 }}>
          {renderItems(mainMenu)}
        </List>

        <Divider sx={{ mx: sidebarOpen ? '1rem' : '0.5rem', my: '0.25rem', opacity: 0.4 }} />

        {/* Bottom items */}
        <List sx={{ py: 0 }}>
          {renderItems(bottomMenu)}
        </List>
      </Box>

      {/* ── User profile strip ───────────────────────────────────────── */}
      <ProfileStrip>
        <Tooltip title={!sidebarOpen ? (user?.name || 'Mahasiswa') : ''} placement="right" arrow>
          <Avatar sx={{
            bgcolor: 'primary.main',
            width: 30,
            height: 30,
            flexShrink: 0,
            border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          }}>
            <AccountCircle sx={{ fontSize: '0.95rem' }} />
          </Avatar>
        </Tooltip>

        <Box sx={{
          flex: 1,
          overflow: 'hidden',
          opacity: sidebarOpen ? 1 : 0,
          width: sidebarOpen ? 'auto' : 0,
          transition: 'opacity 0.2s ease, width 0.25s ease',
        }}>
          <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
            {user?.name || 'Mahasiswa'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
            {user?.email}
          </Typography>
        </Box>

        {sidebarOpen && (
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main', flexShrink: 0 }} />
        )}
      </ProfileStrip>
    </Box>
  );

  // ── Sidebar paper styles ─────────────────────────────────────────────────
  const paperSx = {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100dvh',
    width: sidebarOpen ? `${EXPANDED_WIDTH}px` : `${COLLAPSED_WIDTH}px`,
    overflowX: 'hidden',
    overflowY: 'hidden',
    borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
    backdropFilter: 'blur(20px)',
    zIndex: 1200,
    borderRadius: 0,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: 250,
    }),
  };

  return (
    <>
      <DeviceManagement open={deviceModalOpen} onClose={() => setDeviceModalOpen(false)} />

      {/* ── Mobile: temporary drawer ──────────────────────────────────── */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: EXPANDED_WIDTH,
            height: '100dvh',
            background: paperSx.background,
            backdropFilter: 'blur(20px)',
            borderRadius: 0,
          },
        }}
      >
        {content}
      </Drawer>

      {/* ── Desktop: permanent drawer + spacer + toggle ───────────────── */}
      <Box sx={{
        display: { xs: 'none', sm: 'block' },
        flexShrink: 0,
        width: sidebarOpen ? `${EXPANDED_WIDTH}px` : `${COLLAPSED_WIDTH}px`,
        transition: theme.transitions.create('width', { easing: theme.transitions.easing.sharp, duration: 250 }),
      }}>
        <Drawer
          variant="permanent"
          sx={{ '& .MuiDrawer-paper': paperSx }}
        >
          {content}
        </Drawer>

        {/* Toggle button — fixed position so it floats at the sidebar edge */}
        <ToggleBtn open={sidebarOpen} onClick={onSidebarToggle} size="small">
          <ChevronLeft />
        </ToggleBtn>
      </Box>

      {/* Logout Confirmation Dialog */}
      <Dialog 
        open={logoutDialogOpen} 
        onClose={() => setLogoutDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ pb: 0.5, fontWeight: 800 }}>Konfirmasi Keluar</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Apakah Anda yakin ingin keluar dari sistem?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setLogoutDialogOpen(false)}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Batal
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={confirmLogout}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Ya, Keluar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StudentSidebar;
