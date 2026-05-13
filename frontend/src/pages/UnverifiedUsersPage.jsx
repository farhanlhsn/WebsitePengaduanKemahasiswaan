import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import {
  Box,
  Container,
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
  Tooltip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Fade,
  TablePagination
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { 
  CheckCircle, 
  Visibility, 
  Refresh,
  PersonAdd,
  HowToReg
} from '@mui/icons-material';
import { 
  getUnverifiedStudents, 
  verifyStudent, 
  bulkVerifyUsers,
  getUserById 
} from '../services/api';
import BulkOperationsToolbar from '../components/admin/BulkOperationsToolbar';
import StatCard from '../components/ui/StatCard';
import { format } from 'date-fns';

const UnverifiedUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [viewUserDialog, setViewUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [ktmDialogOpen, setKtmDialogOpen] = useState(false);
  const [ktmImage, setKtmImage] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadUnverifiedUsers();
  }, []);

  const loadUnverifiedUsers = async () => {
    try {
      setLoading(true);
      const result = await getUnverifiedStudents();
      setUsers(result.unverifiedStudents || []);
    } catch (error) {
      showSnackbar('Failed to load unverified users: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

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
      showSnackbar('User verified successfully', 'success');
      loadUnverifiedUsers();
      setSelectedUsers([]);
    } catch (error) {
      showSnackbar('Failed to verify user: ' + error.message, 'error');
    }
  };

  const handleBulkVerify = async () => {
    try {
      const result = await bulkVerifyUsers(selectedUsers);
      showSnackbar(`Successfully verified ${result.verified} users`, 'success');
      loadUnverifiedUsers();
      setSelectedUsers([]);
    } catch (error) {
      showSnackbar('Failed to bulk verify: ' + error.message, 'error');
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const user = await getUserById(userId);
      setSelectedUser(user);
      setViewUserDialog(true);
    } catch (error) {
      showSnackbar('Failed to load user details: ' + error.message, 'error');
    }
  };

  const handleViewKTM = (ktmPath) => {
    // Assuming KTM path is relative to uploads folder
    const fullPath = `http://localhost:6060${ktmPath}`;
    setKtmImage(fullPath);
    setKtmDialogOpen(true);
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
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Verifikasi Pengguna
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Kelola dan verifikasi pengguna baru yang mendaftar
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadUnverifiedUsers}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={6}>
            <StatCard
              title="Menunggu Verifikasi"
              value={users.length}
              icon={<PersonAdd />}
              color="#FF9800"
              subtitle="Perlu Ditinjau"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
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
          <Box sx={{ mb: 3 }}>
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
          borderRadius: 4, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
          border: '1px solid rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell 
                    padding="checkbox"
                    sx={{ 
                      bgcolor: (theme) => `${theme.palette.primary.main}0a`,
                      py: 2
                    }}
                  >
                    <Checkbox
                      checked={selectedUsers.length === users.length && users.length > 0}
                      indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    bgcolor: (theme) => `${theme.palette.primary.main}0a`,
                    py: 2 
                  }}>
                    Pengguna
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    bgcolor: (theme) => `${theme.palette.primary.main}0a`,
                    py: 2 
                  }}>
                    NIM
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    bgcolor: (theme) => `${theme.palette.primary.main}0a`,
                    py: 2 
                  }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    bgcolor: (theme) => `${theme.palette.primary.main}0a`,
                    py: 2 
                  }}>
                    KTM
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    bgcolor: (theme) => `${theme.palette.primary.main}0a`,
                    py: 2 
                  }}>
                    Terdaftar
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    bgcolor: (theme) => `${theme.palette.primary.main}0a`,
                    py: 2,
                    textAlign: 'center'
                  }}>
                    Aksi
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary" fontWeight={600}>Memuat data...</Typography>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
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
                            width: 40, 
                            height: 40,
                            fontWeight: 800
                          }}>
                            {user.name?.[0]?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {user.name}
                            </Typography>
                            <Chip 
                              label={user.role} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                              sx={{ fontWeight: 600, height: 20 }}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
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
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
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
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Lihat Detail">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewUser(user.id)}
                              color="primary"
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Verifikasi">
                            <IconButton 
                              size="small" 
                              onClick={() => handleVerifyOne(user.id)}
                              color="success"
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          </Box>
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
                    e.target.alt = 'Failed to load image';
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
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Nama
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {selectedUser.name}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {selectedUser.email}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
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
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Role
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip 
                      label={selectedUser.role} 
                      color="primary" 
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
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
            )}
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
      </Container>
    </AdminLayout>
  );
};

export default UnverifiedUsersPage;

