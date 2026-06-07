import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  Alert, CircularProgress, InputAdornment, IconButton
} from '@mui/material';
import { LockReset, Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import { resetPassword } from '../services/api';
import PasswordStrengthMeter from '../components/ui/PasswordStrengthMeter';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }
    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password harus mengandung huruf besar, huruf kecil, dan angka');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Token tidak valid atau sudah expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Link reset password tidak valid. Token tidak ditemukan.
          </Alert>
          <Button component={Link} to="/forgot-password" variant="contained">
            Request Link Baru
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LockReset sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" fontWeight="bold">
            Reset Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Masukkan password baru untuk akun Anda.
          </Typography>
        </Box>

        {success ? (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Alert severity="success" sx={{ mb: 2 }}>
              Password berhasil direset! Silakan login dengan password baru.
            </Alert>
            <Button component={Link} to="/login" fullWidth variant="contained" size="large">
              Login
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TextField
              fullWidth label="Password Baru" type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              required sx={{ mb: 1 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <PasswordStrengthMeter password={newPassword} />

            <TextField
              fullWidth label="Konfirmasi Password" type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              required sx={{ mt: 2, mb: 3 }}
              error={confirmPassword && newPassword !== confirmPassword}
              helperText={confirmPassword && newPassword !== confirmPassword ? 'Password tidak cocok' : ''}
            />

            <Button type="submit" fullWidth variant="contained" size="large"
              disabled={loading || !newPassword || !confirmPassword}>
              {loading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ResetPasswordPage;
