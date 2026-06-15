import React from 'react';
import { Box, Container, Paper, Typography, Button, Alert } from '@mui/material';
import { HourglassTop, Logout, Email } from '@mui/icons-material';
import useAuthStore from '../stores/authStore';

const WaitingVerificationPage = () => {
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
        <HourglassTop sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />

        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Menunggu Verifikasi
        </Typography>

        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
          Akun Anda sedang dalam proses verifikasi oleh admin.
          Anda akan mendapat notifikasi email saat akun telah diverifikasi.
        </Alert>

        <Box sx={{ textAlign: 'left', mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Informasi Akun:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nama: {user?.name || '-'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email: {user?.email || '-'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            NIM: {user?.nim || '-'}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Pastikan Anda telah mengupload foto KTM yang jelas saat registrasi.
          Jika ada kendala, hubungi admin melalui email kampus.
        </Typography>

        <Button variant="outlined" color="error" startIcon={<Logout />}
          onClick={handleLogout} fullWidth>
          Logout
        </Button>
      </Paper>
    </Container>
  );
};

export default WaitingVerificationPage;
