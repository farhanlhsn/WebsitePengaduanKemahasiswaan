import React, { useState, useCallback, useMemo } from 'react';
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
  PersonAdd,
  SupervisorAccount
} from '@mui/icons-material';
import { alpha, styled, useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import UBHLogo from '../ui/UBHLogo';

// Width constants — exported for layout components that need them.
export const ADMIN_SIDEBAR_EXPANDED_WIDTH = 260;
export const ADMIN_SIDEBAR_COLLAPSED_WIDTH = 64;

/* ── Styled bits ─────────────────────────────────────────────────────── */

const NavItem = styled(ListItem)(({ theme, active, collapsed }) => ({
  borderRadius: '0.625rem',
  padding: collapsed ? '0.5rem' : '0.5rem 0.875rem',
  margin: collapsed ? '0.125rem auto' : '0.125rem 0.5rem',
  width: collapsed ? `${ADMIN_SIDEBAR_COLLAPSED_WIDTH - 16}px` : 'auto',
  minHeight: '2.25rem',
  cursor: 'pointer',
  overflow: 'hidden',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: collapsed ? 'center' : 'flex-start',
  gap: collapsed ? 0 : '0.625rem',
  transition: 'all 0.25s ease',
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
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

const ToggleBtn = styled(IconButton)(({ theme, open }) => ({
  position: 'fixed',
  top: '1.5rem',
  left: open ? `${ADMIN_SIDEBAR_EXPANDED_WIDTH - 14}px` : `${ADMIN_SIDEBAR_COLLAPSED_WIDTH - 14}px`,
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

const ProfileStrip = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  padding: '0.625rem 0.75rem',
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  overflow: 'hidden',
}));

/* ── Menu definitions ────────────────────────────────────────────────── */

const MAIN_MENU = [
  { id: 'dashboard',        text: 'Dashboard',           icon: <Dashboard />,    path: '/admin' },
  { id: 'users',            text: 'Manajemen Pengguna',  icon: <People />,       path: '/admin/users' },
  { id: 'unverified-users', text: 'Unverified Users',    icon: <PersonAdd />,    path: '/admin/unverified-users' },
  { id: 'reports',          text: 'Semua Laporan',       icon: <Assignment />,   path: '/admin/reports' },
  { id: 'chat',             text: 'Chat & Komunikasi',   icon: <Chat />,         path: '/admin/chat' },
  { id: 'analytics',        text: 'Analytics',           icon: <Analytics />,    path: '/admin/analytics' },
  { id: 'categories',       text: 'Kategori Laporan',    icon: <Category />,     path: '/admin/categories', superAdminOnly: true },
  { id: 'admin-management', text: 'Kelola Admin',        icon: <SupervisorAccount />, path: '/admin/admins',  superAdminOnly: true },
  { id: 'audit-logs',       text: 'Audit Logs',          icon: <History />,      path: '/admin/audit-logs', superAdminOnly: true },
  { id: 'system',           text: 'Sistem & Keamanan',   icon: <Security />,     path: '/admin/system' },
];

const BOTTOM_MENU = [
  { id: 'settings', text: 'Pengaturan', icon: <Settings />,    path: '/admin/settings' },
  { id: 'help',     text: 'Bantuan',    icon: <HelpOutline />, path: '/admin/help' },
];

/* ── Component ───────────────────────────────────────────────────────── */

const AdminSidebar = ({
  open,
  onClose,
  sidebarOpen,
  onSidebarToggle,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { logout, user } = useAuthStore();
  const [, setHoveredItem] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const isExpanded = isMobile || sidebarOpen;

  // Filter menus by role: SUPERADMIN-only items are hidden from regular ADMINs.
  const visibleMain = useMemo(
    () => MAIN_MENU.filter((m) => !m.superAdminOnly || isSuperAdmin),
    [isSuperAdmin]
  );

  // Active route detection — match by longest path prefix so /admin/users/123
  // still highlights the "users" entry.
  const activeId = useMemo(() => {
    const candidates = [...MAIN_MENU, ...BOTTOM_MENU]
      .filter((m) => m.path && location.pathname.startsWith(m.path))
      .sort((a, b) => b.path.length - a.path.length);
    if (candidates[0]) return candidates[0].id;
    // Fallback: exact /admin → dashboard
    if (location.pathname === '/admin' || location.pathname === '/admin/') return 'dashboard';
    return null;
  }, [location.pathname]);

  const handleClick = useCallback((item) => {
    if (item.path) navigate(item.path);
    else if (item.action) item.action();
    if (isMobile && onClose) onClose();
  }, [navigate, isMobile, onClose]);

  const confirmLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderItems = (items) =>
    items.map((item) => (
      <Tooltip
        key={item.id || item.text}
        title={!isExpanded ? item.text : ''}
        placement="right"
        arrow
        disableHoverListener={!!isExpanded}
      >
        <NavItem
          active={activeId === item.id ? 1 : 0}
          collapsed={!isExpanded ? 1 : 0}
          onClick={() => handleClick(item)}
          onMouseEnter={() => setHoveredItem(item.id || item.text)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <Box className="nav-icon">
            {item.badge ? (
              <Badge badgeContent={item.badge} color="error">{item.icon}</Badge>
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

  const content = (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isExpanded ? 'flex-start' : 'center',
        gap: isExpanded ? '0.75rem' : 0,
        px: isExpanded ? '1rem' : 0,
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
          opacity: isExpanded ? 1 : 0,
          width: isExpanded ? 'auto' : 0,
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
            {isSuperAdmin ? 'Portal Super Admin' : 'Portal Admin'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', opacity: 0.8 }}>
            Sistem Pengaduan Mahasiswa
          </Typography>
        </Box>
      </Box>

      <Box sx={{
        flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', py: '0.25rem',
        '&::-webkit-scrollbar': { width: 3 },
        '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.primary.main, 0.2), borderRadius: 4 },
      }}>
        {isExpanded && (
          <Typography variant="overline" sx={{
            display: 'block', px: '1.25rem', pt: '0.25rem', pb: 0,
            fontSize: '0.6rem', fontWeight: 700, color: 'text.disabled', letterSpacing: '0.08em',
          }}>
            Menu Utama
          </Typography>
        )}
        <List sx={{ py: 0 }}>{renderItems(visibleMain)}</List>
        <Divider sx={{ mx: isExpanded ? '1rem' : '0.5rem', my: '0.25rem', opacity: 0.4 }} />
        <List sx={{ py: 0 }}>{renderItems(BOTTOM_MENU)}</List>
        <Divider sx={{ mx: isExpanded ? '1rem' : '0.5rem', my: '0.25rem', opacity: 0.4 }} />
        <List sx={{ py: 0 }}>
          {renderItems([{ text: 'Logout', icon: <Logout />, action: () => setLogoutDialogOpen(true), color: 'error' }])}
        </List>
      </Box>

      <ProfileStrip>
        <Tooltip title={!isExpanded ? (user?.name || 'Administrator') : ''} placement="right" arrow>
          <Avatar sx={{
            bgcolor: isSuperAdmin ? 'warning.main' : 'success.main',
            width: 30, height: 30, flexShrink: 0,
            border: `2px solid ${alpha(isSuperAdmin ? theme.palette.warning.main : theme.palette.success.main, 0.3)}`,
          }}>
            <AdminPanelSettings sx={{ fontSize: '0.95rem' }} />
          </Avatar>
        </Tooltip>
        <Box sx={{
          flex: 1, overflow: 'hidden',
          opacity: isExpanded ? 1 : 0,
          width: isExpanded ? 'auto' : 0,
          transition: 'opacity 0.2s ease, width 0.25s ease',
        }}>
          <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
            {user?.name || (isSuperAdmin ? 'Super Admin' : 'Administrator')}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
            {user?.email}
          </Typography>
        </Box>
        {isExpanded && (
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main', flexShrink: 0 }} />
        )}
      </ProfileStrip>
    </Box>
  );

  const paperSx = {
    position: 'fixed', top: 0, left: 0, height: '100dvh',
    width: sidebarOpen ? `${ADMIN_SIDEBAR_EXPANDED_WIDTH}px` : `${ADMIN_SIDEBAR_COLLAPSED_WIDTH}px`,
    overflowX: 'hidden', overflowY: 'hidden',
    borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
    backdropFilter: 'blur(20px)',
    zIndex: 1200, borderRadius: 0,
    transition: theme.transitions.create('width', { easing: theme.transitions.easing.sharp, duration: 250 }),
  };

  return (
    <>
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: ADMIN_SIDEBAR_EXPANDED_WIDTH,
            height: '100dvh',
            background: paperSx.background,
            backdropFilter: 'blur(20px)',
            borderRadius: 0,
          },
        }}
      >
        {content}
      </Drawer>

      <Box sx={{
        display: { xs: 'none', sm: 'block' },
        flexShrink: 0,
        width: sidebarOpen ? `${ADMIN_SIDEBAR_EXPANDED_WIDTH}px` : `${ADMIN_SIDEBAR_COLLAPSED_WIDTH}px`,
        transition: theme.transitions.create('width', { easing: theme.transitions.easing.sharp, duration: 250 }),
      }}>
        <Drawer variant="permanent" sx={{ '& .MuiDrawer-paper': paperSx }}>
          {content}
        </Drawer>
        <ToggleBtn open={sidebarOpen} onClick={onSidebarToggle} size="small">
          <ChevronLeft />
        </ToggleBtn>
      </Box>

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
          <Button onClick={() => setLogoutDialogOpen(false)} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Batal
          </Button>
          <Button variant="contained" color="error" onClick={confirmLogout} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Ya, Keluar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminSidebar;
