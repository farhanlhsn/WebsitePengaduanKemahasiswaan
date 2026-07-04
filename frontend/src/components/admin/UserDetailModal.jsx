import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Chip,
  Grid,
  Paper,
  IconButton,
  Button,
} from '@mui/material';
import {
  Close,
  Email,
  Person,
  VerifiedUser,
  CalendarToday,
  Badge,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

const BACKEND_UPLOAD_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/v1\/api\/?$/, '')
  : 'http://localhost:6060';

const UserDetailModal = ({ open, onClose, user, onAction, isSuperAdmin }) => {
  const theme = useTheme();
  const [isKtmOpen, setIsKtmOpen] = useState(false);

  if (!user) return null;

  const handleAction = (action) => {
    if (onAction) {
      onAction(action, user);
    }
    onClose();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'SUPERADMIN':
        return 'warning';
      case 'MAHASISWA':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: `linear-gradient(135deg, 
              ${alpha(theme.palette.background.paper, 0.98)}, 
              ${alpha(theme.palette.background.default, 0.95)})`,
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            Detail Pengguna
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2, pb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Grid container spacing={3}>
            {/* Kolom Kiri: Informasi Pengguna */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  height: '100%',
                  background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.primary.main, 0.05)}, 
                    ${alpha(theme.palette.secondary.main, 0.03)})`,
                }}
              >
                <Typography variant="h6" fontWeight={600} gutterBottom mb={2}>
                  Informasi Pengguna
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5}}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Person color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        Nama
                      </Typography>
                      <Typography variant="body1">{user.name || 'Tidak tersedia'}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, ml:3 }}>
                    <Chip
                      label={user.role || 'MAHASISWA'}
                      color={getRoleColor(user.role)}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'uppercase' }}
                    />
                    {user.isVerified && (
                      <Chip
                        icon={<VerifiedUser fontSize="small" />}
                        label="Terverifikasi"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {!user.isVerified && (
                      <Chip
                        icon={<VerifiedUser fontSize="small" />}
                        label="Belum Terverifikasi"
                        color="error"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <Badge color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      NIM
                    </Typography>
                    <Typography variant="body1">{user.nim || 'Tidak tersedia'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <Email color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Email
                    </Typography>
                    <Typography variant="body1">{user.email}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CalendarToday color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Tanggal Daftar
                    </Typography>
                    <Typography variant="body1">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Tidak tersedia'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Kolom Kanan: Foto KTM */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.primary.main, 0.05)}, 
                    ${alpha(theme.palette.secondary.main, 0.03)})`,
                }}
              >
                <Typography variant="h6" fontWeight={600} gutterBottom mb={2} align="center">
                  Foto KTM
                </Typography>
                {user.ktmPath ? (
                  <Box
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                    onClick={() => setIsKtmOpen(true)}
                  >
                    <img
                      src={`${BACKEND_UPLOAD_URL}${user.ktmPath}`}
                      alt="Foto KTM"
                      crossOrigin="use-credentials"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '250px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: 'text.secondary',
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 4,
                    }}
                  >
                    <Typography variant="body1" align="center">
                      Foto KTM tidak tersedia
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1, justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose} color="inherit" variant="outlined">
            Tutup
          </Button>
          {isSuperAdmin && user.status === 'ACTIVE' && user.role === 'MAHASISWA' && (
            <Button onClick={() => handleAction('promote-admin')} variant="contained" color="warning">
              Jadikan Admin
            </Button>
          )}
          {!user.isVerified && user.status === 'ACTIVE' && (
            <Button onClick={() => handleAction('verify')} variant="contained" color="success">
              Verifikasi
            </Button>
          )}
          {user.status === 'ACTIVE' && (
            <Button onClick={() => handleAction('delete')} variant="outlined" color="error">
              Hapus
            </Button>
          )}
          {user.status === 'DELETED' && (
            <Button onClick={() => handleAction('restore')} variant="contained" color="primary">
              Pulihkan
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal untuk memperbesar gambar KTM */}
      <Dialog open={isKtmOpen} onClose={() => setIsKtmOpen(false)} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 1, background: '#000000e0' }}>
          <IconButton
            onClick={() => setIsKtmOpen(false)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              background: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.8)',
              }
            }}
          >
            <Close />
          </IconButton>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 'calc(100vh - 64px)', // Adjust height based on your app's header/footer
            }}
          >
            <img
              src={`${BACKEND_UPLOAD_URL}${user.ktmPath}`}
              alt="Foto KTM diperbesar"
              crossOrigin="use-credentials"
              style={{
                maxWidth: '95vw',
                maxHeight: '95vh',
                objectFit: 'contain', // Kunci untuk mempertahankan rasio aspek
                borderRadius: '8px',
                boxShadow: `0 4px 12px rgba(0, 0, 0, 0.1)`,
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserDetailModal;