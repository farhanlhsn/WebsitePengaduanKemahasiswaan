import React, { useState, useEffect } from 'react';
import {
  Box, Container, Paper, Typography, Button, Grid, Avatar, Divider, Stack,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Chip, Card, CardContent
} from '@mui/material';
import {
  Edit, Save, Cancel, Person, Email, School, Badge,
  CalendarToday, LocationOn, Phone, AccountCircle
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import useAuthStore from '../stores/authStore';
import useUserStore from '../stores/userStore';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';

const ProfilePage = ({ isEmbedded = false }) => {
  const theme = useTheme();
  const { user, devices, getUserDevices, updateProfile } = useAuthStore();
  const { loading, error, clearError, updateProfile: storeUpdateProfile } = useUserStore();
  const currentDevice = devices.find(device => device.isCurrent);
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nim: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        nim: user.nim || '',
      });
      getUserDevices();
    }
  }, [user, getUserDevices]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (error) clearError();
  };

  const handleSave = async () => {
    try {
      await storeUpdateProfile(formData);
      // Update auth store user as well to reflect changes immediately in header/sidebar
      updateProfile(formData);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      nim: user.nim || '',
      address: user.address || ''
    });
    setEditMode(false);
    clearError();
  };

  const formatLastAccess = (dateString) => {
    if (!dateString) return 'Tidak diketahui';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
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
    <Box sx={{ minHeight: isEmbedded ? 'auto' : '100vh', bgcolor: isEmbedded ? 'transparent' : 'background.default', py: isEmbedded ? 0 : 4 }}>
      {!isEmbedded && (
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3, position: 'relative', zIndex: 1, justifyContent: 'flex-start', px: { xs: 2, sm: 4, md: 10 } }}>
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
              Profil Saya
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Kelola informasi profil dan akun Anda dengan mudah
            </Typography>
          </Box>
        )}

        {/* Main Profile Card */}
        <Paper elevation={0} sx={{ 
          borderRadius: 4, 
          overflow: 'hidden', 
          mb: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          {/* Header Section */}
          <Box sx={{ 
            p: { xs: 3, md: 4 }, 
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
            borderBottom: '1px solid',
            borderColor: 'divider',
            position: 'relative'
          }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Box sx={{ position: 'relative' }}>
                  <Avatar 
                    sx={{ 
                      width: { xs: 80, md: 100 }, 
                      height: { xs: 80, md: 100 }, 
                      bgcolor: 'primary.main',
                      fontSize: { xs: '2rem', md: '2.5rem' },
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                      border: `4px solid ${theme.palette.background.paper}`
                    }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : <AccountCircle sx={{ fontSize: '3rem' }} />}
                  </Avatar>
                  {user.isVerified && (
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      right: 0, 
                      bgcolor: 'success.main', 
                      borderRadius: '50%', 
                      width: 24, 
                      height: 24, 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      border: `2px solid ${theme.palette.background.paper}`
                    }}>
                      <Badge sx={{ color: 'white', fontSize: '14px' }} />
                    </Box>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs>
                <Typography variant="h5" fontWeight={800} gutterBottom sx={{ mb: 0.5 }}>
                  {user.name || 'Nama tidak tersedia'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Email fontSize="small" /> {user.email}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    icon={<School fontSize="small" />}
                    label={user.role || 'Mahasiswa'} 
                    color="primary" 
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 600, borderRadius: 2 }}
                  />
                  <Chip 
                    label={user.isVerified ? 'Terverifikasi' : 'Belum Terverifikasi'} 
                    color={user.isVerified ? 'success' : 'warning'} 
                    size="small"
                    sx={{ fontWeight: 600, borderRadius: 2 }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm="auto">
                {!editMode ? (
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setEditMode(true)}
                    fullWidth
                    sx={{ borderRadius: 2, px: 3, py: 1, boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}` }}
                  >
                    Edit Profil
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Save />}
                      onClick={handleSave}
                      disabled={loading}
                      sx={{ borderRadius: 2, flex: 1 }}
                    >
                      Simpan
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      sx={{ borderRadius: 2, flex: 1 }}
                    >
                      Batal
                    </Button>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>

          {/* Content Section */}
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 4, borderRadius: 2 }}
                onClose={clearError}
              >
                {error}
              </Alert>
            )}

            <Grid container spacing={4}>
              {/* Personal Information */}
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Informasi Personal
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }} gutterBottom>
                      Nama Lengkap
                    </Typography>
                    {editMode ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={formData.name}
                        onChange={handleInputChange('name')}
                        sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    ) : (
                      <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5 }}>
                        {user.name || '-'}
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }} gutterBottom>
                      Nomor Induk Mahasiswa (NIM)
                    </Typography>
                    {editMode ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={formData.nim}
                        onChange={handleInputChange('nim')}
                        sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    ) : (
                      <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5 }}>
                        {user.nim || '-'}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* Account Information */}
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountCircle color="secondary" />
                  <Typography variant="h6" fontWeight={700}>
                    Informasi Akun
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }} gutterBottom>
                      Alamat Email
                    </Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      {user.email}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }} gutterBottom>
                      Akses Terakhir
                    </Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday fontSize="small" color="action" />
                      {formatLastAccess(currentDevice?.lastAccess)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Statistics Cards */}
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, px: { xs: 1, md: 0 } }}>
          Aktivitas Laporan
        </Typography>
        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <GlassCard variant="glass" sx={{ 
              height: '100%', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              p: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                  <School />
                </Box>
                <Typography variant="h3" fontWeight={800} color="primary.main">
                  {user.reportCount || 0}
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight={600} color="text.primary">
                Total Laporan
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Seluruh laporan yang pernah Anda buat
              </Typography>
            </GlassCard>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <GlassCard variant="glass" sx={{ 
              height: '100%', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              p: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}>
                  <Badge />
                </Box>
                <Typography variant="h3" fontWeight={800} color="success.main">
                  {user.resolvedReportCount || 0}
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight={600} color="text.primary">
                Laporan Selesai
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Laporan yang telah terselesaikan
              </Typography>
            </GlassCard>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <GlassCard variant="glass" sx={{ 
              height: '100%', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              p: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main' }}>
                  <CalendarToday />
                </Box>
                <Typography variant="h3" fontWeight={800} color="warning.main">
                  {user.pendingReportCount || 0}
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight={600} color="text.primary">
                Dalam Proses
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Laporan yang sedang ditindaklanjuti
              </Typography>
            </GlassCard>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProfilePage; 