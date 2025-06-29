import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, FormControl, InputLabel, Select, MenuItem,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Tooltip, LinearProgress, Avatar, Stack
} from '@mui/material';
import {
  People, Assignment, CheckCircle, PendingActions,
  Visibility, Edit, Delete, Restore, Search,
  Menu as MenuIcon, Notifications
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

// Store imports
import useAuthStore from '../stores/authStore';
import useUserStore from '../stores/userStore';
import useReportStore from '../stores/reportStore';
import useCategoryStore from '../stores/categoryStore';

// Component imports
import DashboardSidebar from '../components/dashboard/Sidebar';
import StatusChart from '../components/dashboard/StatusChart';
import RichTextDisplay from '../components/ui/RichTextDisplay';

const drawerWidth = 280;

// Status configurations
const STATUS_COLORS = {
  PENDING: '#FFC107',
  IN_REVIEW: '#2196F3',
  IN_PROGRESS: '#FF9800',
  RESOLVED: '#4CAF50',
  REJECTED: '#F44336',
  CANCELED: '#9E9E9E'
};

const STATUS_LABELS = {
  PENDING: 'Menunggu',
  IN_REVIEW: 'Ditinjau',
  IN_PROGRESS: 'Diproses',
  RESOLVED: 'Selesai',
  REJECTED: 'Ditolak',
  CANCELED: 'Dibatalkan'
};

// Enhanced StatCard component with better animations and design
const StatCard = ({ title, value, icon, color = 'primary', subtitle, showProgress = false, progressValue = 0 }) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: alpha(theme.palette[color].main, 0.1),
          color: theme.palette[color].main
        }}>
          {icon}
        </Box>
      </Box>
      
      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
        {value.toLocaleString()}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" fontWeight={500}>
        {title}
      </Typography>
      
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {subtitle}
        </Typography>
      )}
      
      {showProgress && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={progressValue} 
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: alpha(theme.palette[color].main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                bgcolor: theme.palette[color].main,
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {Math.round(progressValue)}% completion rate
          </Typography>
        </Box>
      )}
    </Paper>
  );
};



// Main Admin Dashboard Component
const AdminDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Store hooks
  const { 
    users, 
    stats, 
    loading: userLoading, 
    error: userError,
    getAllUsers, 
    getUserStats, 
    verifyStudent, 
    deleteUser, 
    restoreUser,
    updateUser,

  } = useUserStore();
  
  const { 
    reports, 
    loading: reportLoading, 
    getAllReports, 
    updateReportStatus, 
    deleteReport, 
    restoreReport 
  } = useReportStore();
  
  const { categories, getCategories } = useCategoryStore();

  // Local state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('');
  const [editUserDialog, setEditUserDialog] = useState({ open: false, user: null });
  const [statusUpdateDialog, setStatusUpdateDialog] = useState({ open: false, report: null, newStatus: '' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', action: null });


  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          getAllUsers(true),
          getUserStats(),
          getAllReports({}, false),
          getCategories()
        ]);

      } catch (error) {
        console.error('Failed to load admin data:', error);
      }
    };

    if (user?.role === 'ADMIN') {
      loadData();
    }
  }, [user, getAllUsers, getUserStats, getAllReports, getCategories]);

  // Handler functions
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };



  // Calculate statistics
  const reportStats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'PENDING').length,
    inProgress: reports.filter(r => ['IN_REVIEW', 'IN_PROGRESS'].includes(r.status)).length,
    resolved: reports.filter(r => r.status === 'RESOLVED').length
  };

  // Prepare chart data
  const chartData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: reports.filter(r => r.status === key).length,
    color: STATUS_COLORS[key]
  })).filter(item => item.value > 0);



  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <IconButton
                    color="inherit"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ display: { sm: 'none' }, mr: 2, mb: 2 }}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 1 }}>
                    Admin Dashboard
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Kelola pengguna, laporan, dan sistem secara keseluruhan
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

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid xs={12} sm={6} lg={3}>
                <StatCard
                  title="Total Pengguna"
                  value={stats?.total || 0}
                  icon={<People />}
                  color="primary"
                />
              </Grid>
              
              <Grid xs={12} sm={6} lg={3}>
                <StatCard
                  title="Total Laporan"
                  value={reportStats.total}
                  icon={<Assignment />}
                  color="success"
                  showProgress
                  progressValue={reportStats.total ? (reportStats.resolved / reportStats.total) * 100 : 0}
                  subtitle="Completion rate"
                />
              </Grid>
              
              <Grid xs={12} sm={6} lg={3}>
                <StatCard
                  title="Laporan Selesai"
                  value={reportStats.resolved}
                  icon={<CheckCircle />}
                  color="warning"
                />
              </Grid>
              
              <Grid xs={12} sm={6} lg={3}>
                <StatCard
                  title="Butuh Verifikasi"
                  value={stats?.unverified || 0}
                  icon={<PendingActions />}
                  color="secondary"
                />
              </Grid>
            </Grid>

            {/* Reports Chart - Full Width */}
            <Box sx={{ width: '100%', mx: 0, mb: 4 }}>
              <StatusChart data={chartData} />
            </Box>
          </>
        );

      case 'users':
        return (
          <>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <IconButton
                    color="inherit"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ display: { sm: 'none' }, mr: 2, mb: 2 }}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 1 }}>
                    Manajemen Pengguna
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Kelola pengguna, verifikasi, dan hak akses sistem
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* User Management Table */}
            <UserManagementTable
              users={users}
              loading={userLoading}
              onVerifyUser={async (userId) => {
                try {
                  await verifyStudent(userId);
                  await getUserStats();
                } catch (error) {
                  console.error('Failed to verify user:', error);
                }
              }}
              onDeleteUser={(userId) => {
                setConfirmDialog({
                  open: true,
                  title: 'Hapus Pengguna',
                  message: 'Apakah Anda yakin ingin menghapus pengguna ini? Aksi ini dapat dibatalkan nanti.',
                  action: async () => {
                    try {
                      await deleteUser(userId);
                      await getUserStats();
                      setConfirmDialog({ open: false, title: '', message: '', action: null });
                    } catch (error) {
                      console.error('Failed to delete user:', error);
                    }
                  }
                });
              }}
              onRestoreUser={async (userId) => {
                try {
                  await restoreUser(userId);
                  await getUserStats();
                } catch (error) {
                  console.error('Failed to restore user:', error);
                }
              }}
              onEditUser={(user) => setEditUserDialog({ open: true, user })}
              searchQuery={userSearchQuery}
              onSearchChange={setUserSearchQuery}
              statusFilter={userStatusFilter}
              onStatusChange={setUserStatusFilter}
            />
          </>
        );

      case 'reports':
        return (
          <>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <IconButton
                    color="inherit"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ display: { sm: 'none' }, mr: 2, mb: 2 }}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 1 }}>
                    Manajemen Laporan
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Kelola semua laporan, update status, dan monitor progress
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Reports Management Table */}
            <ReportsManagementTable
              reports={reports}
              loading={reportLoading}
              onUpdateStatus={(report) => setStatusUpdateDialog({ open: true, report, newStatus: report.status })}
              onDeleteReport={(reportId) => {
                setConfirmDialog({
                  open: true,
                  title: 'Hapus Laporan',
                  message: 'Apakah Anda yakin ingin menghapus laporan ini? Aksi ini dapat dibatalkan nanti.',
                  action: async () => {
                    try {
                      await deleteReport(reportId);
                      setConfirmDialog({ open: false, title: '', message: '', action: null });
                    } catch (error) {
                      console.error('Failed to delete report:', error);
                    }
                  }
                });
              }}
              onRestoreReport={async (reportId) => {
                try {
                  await restoreReport(reportId);
                } catch (error) {
                  console.error('Failed to restore report:', error);
                }
              }}
              searchQuery={reportSearchQuery}
              onSearchChange={setReportSearchQuery}
              statusFilter={reportStatusFilter}
              onStatusChange={setReportStatusFilter}
              categories={categories}
            />
          </>
        );

      default:
        return (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" color="text.secondary">
              Menu "{activeMenu}" belum tersedia
            </Typography>
          </Box>
        );
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <Box sx={{ display: 'flex', bgcolor: '#f5f7fa', minHeight: '100vh' }}>
        <Box sx={{ p: 3, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Alert severity="error">Akses ditolak. Halaman ini khusus untuk administrator.</Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ 
          width: { sm: drawerWidth }, 
          flexShrink: { sm: 0 },
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <DashboardSidebar 
          open={mobileOpen} 
          onClose={handleDrawerToggle}
          drawerWidth={drawerWidth}
          activeMenu={activeMenu}
          onMenuChange={setActiveMenu}
        />
      </Box>
      
            {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: '#f8f9fa',
          maxWidth: '100%',
          overflow: 'hidden'
        }}
      >
        {renderContent()}

        {/* Dialogs */}
        {/* Edit User Dialog */}
        <Dialog 
          open={editUserDialog.open} 
          onClose={() => setEditUserDialog({ open: false, user: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Pengguna</DialogTitle>
          <DialogContent>
            {editUserDialog.user && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Nama"
                  defaultValue={editUserDialog.user.name}
                  fullWidth
                  id="edit-name"
                />
                <TextField
                  label="Email"
                  defaultValue={editUserDialog.user.email}
                  fullWidth
                  id="edit-email"
                />
                <TextField
                  label="NIM"
                  defaultValue={editUserDialog.user.nim || ''}
                  fullWidth
                  id="edit-nim"
                />
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditUserDialog({ open: false, user: null })}>
              Batal
            </Button>
            <Button 
              variant="contained"
              onClick={async () => {
                const name = document.getElementById('edit-name').value;
                const email = document.getElementById('edit-email').value;
                const nim = document.getElementById('edit-nim').value;
                try {
                  await updateUser(editUserDialog.user.id, { name, email, nim });
                  setEditUserDialog({ open: false, user: null });
                } catch (error) {
                  console.error('Failed to update user:', error);
                }
              }}
            >
              Simpan
            </Button>
          </DialogActions>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog 
          open={statusUpdateDialog.open} 
          onClose={() => setStatusUpdateDialog({ open: false, report: null, newStatus: '' })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Update Status Laporan</DialogTitle>
          <DialogContent>
            {statusUpdateDialog.report && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Laporan: {statusUpdateDialog.report.title}
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Status Baru</InputLabel>
                  <Select
                    value={statusUpdateDialog.newStatus}
                    label="Status Baru"
                    onChange={(e) => setStatusUpdateDialog(prev => ({ ...prev, newStatus: e.target.value }))}
                  >
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <MenuItem key={key} value={key}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusUpdateDialog({ open: false, report: null, newStatus: '' })}>
              Batal
            </Button>
            <Button 
              variant="contained"
              onClick={async () => {
                try {
                  await updateReportStatus(statusUpdateDialog.report.id, statusUpdateDialog.newStatus);
                  setStatusUpdateDialog({ open: false, report: null, newStatus: '' });
                } catch (error) {
                  console.error('Failed to update report status:', error);
                }
              }}
            >
              Update Status
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, title: '', message: '', action: null })}>
          <DialogTitle>{confirmDialog.title}</DialogTitle>
          <DialogContent>
            <Typography>{confirmDialog.message}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog({ open: false, title: '', message: '', action: null })}>
              Batal
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={confirmDialog.action}
            >
              Konfirmasi
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

// User Management Table Component (moved to separate component for better organization)
const UserManagementTable = ({ 
  users, 
  loading, 
  onVerifyUser, 
  onDeleteUser, 
  onRestoreUser, 
  onEditUser,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange 
}) => {
  const navigate = useNavigate();

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.nim && user.nim.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === '' || 
                         (statusFilter === 'verified' && user.isVerified) ||
                         (statusFilter === 'unverified' && !user.isVerified) ||
                         (statusFilter === 'deleted' && user.deletedAt);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      {/* Search and Filters */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <TextField
          size="small"
          placeholder="Cari pengguna..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ 
            minWidth: 250,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            }
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => onStatusChange(e.target.value)}
            sx={{ borderRadius: 3 }}
          >
            <MenuItem value="">Semua</MenuItem>
            <MenuItem value="verified">Terverifikasi</MenuItem>
            <MenuItem value="unverified">Belum Verifikasi</MenuItem>
            <MenuItem value="deleted">Terhapus</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ p: 8, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      ) : filteredUsers.length === 0 ? (
        <Box sx={{ p: 8, textAlign: 'center' }}>
          <People sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Tidak ada pengguna ditemukan
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sesuaikan filter pencarian Anda
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Pengguna</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>NIM</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tanggal Daftar</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} sx={{ 
                  '&:hover': { bgcolor: 'grey.50' },
                  borderBottom: '1px solid rgba(0,0,0,0.05)'
                }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.nim || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role}
                      size="small"
                      color={user.role === 'ADMIN' ? 'error' : 'primary'}
                      variant="outlined"
                      sx={{ borderRadius: 2 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip 
                        label={user.isVerified ? 'Terverifikasi' : 'Belum Verifikasi'}
                        size="small"
                        color={user.isVerified ? 'success' : 'warning'}
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                      />
                      {user.deletedAt && (
                        <Chip 
                          label="Terhapus"
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ borderRadius: 2 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(user.createdAt).toLocaleDateString('id-ID')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Lihat Detail">
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Implement user detail view later
                            alert(`Lihat detail user: ${user.name}`);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      
                      {!user.deletedAt && !user.isVerified && user.role === 'MAHASISWA' && (
                        <Tooltip title="Verifikasi">
                          <IconButton 
                            size="small"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();

                              onVerifyUser(user.id);
                            }}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {!user.deletedAt && (
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();

                              onEditUser(user);
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {user.deletedAt ? (
                        <Tooltip title="Pulihkan">
                          <IconButton 
                            size="small"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();

                              onRestoreUser(user.id);
                            }}
                          >
                            <Restore />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Hapus">
                          <IconButton 
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();

                              onDeleteUser(user.id);
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

// Reports Management Table Component
const ReportsManagementTable = ({
  reports,
  loading,
  onUpdateStatus,
  onDeleteReport,
  onRestoreReport,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categories
}) => {
  const navigate = useNavigate();

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === '' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      {/* Search and Filters */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <TextField
          size="small"
          placeholder="Cari laporan..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ 
            minWidth: 250,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            }
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => onStatusChange(e.target.value)}
            sx={{ borderRadius: 3 }}
          >
            <MenuItem value="">Semua Status</MenuItem>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <MenuItem key={key} value={key}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ p: 8, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      ) : filteredReports.length === 0 ? (
        <Box sx={{ p: 8, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Tidak ada laporan ditemukan
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sesuaikan filter pencarian Anda
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>No. Registrasi</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Judul Laporan</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Pelapor</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Kategori</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tanggal</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id} sx={{ 
                  '&:hover': { bgcolor: 'grey.50' },
                  borderBottom: '1px solid rgba(0,0,0,0.05)'
                }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {report.registrationNumber}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                      {report.title}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <RichTextDisplay 
                        content={report.description}
                        variant="caption"
                        maxLines={2}
                        showFullButton={false}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {report.user?.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={report.category?.name || 'Tanpa Kategori'}
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: 2 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={STATUS_LABELS[report.status]}
                      size="small"
                      sx={{ 
                        bgcolor: alpha(STATUS_COLORS[report.status], 0.1),
                        color: STATUS_COLORS[report.status],
                        fontWeight: 600,
                        borderRadius: 2
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(report.createdAt).toLocaleDateString('id-ID')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Lihat Detail">
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Implement report detail view later
                            alert(`Lihat detail laporan: ${report.title}`);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      
                      {!report.deletedAt && (
                        <Tooltip title="Update Status">
                          <IconButton 
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();

                              onUpdateStatus(report);
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {report.deletedAt ? (
                        <Tooltip title="Pulihkan">
                          <IconButton 
                            size="small"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();

                              onRestoreReport(report.id);
                            }}
                          >
                            <Restore />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Hapus">
                          <IconButton 
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();

                              onDeleteReport(report.id);
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AdminDashboard;
