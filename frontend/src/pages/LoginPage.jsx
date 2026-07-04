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