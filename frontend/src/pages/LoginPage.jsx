import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Paper, 
  Grid,
  Fade,
  IconButton,
  InputAdornment,
  useTheme,
  alpha,
  Avatar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { 
  LoginOutlined, 
  PersonAdd, 
  Email, 
  Lock, 
  Visibility, 
  VisibilityOff,
  AccountCircle
} from '@mui/icons-material';

export default function LoginPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { login, loading, error, clearError, isLoggedIn, user } = useAuthStore();
  
  React.useEffect(() => {
    if (isLoggedIn && user) {
      if (['ADMIN', 'SUPERADMIN'].includes(user.role)) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isLoggedIn, user, navigate]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (error) clearError();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      const response = await login(formData.email, formData.password);
      
      // Check if redirectUrl exists in sessionStorage
      const redirectUrl = sessionStorage.getItem('redirectUrl');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectUrl');
        navigate(redirectUrl);
      } else {
        // Redirect based on user role
        if (['ADMIN', 'SUPERADMIN'].includes(response?.data?.role)) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      // Error is already handled by the store
      console.error('Login error:', error);
    }
  };
  
  return (
    <Box sx={{ 
      minHeight: 'calc(100vh - 140px)',
      background: `linear-gradient(135deg, 
        ${alpha(theme.palette.primary.light, 0.1)} 0%, 
        ${alpha(theme.palette.secondary.light, 0.1)} 50%,
        ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
      display: 'flex',
      alignItems: 'center',
      py: { xs: 4, md: 6 },
      px: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="xs" sx={{ mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
              letterSpacing: '-0.02em'
            }}
          >
            Selamat Datang
          </Typography>
          
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3, fontWeight: 400 }}>
            Masuk ke akun Anda untuk melanjutkan
          </Typography>
        </Box>

        {/* Main Content */}
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 6,
            overflow: 'hidden',
            background: `linear-gradient(145deg, 
              ${alpha(theme.palette.background.paper, 0.9)}, 
              ${alpha(theme.palette.background.paper, 0.95)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.1)}`
          }}
        >
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            {/* Welcome Section */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar 
                sx={{ 
                  width: 64, 
                  height: 64, 
                  bgcolor: 'primary.main',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`
                }}
                aria-label="Login"
              >
                <AccountCircle sx={{ fontSize: 40 }} aria-hidden="true" />
              </Avatar>
              
              <Typography variant="h5" fontWeight="bold" color="primary.main" gutterBottom>
                Login Akun
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Masukkan kredensial Anda untuk mengakses sistem pengaduan
              </Typography>
            </Box>

            <Fade in timeout={800}>
              <Box component="form" noValidate onSubmit={handleSubmit}>
                {/* SSO Login Button */}
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`}
                  startIcon={
                    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  }
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    py: 1.2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'text.primary',
                    borderColor: alpha(theme.palette.divider, 0.8),
                    backgroundColor: theme.palette.background.paper,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.divider, 0.05),
                      borderColor: theme.palette.text.primary,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.05)}`
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    textTransform: 'none'
                  }}
                >
                  Masuk dengan SSO Google
                </Button>

                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 3,
                  '&::before, &::after': {
                    content: '""',
                    flex: 1,
                    height: '1px',
                    bgcolor: alpha(theme.palette.divider, 0.5)
                  }
                }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ px: 2, fontWeight: 500 }}
                  >
                    atau dengan email
                  </Typography>
                </Box>

                {/* Error Alert */}
                {error && (
                  <Alert 
                    severity="error" 
                    role="alert"
                    aria-live="assertive"
                    sx={{ mb: 3, borderRadius: 2 }}
                    onClose={clearError}
                  >
                    {error}
                  </Alert>
                )}
                <Box sx={{ mb: 4 }}>
                  <TextField
                    fullWidth
                    label="Email Kampus"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="nama@mahasiswa.bunghatta.ac.id"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    inputProps={{ 'aria-label': 'Email kampus' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="primary" aria-hidden="true" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        height: 52,
                        fontSize: '1rem',
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    inputProps={{ 'aria-label': 'Password' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="primary" aria-hidden="true" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        height: 52,
                        fontSize: '1rem',
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginOutlined />}
                  sx={{ 
                    mt: 2,
                    mb: 3,
                    borderRadius: 3,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                    '&:hover': {
                      transform: loading ? 'none' : 'translateY(-3px)',
                      boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.5)}`,
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {loading ? 'Masuk...' : 'Masuk ke Akun'}
                </Button>

                {/* Forgot Password Link */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Button 
                    component={Link}
                    to="/forgot-password"
                    variant="text"
                    sx={{ 
                      fontWeight: 'bold',
                      color: 'text.secondary',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: 'primary.main'
                      }
                    }}
                  >
                    Lupa Password?
                  </Button>
                </Box>

                {/* Divider */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  my: 3,
                  '&::before, &::after': {
                    content: '""',
                    flex: 1,
                    height: '1px',
                    bgcolor: alpha(theme.palette.divider, 0.5)
                  }
                }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ px: 2, fontWeight: 500 }}
                  >
                    atau
                  </Typography>
                </Box>

                <Button
                  component={Link}
                  to="/register"
                  variant="outlined"
                  size="large"
                  startIcon={<PersonAdd />}
                  fullWidth
                  sx={{
                    borderRadius: 3,
                    py: 1.2,
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Belum punya akun? Daftar di sini
                </Button>
              </Box>
            </Fade>
          </Box>
        </Paper>

        {/* Footer Note */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Dengan masuk, Anda menyetujui{' '}
            <Button 
              variant="text"
              size="small"
              sx={{ 
                fontWeight: 'bold',
                textDecoration: 'none',
                minWidth: 'auto',
                color: 'primary.main',
                p: 0,
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline'
                }
              }}
            >
              Syarat & Ketentuan
            </Button>
            {' '}kami
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}