import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import AdminSectionHeader from './admin/AdminSectionHeader';
import {
  Box, Fade, Typography, Button, Grid, Switch,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Card, CardContent, FormControlLabel,
  Select, MenuItem, FormControl, InputLabel, Accordion, AccordionSummary,
  AccordionDetails, List, ListItem, IconButton, Tooltip, Stack, Chip
} from '@mui/material';
import {
  Notifications, Security, Language, ExpandMore, Smartphone, Computer, Tablet,
  Save, Visibility, VisibilityOff, Key, Logout
} from '@mui/icons-material';
import useAuthStore from '../stores/authStore';
import useSettingsStore from '../stores/settingsStore';

const AdminSettingsPage = () => {
  const { user, devices, logoutDevice, getUserDevices } = useAuthStore();
  
  const { settings, updateAllSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const { onMobileMenuClick } = useOutletContext() ?? {};

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null
  });

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
    alert('Pengaturan admin berhasil disimpan');
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
      const otherDevices = devices.filter(device => !device.isCurrent);
      for (const device of otherDevices) {
        await logoutDevice(device.id);
      }
      setConfirmDialog({ open: false, title: '', message: '', action: null });
    } catch (error) {
      console.error('Failed to logout from all devices:', error);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Password konfirmasi tidak cocok');
      return;
    }
    
    try {
      setPasswordDialog(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showPasswords: false
      });
      alert('Password berhasil diubah');
    } catch (error) {
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
    <Fade in timeout={300}>
      <Box>
        <AdminSectionHeader
          title="Pengaturan"
          subtitle="Kelola preferensi akun dan pengaturan aplikasi Anda"
          onMobileMenuClick={onMobileMenuClick}
          showRefresh={false}
        />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Notification Settings */}
            <Accordion defaultExpanded sx={{ mb: 2, borderRadius: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Notifications color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Notifikasi Sistem
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.notifications?.email || false}
                          onChange={handleSettingChange('notifications', 'email')}
                        />
                      }
                      label="Email Peringatan Sistem"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.notifications?.push || false}
                          onChange={handleSettingChange('notifications', 'push')}
                        />
                      }
                      label="Notifikasi Dasbor"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Language & Theme Settings */}
            <Accordion defaultExpanded sx={{ mb: 2, borderRadius: 2 }}>
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
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Bahasa</InputLabel>
                      <Select
                        value={localSettings.language || 'id'}
                        label="Bahasa"
                        onChange={handleSettingChange('', 'language')}
                      >
                        <MenuItem value="id">Bahasa Indonesia</MenuItem>
                        <MenuItem value="en">English</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Tema Admin</InputLabel>
                      <Select
                        value={localSettings.theme || 'light'}
                        label="Tema Admin"
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

            {/* Security Settings */}
            <Accordion sx={{ mb: 2, borderRadius: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Security color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Keamanan Akun
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Pastikan akun admin Anda selalu menggunakan password yang kuat.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<Key />}
                  onClick={() => setPasswordDialog(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Ubah Password Admin
                </Button>
              </AccordionDetails>
            </Accordion>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            {/* Device Management */}
            <Card sx={{ borderRadius: 2, mb: 3 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Smartphone color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Perangkat Aktif
                  </Typography>
                </Stack>
                <List disablePadding>
                  {devices?.map((device) => (
                    <ListItem key={device.id} sx={{ px: 0, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
                        {getDeviceIcon(device.deviceType)}
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {device.deviceName || 'Perangkat Tidak Dikenal'}
                            {device.isCurrent && (
                              <Chip label="Saat ini" size="small" color="primary" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                            )}
                          </Typography>
                          {(device.location || device.ipAddress) && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              📍 {device.location || 'Lokasi tidak diketahui'} {device.ipAddress ? `(IP: ${device.ipAddress})` : ''}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary" display="block">
                            ⏱ Akses: {formatLastAccess(device.lastAccess)}
                          </Typography>
                        </Box>
                      </Stack>
                      {!device.isCurrent && (
                        <Tooltip title="Keluar">
                          <IconButton
                            onClick={() => setConfirmDialog({
                              open: true,
                              title: 'Keluar dari Perangkat',
                              message: `Apakah Anda yakin ingin logout dari ${device.deviceName || 'perangkat ini'}?`,
                              action: () => handleLogoutFromDevice(device.id)
                            })}
                            color="error"
                            size="small"
                          >
                            <Logout fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItem>
                  ))}
                </List>
                {devices?.filter(d => !d.isCurrent).length > 0 && (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<Logout />}
                    onClick={() => setConfirmDialog({
                      open: true,
                      title: 'Keluar dari Semua Perangkat',
                      message: 'Keluar dari semua perangkat admin selain perangkat ini?',
                      action: handleLogoutFromAllDevices
                    })}
                    sx={{ mt: 2 }}
                  >
                    Keluar dari Perangkat Lain
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Save />}
              onClick={saveSettings}
              sx={{ borderRadius: 2, py: 1.5 }}
            >
              Simpan Pengaturan
            </Button>
          </Grid>
        </Grid>

        {/* Dialogs */}
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

        <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Ubah Password Admin</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="Password Saat Ini"
                type={passwordForm.showPasswords ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setPasswordForm(prev => ({ ...prev, showPasswords: !prev.showPasswords }))}
                      edge="end"
                      size="small"
                    >
                      {passwordForm.showPasswords ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  ),
                }}
              />
              <TextField
                fullWidth
                size="small"
                label="Password Baru"
                type={passwordForm.showPasswords ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              />
              <TextField
                fullWidth
                size="small"
                label="Konfirmasi Password Baru"
                type={passwordForm.showPasswords ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialog(false)}>Batal</Button>
            <Button onClick={handleChangePassword} variant="contained">Simpan</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default AdminSettingsPage;
