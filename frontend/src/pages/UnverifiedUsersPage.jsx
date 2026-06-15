import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  Avatar,
  IconButton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Fade,
  TablePagination,
  TextField,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { 
  CheckCircle, 
  Visibility, 
  PersonAdd,
  HowToReg,
  Cancel,
  MoreVert
} from '@mui/icons-material';
import { 
  getUnverifiedStudents, 
  verifyStudent, 
  bulkVerifyUsers,
  getUserById,
  rejectStudent
} from '../services/api';
import BulkOperationsToolbar from '../components/admin/BulkOperationsToolbar';
import StatCard from '../components/ui/StatCard';
import AdminSectionHeader from './admin/AdminSectionHeader';
import { format } from 'date-fns';

const UnverifiedUsersPage = () => {
  const headerCellSx = {
    fontWeight: 600,
    bgcolor: 'background.paper',
    backgroundImage: (theme) => `linear-gradient(${alpha(theme.palette.primary.main, 0.04)}, ${alpha(theme.palette.primary.main, 0.04)})`,
    py: 2
  };

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [viewUserDialog, setViewUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [ktmDialogOpen, setKtmDialogOpen] = useState(false);
  const [ktmImage, setKtmImage] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [userToReject, setUserToReject] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [actionUser, setActionUser] = useState(null);
  const { onMobileMenuClick } = useOutletContext() ?? {};

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const loadUnverifiedUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getUnverifiedStudents();
      setUsers(result.unverifiedStudents || []);
    } catch (error) {
      showSnackbar('Gagal memuat pengguna yang belum terverifikasi: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnverifiedUsers();
  }, [loadUnverifiedUsers]);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedUsers(users.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectOne = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleVerifyOne = async (userId) => {
    try {
      await verifyStudent(userId);
      showSnackbar('Pengguna berhasil diverifikasi', 'success');
      loadUnverifiedUsers();
      setSelectedUsers([]);
    } catch (error) {
      showSnackbar('Gagal memverifikasi pengguna: ' + error.message, 'error');
    }
  };

  const handleBulkVerify = async () => {
    try {
      const result = await bulkVerifyUsers(selectedUsers);
      showSnackbar(`Berhasil memverifikasi ${result.verified} pengguna`, 'success');
      loadUnverifiedUsers();
      setSelectedUsers([]);
    } catch (error) {
      showSnackbar('Gagal melakukan verifikasi massal: ' + error.message, 'error');
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const user = await getUserById(userId);
      setSelectedUser(user);
      setViewUserDialog(true);
    } catch (error) {
      showSnackbar('Gagal memuat detail pengguna: ' + error.message, 'error');
    }
  };

  const handleRejectClick = (user) => {
    setUserToReject(user);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason || rejectReason.trim().length < 5) {
      showSnackbar('Alasan penolakan minimal 5 karakter', 'error');
      return;
    }
    
    try {
      setRejectLoading(true);
      await rejectStudent(userToReject.id, rejectReason.trim());
      showSnackbar(`Pendaftaran ${userToReject.name} berhasil ditolak`, 'success');
      setRejectDialogOpen(false);
      setViewUserDialog(false); // Close user detail dialog if open
      loadUnverifiedUsers();
      
      // Remove from selected if it was selected
      if (selectedUsers.includes(userToReject.id)) {
        setSelectedUsers(prev => prev.filter(id => id !== userToReject.id));
      }
    } catch (error) {
      showSnackbar('Gagal menolak pendaftaran: ' + error.message, 'error');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleViewKTM = (ktmPath) => {
    const fullPath = `http://localhost:6060${ktmPath}`;
    setKtmImage(fullPath);
    setKtmDialogOpen(true);
  };

  const handleActionMenuOpen = (event, user) => {
    event.stopPropagation();
    setActionAnchorEl(event.currentTarget);
    setActionUser(user);
  };

  const handleActionMenuClose = () => {
    setActionAnchorEl(null);
    setActionUser(null);
  };

  const handleSelectedAction = (action) => {
    const user = actionUser;
    handleActionMenuClose();
    if (!user) return;

    if (action === 'detail') handleViewUser(user.id);
    if (action === 'reject') handleRejectClick(user);
    if (action === 'verify') handleVerifyOne(user.id);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated users
  const paginatedUsers = users.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Fade in timeout={300}>
      <Box>
        {/* Header */}
        <AdminSectionHeader
          title="Verifikasi Pengguna"
          subtitle="Kelola dan verifikasi pengguna baru yang mendaftar"
          onMobileMenuClick={onMobileMenuClick}
          onRefresh={loadUnverifiedUsers}
        />

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <StatCard
              title="Menunggu Verifikasi"
              value={users.length}
              icon={<PersonAdd />}
              color="#FF9800"
              subtitle="Perlu Ditinjau"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <StatCard
              title="Terpilih"
              value={selectedUsers.length}
              icon={<HowToReg />}
              color="#4CAF50"
              subtitle="Siap Diverifikasi"
            />
          </Grid>
        </Grid>

        {/* Bulk Operations Toolbar */}
        {selectedUsers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <BulkOperationsToolbar
              selectedCount={selectedUsers.length}
              type="users"
              onBulkVerify={handleBulkVerify}
              onClearSelection={() => setSelectedUsers([])}
            />
          </Box>
        )}

        {/* Users Table */}
        <Paper sx={{
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden'
        }}>
          <TableContainer sx={{ maxHeight: 600, overflowX: 'hidden' }}>
            <Table stickyHeader size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell 
                    padding="checkbox"
                    sx={{ ...headerCellSx, width: 48 }}
                  >
                    <Checkbox
                      checked={selectedUsers.length === users.length && users.length > 0}
                      indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ ...headerCellSx, width: { xs: '50%', md: '28%' } }}>
                    Pengguna
                  </TableCell>
                  <TableCell sx={{ ...headerCellSx, width: { xs: '28%', md: '16%' } }}>
                    NIM
                  </TableCell>
                  <TableCell sx={{ ...headerCellSx, width: '28%', display: { xs: 'none', md: 'table-cell' } }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ ...headerCellSx, width: '12%', display: { xs: 'none', lg: 'table-cell' } }}>
                    KTM
                  </TableCell>
                  <TableCell sx={{ ...headerCellSx, width: '14%', display: { xs: 'none', lg: 'table-cell' } }}>
                    Terdaftar
                  </TableCell>
                  <TableCell sx={{
                    ...headerCellSx,
                    width: 58,
                    textAlign: 'center'
                  }}>
                    Aksi
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary" fontWeight={600}>Memuat data...</Typography>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <Box sx={{ py: 4 }}>
                        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                        <Typography variant="h6" fontWeight={700} color="text.secondary">
                          Semua pengguna sudah diverifikasi
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tidak ada pengguna yang menunggu verifikasi
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user, index) => (
                    <Fade in timeout={200 + index * 50} key={user.id}>
                      <TableRow 
                        hover
                        sx={{ 
                          '&:hover': { 
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02) 
                          }
                        }}
                      >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectOne(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{
                            bgcolor: 'primary.main',
                            width: 34,
                            height: 34,
                            fontWeight: 800,
                            fontSize: '0.9rem'
                          }}>
                            {user.name?.[0]?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {user.name}
                            </Typography>
                            <Chip 
                              label={user.role === 'STUDENT' ? 'MAHASISWA' : user.role} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                              sx={{ fontWeight: 600, height: 20 }}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ overflowWrap: 'anywhere' }}>
                        <Typography
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace',
                            bgcolor: 'action.hover',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            display: 'inline-block',
                            fontWeight: 600
                          }}
                        >
                          {user.nim}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, overflowWrap: 'anywhere' }}>
                        <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        {user.ktmPath ? (
                          <Button
                            size="small"
                            onClick={() => handleViewKTM(user.ktmPath)}
                            variant="outlined"
                            sx={{ borderRadius: 2, fontWeight: 600 }}
                          >
                            Lihat KTM
                          </Button>
                        ) : (
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Tidak ada KTM
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        <Typography variant="body2" fontWeight={600}>
                          {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(event) => handleActionMenuOpen(event, user)}
                          aria-label={`Buka aksi untuk ${user.name}`}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </TableCell>
                      </TableRow>
                    </Fade>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={users.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Baris per halaman:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`
            }
            sx={{
              borderTop: '1px solid rgba(0,0,0,0.06)',
              bgcolor: (theme) => alpha(theme.palette.background.default, 0.3)
            }}
          />
        </Paper>

        <Menu
          anchorEl={actionAnchorEl}
          open={Boolean(actionAnchorEl)}
          onClose={handleActionMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={() => handleSelectedAction('detail')}>
            <ListItemIcon><Visibility fontSize="small" color="primary" /></ListItemIcon>
            <ListItemText>Lihat detail</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleSelectedAction('verify')}>
            <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
            <ListItemText>Verifikasi</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleSelectedAction('reject')}>
            <ListItemIcon><Cancel fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Tolak</ListItemText>
          </MenuItem>
        </Menu>

        {/* KTM Image Dialog */}
        <Dialog 
          open={ktmDialogOpen} 
          onClose={() => setKtmDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 4 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Kartu Tanda Mahasiswa (KTM)</DialogTitle>
          <DialogContent>
            {ktmImage && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                minHeight: 300,
                bgcolor: 'action.hover',
                borderRadius: 2,
                p: 2
              }}>
                <img 
                  src={ktmImage} 
                  alt="KTM" 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto',
                    borderRadius: '8px'
                  }}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                    e.target.alt = 'Gagal memuat gambar';
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button 
              onClick={() => setKtmDialogOpen(false)}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Tutup
            </Button>
          </DialogActions>
        </Dialog>

        {/* User Detail Dialog */}
        <Dialog 
          open={viewUserDialog} 
          onClose={() => setViewUserDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 4 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Detail Pengguna</DialogTitle>
          <DialogContent dividers>
            {selectedUser && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Nama
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {selectedUser.name}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {selectedUser.email}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    NIM
                  </Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight={700}
                    sx={{ 
                      fontFamily: 'monospace',
                      bgcolor: 'action.hover',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      display: 'inline-block'
                    }}
                  >
                    {selectedUser.nim}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Peran
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip 
                      label={selectedUser.role} 
                      color="primary" 
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Tanggal Daftar
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {format(new Date(selectedUser.createdAt), 'dd MMM yyyy, HH:mm')}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button 
              onClick={() => setViewUserDialog(false)}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Tutup
            </Button>
            {selectedUser && (
              <>
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => handleRejectClick(selectedUser)}
                  sx={{ borderRadius: 2, fontWeight: 600, ml: 'auto', mr: 1 }}
                >
                  Tolak
                </Button>
                <Button 
                  variant="contained" 
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => {
                    handleVerifyOne(selectedUser.id);
                    setViewUserDialog(false);
                  }}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  Verifikasi
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Reject User Dialog */}
        <Dialog
          open={rejectDialogOpen}
          onClose={() => !rejectLoading && setRejectDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 4 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>
            Tolak Pendaftaran
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Anda akan menolak pendaftaran untuk mahasiswa <strong>{userToReject?.name}</strong> ({userToReject?.nim}).
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Mahasiswa ini tidak akan bisa login ke sistem dan harus mendaftar ulang. Email penolakan akan dikirimkan otomatis.
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Alasan Penolakan"
              placeholder="Contoh: Foto KTM blur dan tidak terbaca jelas."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
              error={rejectReason.length > 0 && rejectReason.trim().length < 5}
              helperText={rejectReason.length > 0 && rejectReason.trim().length < 5 ? "Alasan minimal 5 karakter" : "Alasan ini akan dikirimkan ke email mahasiswa"}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button 
              onClick={() => setRejectDialogOpen(false)}
              disabled={rejectLoading}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Batal
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={handleRejectSubmit}
              disabled={rejectLoading || rejectReason.trim().length < 5}
              sx={{ borderRadius: 2, fontWeight: 600 }}
              startIcon={rejectLoading && <CircularProgress size={20} color="inherit" />}
            >
              {rejectLoading ? 'Memproses...' : 'Tolak Pendaftaran'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default UnverifiedUsersPage;

