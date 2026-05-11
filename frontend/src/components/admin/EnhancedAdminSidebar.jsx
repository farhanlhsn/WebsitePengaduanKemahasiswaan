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
  useMediaQuery
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

// ─── Constants ───────────────────────────────────────────────────────────────
const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 64;

// ─── Styled Components ────────────────────────────────────────────────────────

/** Single menu item row */
const NavItem = styled(ListItem)(({ theme, active, collapsed }) => ({
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
  backgroundColor: active
    ? alpha(theme.palette.primary.main, 0.12)
    : 'transparent',
  border: `1.5px solid ${active ? alpha(theme.palette.primary.main, 0.3) : 'transparent'}`,

  '& .nav-icon': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
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
    fontWeight: active ? 700 : 500,
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    lineHeight: 1.3,
  },

  '&:hover': {
    backgroundColor: active
      ? alpha(theme.palette.primary.main, 0.18)
      : alpha(theme.palette.action.hover, 0.06),
    '& .nav-icon': { color: theme.palette.primary.main },
  },
}));

/** Floating toggle button — attached to the fixed sidebar edge */
const ToggleBtn = styled(IconButton)(({ theme, open }) => ({
  position: 'fixed',
  // Center vertically to top of sidebar, near header
  top: '1.5rem',
  // Position at the right edge of the sidebar
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

/** Profile strip at the bottom */
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

const AdminSidebar = ({
  open,
  onClose,
  drawerWidth = EXPANDED_WIDTH,
  activeMenu,
  onMenuChange,
  sidebarOpen,
  onSidebarToggle
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { logout, user } = useAuthStore();
  const [, setHoveredItem] = useState(null);

  const isActive = (id) => activeMenu === id;

  const handleClick = useCallback((item) => {
    if (item.disabled) return;
    if (item.syncWithState && item.id && onMenuChange) onMenuChange(item.id);
    if (item.path) navigate(item.path);
    else if (item.action) item.action();
    if (isMobile && onClose) onClose();
  }, [navigate, onMenuChange, isMobile, onClose]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ── Menu definitions ──────────────────────────────────────────────────────

  const mainMenu = [
    { id: 'dashboard',        text: 'Dashboard',           icon: <Dashboard />,         path: '/admin',                  syncWithState: true },
    { id: 'users',            text: 'Manajemen Pengguna',   icon: <People />,            path: '/admin/users',            syncWithState: true },
    { id: 'unverified-users', text: 'Unverified Users',     icon: <PersonAdd />,         path: '/admin/unverified-users' },
    { id: 'reports',          text: 'Semua Laporan',        icon: <Assignment />,        path: '/admin/reports',          syncWithState: true },
    { id: 'chat',             text: 'Chat & Komunikasi',    icon: <Chat />,              path: '/admin/chat',             syncWithState: true },
    { id: 'analytics',        text: 'Analytics',            icon: <Analytics />,         path: '/admin/analytics' },
    { id: 'categories',       text: 'Kategori Laporan',     icon: <Category />,          path: '/admin/categories' },
    { id: 'audit-logs',       text: 'Audit Logs',           icon: <History />,           path: '/admin/audit-logs' },
    { id: 'system',           text: 'Sistem & Keamanan',    icon: <Security />,          path: '/admin/system' },
  ];

  const bottomMenu = [
    { text: 'Pengaturan', icon: <Settings />,   path: '/admin/settings' },
    { text: 'Bantuan',    icon: <HelpOutline />, path: '/help' },
    { text: 'Logout',     icon: <Logout />,      action: handleLogout, color: 'error' },
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
          onClick={() => handleClick(item)}
          onMouseEnter={() => setHoveredItem(item.id || item.text)}
          onMouseLeave={() => setHoveredItem(null)}
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
    <Box sx={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

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
        {/* Logo — fixed 32×32 in both states */}
        <Box sx={{ flexShrink: 0, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UBHLogo size="small" style={{ width: 32, height: 32 }} />
        </Box>

        {/* Title — only visible when expanded */}
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
            Portal Admin
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', opacity: 0.8 }}>
            Sistem Pengaduan Mahasiswa
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
        {/* Main section label */}
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

        <List sx={{ py: 0 }}>
          {renderItems(bottomMenu)}
        </List>
      </Box>

      {/* ── User profile strip ───────────────────────────────────────── */}
      <ProfileStrip>
        <Tooltip title={!sidebarOpen ? (user?.name || 'Administrator') : ''} placement="right" arrow>
          <Avatar sx={{
            bgcolor: 'success.main',
            width: 30,
            height: 30,
            flexShrink: 0,
            border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
          }}>
            <AdminPanelSettings sx={{ fontSize: '0.95rem' }} />
          </Avatar>
        </Tooltip>

        {/* Name & email — fade out when collapsed */}
        <Box sx={{
          flex: 1,
          overflow: 'hidden',
          opacity: sidebarOpen ? 1 : 0,
          width: sidebarOpen ? 'auto' : 0,
          transition: 'opacity 0.2s ease, width 0.25s ease',
        }}>
          <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
            {user?.name || 'Administrator'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
            {user?.email}
          </Typography>
        </Box>

        {/* Online dot */}
        {sidebarOpen && (
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main', flexShrink: 0 }} />
        )}
      </ProfileStrip>
    </Box>
  );

  // ── Sidebar paper styles (used for permanent desktop drawer) ────────────────
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
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: 250,
    }),
  };

  return (
    <>
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

        {/* Toggle button — position:fixed so it floats correctly over the page */}
        <ToggleBtn open={sidebarOpen} onClick={onSidebarToggle} size="small">
          <ChevronLeft />
        </ToggleBtn>
      </Box>
    </>
  );
};

export default AdminSidebar;