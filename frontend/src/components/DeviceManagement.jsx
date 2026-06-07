import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, Chip, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Card, CardContent, Divider
} from '@mui/material';
import {
  DevicesOther, Smartphone, Computer, Tablet, 
  LogoutOutlined, DeleteOutline, AccessTime, LocationOn
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import useAuthStore from '../stores/authStore';
import GlassCard from '../components/ui/GlassCard';

const DeviceManagement = ({ open, onClose }) => {
  const theme = useTheme();
  const { 
    devices, 
    getUserDevices, 
    logoutDevice, 
    logoutAllOtherDevices, 
    loading, 
    error 
  } = useAuthStore();
  
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [logoutAllDialog, setLogoutAllDialog] = useState(false);

  useEffect(() => {
    if (open) {
      getUserDevices();
    }
  }, [open, getUserDevices]);

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
      case 'smartphone':
        return <Smartphone />;
      case 'tablet':
        return <Tablet />;
      case 'desktop':
      case 'computer':
        return <Computer />;
      default:
        return <DevicesOther />;
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

  const handleLogoutDevice = async () => {
    try {
      await logoutDevice(selectedDevice.id);
      setConfirmDialog(false);
      setSelectedDevice(null);
    } catch (error) {
      console.error('Failed to logout device:', error);
    }
  };

  const handleLogoutAllOther = async () => {
    try {
      await logoutAllOtherDevices();
      setLogoutAllDialog(false);
    } catch (error) {
      console.error('Failed to logout all other devices:', error);
    }
  };

  const currentDevice = devices.find(device => device.isCurrent);
  const otherDevices = devices.filter(device => !device.isCurrent);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DevicesOther color="primary" />
          <Typography variant="h5" fontWeight={700}>
            Manajemen Perangkat
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Kelola perangkat yang terhubung dengan akun Anda
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            {/* Current Device */}
            {currentDevice && (
              <>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Perangkat Saat Ini
                </Typography>
                <GlassCard variant="glass"
                  sx={{ 
                    mb: 3, 
                    border: `2px solid ${theme.palette.primary.main}`,
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    p: 0
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item>
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: 2, 
                          bgcolor: 'primary.main', 
                          color: 'white' 
                        }}>
                          {getDeviceIcon(currentDevice.deviceType)}
                        </Box>
                      </Grid>
                      <Grid item xs>
                        <Typography variant="h6" fontWeight={600}>
                          {currentDevice.deviceName || 'Perangkat Ini'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {currentDevice.location || 'Lokasi tidak diketahui'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <AccessTime fontSize="small" color="primary" />
                          <Typography variant="caption">
                            Login terakhir: {formatLastAccess(currentDevice.lastAccess)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item>
                        <Chip 
                          label="Aktif Sekarang" 
                          color="primary" 
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </GlassCard>
              </>
            )}

            {/* Other Devices */}
            {otherDevices.length > 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Perangkat Lain ({otherDevices.length})
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<LogoutOutlined />}
                    onClick={() => setLogoutAllDialog(true)}
                  >
                    Logout Semua
                  </Button>
                </Box>

                {otherDevices.map((device) => (
                  <GlassCard variant="glass" key={device.id} sx={{ mb: 2, p: 0 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item>
                          <Box sx={{ 
                            p: 1.5, 
                            borderRadius: 2, 
                            bgcolor: alpha(theme.palette.grey[500], 0.1) 
                          }}>
                            {getDeviceIcon(device.deviceType)}
                          </Box>
                        </Grid>
                        <Grid item xs>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {device.deviceName || 'Perangkat Tidak Dikenal'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {device.location || 'Lokasi tidak diketahui'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <AccessTime fontSize="small" color="text.secondary" />
                            <Typography variant="caption" color="text.secondary">
                              Login terakhir: {formatLastAccess(device.lastAccess)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item>
                          <IconButton
                            color="error"
                            onClick={() => {
                              setSelectedDevice(device);
                              setConfirmDialog(true);
                            }}
                          >
                            <LogoutOutlined />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </GlassCard>
                ))}
              </>
            )}

            {devices.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <DevicesOther sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Tidak ada perangkat aktif
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose}>
          Tutup
        </Button>
      </DialogActions>

      {/* Logout Device Confirmation */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Logout Perangkat</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin mengeluarkan perangkat "{selectedDevice?.deviceName || 'Tidak Dikenal'}" dari akun Anda?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Batal</Button>
          <Button onClick={handleLogoutDevice} color="error" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logout All Other Devices Confirmation */}
      <Dialog open={logoutAllDialog} onClose={() => setLogoutAllDialog(false)}>
        <DialogTitle>Logout Semua Perangkat Lain</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin mengeluarkan semua perangkat lain dari akun Anda? 
            Anda akan tetap login di perangkat saat ini.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutAllDialog(false)}>Batal</Button>
          <Button onClick={handleLogoutAllOther} color="error" variant="contained">
            Logout Semua
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default DeviceManagement; 