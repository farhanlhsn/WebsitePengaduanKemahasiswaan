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

const ProfilePage = () => {
  const theme = useTheme();
  const { user, devices, getUserDevices } = useAuthStore();
  const { updateUser, loading, error, clearError } = useUserStore();
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
  }, [user]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (error) clearError();
  };

  const handleSave = async () => {
    try {
      await updateUser(user.id, formData);
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3, position: 'relative', zIndex: 1, justifyContent: 'flex-start', px: 10}}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          variant="outlined"
          sx={{ 
            color: 'black',
            borderColor: 'rgba(0,0,0,0.3)',
            '&:hover': {
              borderColor: 'black',
              bgcolor: 'rgba(0,0,0,0.1)'
            }
          }}
        >
          Kembali
        </Button>
      </Stack>  
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Profil Saya
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Kelola informasi profil dan akun Anda
          </Typography>
        </Box>

        {/* Main Profile Card */}
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', mb: 3 }}>
          {/* Header Section */}
          <Box sx={{ 
            p: 4, 
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
            borderBottom: '1px solid rgba(0,0,0,0.06)'
          }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Avatar 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem'
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : <AccountCircle sx={{ fontSize: '3rem' }} />}
                </Avatar>
              </Grid>
              
              <Grid item xs>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {user.name || 'Nama tidak tersedia'}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={user.role || 'Mahasiswa'} 
                    color="primary" 
                    size="small"
                  />
                  <Chip 
                    label={user.isVerified ? 'Terverifikasi' : 'Belum Terverifikasi'} 
                    color={user.isVerified ? 'success' : 'warning'} 
                    size="small"
                  />
                </Box>
              </Grid>
              
              <Grid item>
                {!editMode ? (
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setEditMode(true)}
                    sx={{ borderRadius: 3 }}
                  >
                    Edit Profil
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Save />}
                      onClick={handleSave}
                      disabled={loading}
                      sx={{ borderRadius: 3 }}
                    >
                      Simpan
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      sx={{ borderRadius: 3 }}
                    >
                      Batal
                    </Button>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>

          {/* Content Section */}
          <Box sx={{ p: 4 }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }}
                onClose={clearError}
              >
                {error}
              </Alert>
            )}

            <Grid container spacing={4}>
              {/* Personal Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Informasi Personal
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Nama Lengkap
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  ) : (
                    <Typography variant="body1" fontWeight={500}>
                      {user.name || '-'}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    NIM
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={formData.nim}
                      onChange={handleInputChange('nim')}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  ) : (
                    <Typography variant="body1" fontWeight={500}>
                      {user.nim || '-'}
                    </Typography>
                  )}
                </Box>

              </Grid>

              {/* Account Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Informasi Akun
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {user.email}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Login Terakhir
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatLastAccess(currentDevice?.lastAccess)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Status Akun
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={user.isVerified ? 'Terverifikasi' : 'Belum Terverifikasi'} 
                      color={user.isVerified ? 'success' : 'warning'} 
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Statistics Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 3, textAlign: 'center', p: 2 }}>
              <CardContent>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  {user.reportCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Laporan
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 3, textAlign: 'center', p: 2 }}>
              <CardContent>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {user.resolvedReportCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Laporan Selesai
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 3, textAlign: 'center', p: 2 }}>
              <CardContent>
                <Typography variant="h4" fontWeight={700} color="warning.main">
                  {user.pendingReportCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Laporan Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProfilePage; 