import React, { useState } from 'react';
import {
  Fade,
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  TextField,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import AdminSectionHeader from './admin/AdminSectionHeader';
import {
  Security,
  Delete,
  CleaningServices,
  Storage,
  Info,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import {
  cleanupOldDeletedUsers,
  cleanupOldAuditLogs
} from '../services/api';
import getApiErrorMessage from '../utils/getApiErrorMessage';

const SystemSecurityPage = () => {
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupType, setCleanupType] = useState('');
  const [daysOld, setDaysOld] = useState(90);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const { onMobileMenuClick } = useOutletContext() ?? {};

  const handleCleanupOpen = (type) => {
    setCleanupType(type);
    setDaysOld(type === 'audit' ? 365 : 90);
    setCleanupDialogOpen(true);
  };

  const handleCleanupSubmit = async () => {
    try {
      let result;
      if (cleanupType === 'users') {
        result = await cleanupOldDeletedUsers(daysOld);
        showSnackbar(`Berhasil membersihkan ${result.deleted || 0} pengguna lama yang telah dihapus`, 'success');
      } else if (cleanupType === 'audit') {
        result = await cleanupOldAuditLogs(daysOld);
        showSnackbar(`Berhasil membersihkan ${result.deleted || 0} log audit lama`, 'success');
      }
      setCleanupDialogOpen(false);
    } catch (error) {
      showSnackbar(`Pembersihan gagal: ${getApiErrorMessage(error)}`, 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Fade in timeout={300}>
      <Box>
        {/* Header */}
        <AdminSectionHeader
          title="Sistem & Keamanan"
          subtitle="Pemeliharaan sistem dan pengaturan keamanan"
          onMobileMenuClick={onMobileMenuClick}
          showRefresh={false}
        />

      <Grid container spacing={3}>
        {/* System Info */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Info color="primary" />
              <Typography variant="h6">Informasi Sistem</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Status Sistem"
                  secondary="Beroperasi"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Storage fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Database"
                  secondary="MySQL - Terhubung"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Security fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Autentikasi"
                  secondary="JWT dengan token penyegaran"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Security Features */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Security color="primary" />
              <Typography variant="h6">Fitur Keamanan</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Pencatatan Audit"
                  secondary="Seluruh tindakan admin dicatat"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Akses Berbasis Peran"
                  secondary="Perlindungan akses khusus administrator"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Penghapusan Lunak"
                  secondary="Data masih dapat dipulihkan"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Pelacakan Perangkat"
                  secondary="Pengelolaan sesi pada beberapa perangkat"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Database Cleanup */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CleaningServices color="warning" />
              <Typography variant="h6">Pembersihan Basis Data</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Peringatan: proses pembersihan tidak dapat dibatalkan
              </Typography>
              <Typography variant="caption">
                Buat cadangan basis data sebelum menjalankan proses pembersihan.
              </Typography>
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Delete color="error" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        Bersihkan Pengguna Terhapus
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Hapus permanen pengguna yang telah dihapus secara lunak melebihi jumlah hari yang ditentukan.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={() => handleCleanupOpen('users')}
                    >
                      Bersihkan Pengguna
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Delete color="error" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        Bersihkan Log Audit
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Hapus log audit yang lebih lama dari jumlah hari yang ditentukan untuk mengosongkan ruang basis data.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={() => handleCleanupOpen('audit')}
                    >
                      Bersihkan Log
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Best Practices */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Warning color="info" />
              <Typography variant="h6">Praktik Terbaik</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List>
              <ListItem>
                <ListItemText
                  primary="Pencadangan Berkala"
                  secondary="Buat cadangan basis data sebelum operasi besar"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Pantau Log Audit"
                  secondary="Tinjau log audit secara berkala untuk mendeteksi aktivitas mencurigakan"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Retensi Data"
                  secondary="Simpan data terhapus selama 90 hari sebelum dibersihkan permanen"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Kebijakan Kata Sandi"
                  secondary="Terapkan kata sandi kuat dan perubahan berkala"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Cleanup Confirmation Dialog */}
      <Dialog open={cleanupDialogOpen} onClose={() => setCleanupDialogOpen(false)}>
        <DialogTitle>
          Konfirmasi Pembersihan
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Proses ini tidak dapat dibatalkan!
          </Alert>
          <Typography variant="body2" paragraph>
            {cleanupType === 'users'
              ? 'Semua pengguna yang telah dihapus secara lunak melebihi jumlah hari tersebut akan dihapus permanen.'
              : 'Semua log audit yang lebih lama dari jumlah hari tersebut akan dihapus permanen.'}
          </Typography>
          <TextField
            type="number"
            label="Usia Data (hari)"
            fullWidth
            value={daysOld}
            onChange={(e) => setDaysOld(parseInt(e.target.value))}
            inputProps={{ min: 1 }}
            helperText={`Hapus data yang berusia lebih dari ${daysOld} hari`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupDialogOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={handleCleanupSubmit}
            color="error"
            variant="contained"
          >
            Bersihkan
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
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </Fade>
  );
};

export default SystemSecurityPage;
