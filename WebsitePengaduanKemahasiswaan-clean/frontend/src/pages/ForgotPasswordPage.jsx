import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button,
  Alert, CircularProgress
} from '@mui/material';
import { ArrowBack, Email } from '@mui/icons-material';
import { forgotPassword } from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Email sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" fontWeight="bold">
            Lupa Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Masukkan email yang terdaftar untuk menerima link reset password.
          </Typography>
        </Box>

        {success ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Jika email terdaftar, link reset password telah dikirim.
              Silakan cek inbox atau folder spam Anda.
            </Alert>
            <Button component={Link} to="/login" fullWidth variant="outlined"
              startIcon={<ArrowBack />}>
              Kembali ke Login
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TextField
              fullWidth label="Email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              required autoFocus sx={{ mb: 3 }}
              placeholder="contoh@email.com"
            />

            <Button type="submit" fullWidth variant="contained" size="large"
              disabled={loading || !email}
              sx={{ mb: 2 }}>
              {loading ? <CircularProgress size={24} /> : 'Kirim Link Reset'}
            </Button>

            <Button component={Link} to="/login" fullWidth variant="text"
              startIcon={<ArrowBack />} color="inherit">
              Kembali ke Login
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ForgotPasswordPage;
