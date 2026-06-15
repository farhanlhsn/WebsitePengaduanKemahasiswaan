import React, { useState, useEffect } from 'react';
import {
  Box, Container, Paper, Typography, Button, Grid, Switch, Divider, Stack,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Card, CardContent, FormControlLabel,
  Select, MenuItem, FormControl, InputLabel, Accordion, AccordionSummary,
  AccordionDetails, List, ListItem, ListItemText, ListItemSecondaryAction,
  Chip, IconButton, Tooltip
} from '@mui/material';
import {
  ArrowBack, Notifications, Security, Language, Palette,
  Delete, Logout, ExpandMore, Smartphone, Computer, Tablet,
  Save, Visibility, VisibilityOff, Key, Email, Phone
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import useAuthStore from '../stores/authStore';
import useUserStore from '../stores/userStore';
import useSettingsStore from '../stores/settingsStore';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../services/api';

const SettingsPage = ({ isEmbedded = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, devices, logout, logoutDevice, getUserDevices } = useAuthStore();
  const { error, clearError } = useUserStore();

  const { settings, updateAllSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState(settings);

  // Sync local state if global settings change from elsewhere
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // State untuk dialog konfirmasi
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null
  });

  // State untuk perubahan password
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showPasswords: false
  });

  const [passwordDialog, setPasswordDialog] = useState(false);

  useEffect(() => {
    if (user) {
      getUserDevices();
    }
  }, [user, getUserDevices]);

  const handleSettingChange = (category, key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    
    setLocalSettings(prev => {
      if (category === '') {
        return { ...prev, [key]: value };
      }
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      };
    });
  };

  const saveSettings = async () => {
    updateAllSettings(localSettings);
    alert('Pengaturan berhasil disimpan');
  };

  const handleLogoutFromDevice = async (deviceId) => {
    try {
      await logoutDevice(deviceId);
      setConfirmDialog({ open: false, title: '', message: '', action: null });
    } catch (error) {
      console.error('Failed to logout from device:', error);
    }
  };

  const handleLogoutFromAllDevices = async () => {
    try {
      // Logout dari semua device kecuali yang current
      const otherDevices = devices.filter(device => !device.isCurrent);
      for (const device of otherDevices) {
        await logoutDevice(device.id);
      }
      setConfirmDialog({ open: false, title: '', message: '', action: null });
    } catch (error) {
      console.error('Failed to logout from all devices:', error);
    }
  };

  const handleDeleteAccount = () => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Akun',
      message: 'Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan dan semua data Anda akan hilang.',
      action: () => {
        // Implementasi delete account
        console.log('Delete account');
        setConfirmDialog({ open: false, title: '', message: '', action: null });
      }
    });
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Password konfirmasi tidak cocok');
      return;
    }

    try {
      const result = await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      setPasswordDialog(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showPasswords: false,
      });

      if (result?.data?.requireReLogin) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }

      alert(result?.message || 'Password berhasil diubah');
    } catch (error) {
      const message = error.response?.data?.message || 'Gagal mengubah password';
      alert(message);
      console.error('Failed to change password:', error);
    }
  };

  const getDeviceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'mobile':
        return <Smartphone />;
      case 'tablet':
        return <Tablet />;
      default:
        return <Computer />;
    }
  };

  const formatLastAccess = (dateString) => {
    if (!dateString) return 'Tidak diketahui';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: isEmbedded ? 'auto' : '100vh', bgcolor: isEmbedded ? 'transparent' : '#f8f9fa', py: isEmbedded ? 0 : 4 }}>
      {/* Back Button */}
      {!isEmbedded && (
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3, px: { xs: 2, sm: 4, md: 10 } }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
            variant="outlined"
            sx={{ 
              color: 'text.primary',
              borderColor: 'rgba(0,0,0,0.2)',
              borderRadius: 2,
              '&:hover': {
                borderColor: 'text.primary',
                bgcolor: 'rgba(0,0,0,0.05)'
              }
            }}
          >
            Kembali
          </Button>
        </Stack>
      )}

      <Container maxWidth={isEmbedded ? false : "md"} disableGutters={isEmbedded} sx={{ px: isEmbedded ? { xs: 2, sm: 0 } : 2 }}>
        {/* Header */}
        {!isEmbedded && (
          <Box sx={{ mb: 4, px: { xs: 2, md: 0 } }}>
            <Typography variant="h4" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
              Pengaturan
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Kelola preferensi akun dan pengaturan aplikasi Anda
            </Typography>
          </Box>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={clearError}
          >
            {error}
          </Alert>
        )}

        {/* Notification Settings */}
        <Accordion defaultExpanded sx={{ mb: 2, borderRadius: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Notifications color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Notifikasi
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.notifications.email}
                      onChange={handleSettingChange('notifications', 'email')}
                    />
                  }
                  label="Email Notifikasi"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.notifications.push}
                      onChange={handleSettingChange('notifications', 'push')}
                    />
                  }
                  label="Push Notifikasi"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.notifications.reportUpdates}
                      onChange={handleSettingChange('notifications', 'reportUpdates')}
                    />
                  }
                  label="Pembaruan Status Laporan"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.notifications.newFeatures}
                      onChange={handleSettingChange('notifications', 'newFeatures')}
                    />
                  }
                  label="Fitur Baru"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Privacy Settings */}
        <Accordion sx={{ mb: 2, borderRadius: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Security color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Privasi & Keamanan
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.privacy.showProfile}
                      onChange={handleSettingChange('privacy', 'showProfile')}
                    />
                  }
                  label="Tampilkan Profil Publik"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.privacy.showReports}
                      onChange={handleSettingChange('privacy', 'showReports')}
                    />
                  }
                  label="Tampilkan Laporan Saya"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.privacy.allowTracking}
                      onChange={handleSettingChange('privacy', 'allowTracking')}
                    />
                  }
                  label="Izinkan Tracking untuk Analitik"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  startIcon={<Key />}
                  onClick={() => setPasswordDialog(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Ubah Password
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Language & Theme Settings */}
        <Accordion sx={{ mb: 2, borderRadius: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Language color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Bahasa & Tampilan
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Bahasa</InputLabel>
                  <Select
                    value={localSettings.language}
                    label="Bahasa"
                    onChange={handleSettingChange('', 'language')}
                  >
                    <MenuItem value="id">Bahasa Indonesia</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tema</InputLabel>
                  <Select
                    value={localSettings.theme}
                    label="Tema"
                    onChange={handleSettingChange('', 'theme')}
                  >
                    <MenuItem value="light">Terang</MenuItem>
                    <MenuItem value="dark">Gelap</MenuItem>
                    <MenuItem value="auto">Otomatis</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Device Management */}
        <Accordion sx={{ mb: 2, borderRadius: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Smartphone color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Perangkat Tersambung
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {devices?.map((device) => (
                <ListItem key={device.id} sx={{ px: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
                    {getDeviceIcon(device.deviceType)}
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        {device.deviceName || 'Perangkat Tidak Dikenal'}
                        {device.isCurrent && (
                          <Chip label="Saat ini" size="small" color="primary" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Terakhir digunakan: {formatLastAccess(device.lastAccess)}
                      </Typography>
                    </Box>
                  </Stack>
                  {!device.isCurrent && (
                    <Tooltip title="Keluar dari perangkat ini">
                      <IconButton
                        onClick={() => setConfirmDialog({
                          open: true,
                          title: 'Keluar dari Perangkat',
                          message: `Apakah Anda yakin ingin logout dari ${device.deviceName || 'perangkat ini'}?`,
                          action: () => handleLogoutFromDevice(device.id)
                        })}
                        color="error"
                      >
                        <Logout />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListItem>
              ))}
            </List>
            {devices?.filter(d => !d.isCurrent).length > 0 && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<Logout />}
                onClick={() => setConfirmDialog({
                  open: true,
                  title: 'Keluar dari Semua Perangkat',
                  message: 'Apakah Anda yakin ingin logout dari semua perangkat lain?',
                  action: handleLogoutFromAllDevices
                })}
                sx={{ mt: 2, borderRadius: 2 }}
              >
                Keluar dari Semua Perangkat Lain
              </Button>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Save Settings Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={saveSettings}
            sx={{ borderRadius: 3, px: 4 }}
          >
            Simpan Pengaturan
          </Button>
        </Box>

        {/* Danger Zone */}
        <Card sx={{ borderRadius: 3, border: '2px solid', borderColor: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} color="error.main" gutterBottom>
              Zona Berbahaya
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tindakan berikut tidak dapat dibatalkan. Harap berhati-hati.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleDeleteAccount}
                sx={{ borderRadius: 2 }}
              >
                Hapus Akun Permanen
              </Button>
            </Box>
          </CardContent>
        </Card>

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
            <Button onClick={confirmDialog.action} color="error" variant="contained">
              Konfirmasi
            </Button>
          </DialogActions>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Ubah Password</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Password Saat Ini"
                type={passwordForm.showPasswords ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setPasswordForm(prev => ({ ...prev, showPasswords: !prev.showPasswords }))}
                      edge="end"
                    >
                      {passwordForm.showPasswords ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Password Baru"
                type={passwordForm.showPasswords ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              />
              <TextField
                fullWidth
                label="Konfirmasi Password Baru"
                type={passwordForm.showPasswords ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleChangePassword} variant="contained">
              Ubah Password
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default SettingsPage; 