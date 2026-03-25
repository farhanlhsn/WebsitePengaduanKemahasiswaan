import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Paper, 
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  Chip,
  Fade,
  Slide,
  IconButton,
  InputAdornment,
  useTheme,
  alpha,
  Alert,
  CircularProgress
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { 
  AccountCircle, 
  Email, 
  Lock, 
  CloudUpload, 
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Visibility,
  VisibilityOff,
  School,
  SecurityOutlined,
  VerifiedUser,
  PersonAdd
} from '@mui/icons-material';

const steps = [
  {
    label: 'Identitas Mahasiswa',
    description: 'Masukkan data pribadi Anda',
    icon: <School />,
  },
  {
    label: 'Keamanan Akun',
    description: 'Buat password yang aman',
    icon: <SecurityOutlined />,
  },
  {
    label: 'Verifikasi',
    description: 'Upload dokumen KTM',
    icon: <VerifiedUser />,
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { registerStudent, loading, error, clearError } = useAuthStore();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    nim: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    ktm: null
  });
  const [validationErrors, setValidationErrors] = useState({});

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear validation errors when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    // Clear auth error when user starts typing
    if (error) clearError();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validasi file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setValidationErrors(prev => ({
          ...prev,
          ktm: 'File harus berupa gambar (JPEG, JPG, PNG, atau WebP)'
        }));
        return;
      }
      
      // Validasi file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setValidationErrors(prev => ({
          ...prev,
          ktm: 'Ukuran file maksimal 5MB'
        }));
        return;
      }
      
      // Clear validation errors if file is valid
      setValidationErrors(prev => ({
        ...prev,
        ktm: ''
      }));
      
      setFormData(prev => ({
        ...prev,
        ktm: file
      }));
    }
  };

  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 0:
        if (!formData.nim.trim()) {
          errors.nim = 'NIM harus diisi';
        } else if (!/^\d{8,}$/.test(formData.nim.trim())) {
          errors.nim = 'NIM harus minimal 8 digit angka';
        }
        if (!formData.fullName.trim()) errors.fullName = 'Nama lengkap harus diisi';
        if (!formData.email.trim()) {
          errors.email = 'Email harus diisi';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Format email tidak valid';
        }
        break;
      case 1:
        if (!formData.password) {
          errors.password = 'Password harus diisi';
        } else if (formData.password.length < 6) {
          errors.password = 'Password minimal 6 karakter';
        } else if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
          errors.password = 'Password harus mengandung huruf dan angka';
        }
        if (!formData.confirmPassword) {
          errors.confirmPassword = 'Konfirmasi password harus diisi';
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Password tidak sama';
        }
        break;
      case 2:
        if (!formData.ktm) {
          errors.ktm = 'File KTM harus diunggah';
        } else {
          // Double check file validation
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
          if (!allowedTypes.includes(formData.ktm.type)) {
            errors.ktm = 'File harus berupa gambar (JPEG, JPG, PNG, atau WebP)';
          } else if (formData.ktm.size > 5 * 1024 * 1024) {
            errors.ktm = 'Ukuran file maksimal 5MB';
          }
        }
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(activeStep)) {
      handleNext();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    
    try {
      const userData = {
        nim: formData.nim.trim(),
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password
      };
      
      await registerStudent(userData, formData.ktm);
      handleNext(); // Go to success step
    } catch (error) {
      console.error('Registration error:', error);
      // Error handling sudah di handle di authStore
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Fade in timeout={800}>
            <Box sx={{ mt: 3 }}>
              {/* Error Alert */}
              {(error || Object.keys(validationErrors).length > 0) && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 3, borderRadius: 2 }}
                  onClose={() => {
                    clearError();
                    setValidationErrors({});
                  }}
                >
                  {error || Object.values(validationErrors).find(err => err)}
                </Alert>
              )}
              
              <Box sx={{ mb: 4 }}>
                <TextField
                  fullWidth
                  label="NIM (Nomor Induk Mahasiswa)"
                  placeholder="Contoh: 2021001234"
                  value={formData.nim}
                  onChange={handleInputChange('nim')}
                  error={!!validationErrors.nim}
                  helperText={validationErrors.nim}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                          <Typography variant="caption" sx={{ color: 'white', fontSize: '10px' }}>ID</Typography>
                        </Avatar>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      height: 60,
                      fontSize: '1.1rem',
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
                  label="Nama Lengkap"
                  placeholder="Sesuai dengan KTM"
                  value={formData.fullName}
                  onChange={handleInputChange('fullName')}
                  error={!!validationErrors.fullName}
                  helperText={validationErrors.fullName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircle color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      height: 60,
                      fontSize: '1.1rem',
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Email Kampus"
                  type="email"
                  placeholder="nama@mahasiswa.bunghatta.ac.id"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      height: 60,
                      fontSize: '1.1rem',
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </Box>
            </Box>
          </Fade>
        );
      case 1:
        return (
          <Fade in timeout={800}>
            <Box sx={{ mt: 3 }}>
              {/* Error Alert */}
              {(error || Object.keys(validationErrors).length > 0) && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 3, borderRadius: 2 }}
                  onClose={() => {
                    clearError();
                    setValidationErrors({});
                  }}
                >
                  {error || Object.values(validationErrors).find(err => err)}
                </Alert>
              )}
              
              <Box sx={{ mb: 4 }}>
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={!!validationErrors.password}
                  helperText={validationErrors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      height: 60,
                      fontSize: '1.1rem',
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Konfirmasi Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  error={!!validationErrors.confirmPassword}
                  helperText={validationErrors.confirmPassword}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      height: 60,
                      fontSize: '1.1rem',
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </Box>
            </Box>
          </Fade>
        );
      case 2:
        return (
          <Fade in timeout={800}>
            <Box sx={{ mt: 3 }}>
              {/* Error Alert */}
              {(error || Object.keys(validationErrors).length > 0) && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 3, borderRadius: 2 }}
                  onClose={() => {
                    clearError();
                    setValidationErrors({});
                  }}
                >
                  {error || Object.values(validationErrors).find(err => err)}
                </Alert>
              )}
              
              <Box
                component="label"
                sx={{
                  display: 'block',
                  border: '3px dashed',
                  borderColor: formData.ktm ? 'success.main' : alpha(theme.palette.primary.main, 0.5),
                  borderRadius: 4,
                  p: 6,
                  textAlign: 'center',
                  bgcolor: formData.ktm 
                    ? alpha(theme.palette.success.main, 0.1) 
                    : alpha(theme.palette.primary.main, 0.05),
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: formData.ktm ? 'success.main' : 'primary.main',
                    bgcolor: formData.ktm 
                      ? alpha(theme.palette.success.main, 0.15) 
                      : alpha(theme.palette.primary.main, 0.1),
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  }
                }}
              >
                {formData.ktm ? (
                  <Slide direction="up" in mountOnEnter unmountOnExit>
                    <Box>
                      <CheckCircle 
                        sx={{ 
                          fontSize: 80, 
                          color: 'success.main',
                          mb: 2,
                          filter: 'drop-shadow(0 4px 8px rgba(76, 175, 80, 0.3))'
                        }} 
                      />
                      <Typography variant="h5" fontWeight="bold" color="success.main" gutterBottom>
                        File Berhasil Dipilih!
                      </Typography>
                      <Chip 
                        label={formData.ktm.name} 
                        color="success" 
                        variant="outlined"
                        sx={{ mt: 1, fontSize: '1rem', py: 2 }}
                      />
                    </Box>
                  </Slide>
                ) : (
                  <Box>
                    <CloudUpload 
                      sx={{ 
                        fontSize: 80, 
                        color: 'primary.main',
                        mb: 2,
                        filter: 'drop-shadow(0 4px 8px rgba(46, 125, 50, 0.3))'
                      }} 
                    />
                    <Typography variant="h5" fontWeight="bold" color="primary.main" gutterBottom>
                      Upload KTM Anda
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      Klik di sini atau drag & drop file
                    </Typography>
                    <Chip 
                      label="JPG, PNG, atau PDF (Max 5MB)" 
                      variant="outlined" 
                      size="small"
                    />
                  </Box>
                )}
                <input
                  type="file"
                  hidden
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
              </Box>
            </Box>
          </Fade>
        );
      default:
        return null;
    }
  };
  
  return (
    <Box sx={{ 
      minHeight: 'calc(100vh - 140px)',
      background: `linear-gradient(135deg, 
        ${alpha(theme.palette.primary.light, 0.1)} 0%, 
        ${alpha(theme.palette.secondary.light, 0.1)} 50%,
        ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
      py: { xs: 4, md: 6 },
      px: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="md" sx={{ mx: 'auto' }}>
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
              letterSpacing: '-0.02em',
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            Bergabung dengan Kami
          </Typography>
          
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3, fontWeight: 400, fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Daftarkan diri Anda untuk menyampaikan aspirasi dan pengaduan
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
            boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.1)}`,
            maxWidth: '100%'
          }}
        >
          <Box sx={{ p: { xs: 3, md: 6 } }}>
            <Stepper 
              activeStep={activeStep} 
              orientation="vertical"
              sx={{
                '& .MuiStepLabel-root': {
                  pb: 3
                },
                '& .MuiStepLabel-label': {
                  fontSize: '1.1rem',
                  fontWeight: 600
                },
                '& .MuiStepIcon-root': {
                  fontSize: '2rem',
                  '&.Mui-active': {
                    color: theme.palette.primary.main,
                  },
                  '&.Mui-completed': {
                    color: theme.palette.success.main,
                  }
                }
              }}
            >
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: index <= activeStep ? 'primary.main' : 'grey.300',
                          width: 40,
                          height: 40,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {step.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {step.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                      </Box>
                    </Box>
                  </StepLabel>
                  <StepContent>
                    {renderStepContent(index)}
                    
                    <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                      {index > 0 && (
                        <Button
                          onClick={handleBack}
                          startIcon={<ArrowBack />}
                          variant="outlined"
                          sx={{ 
                            borderRadius: 3,
                            px: 3,
                            py: 1.5,
                            borderWidth: 2,
                            '&:hover': {
                              borderWidth: 2,
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          Kembali
                        </Button>
                      )}
                      
                      <Button
                        onClick={index === steps.length - 1 ? handleSubmit : handleNextStep}
                        endIcon={
                          loading ? <CircularProgress size={20} color="inherit" /> :
                          index === steps.length - 1 ? <PersonAdd /> : <ArrowForward />
                        }
                        variant="contained"
                        disabled={loading}
                        sx={{ 
                          borderRadius: 3,
                          px: 4,
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
                        {loading ? 'Memproses...' : (index === steps.length - 1 ? 'Daftar Sekarang' : 'Lanjutkan')}
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            {activeStep === steps.length && (
              <Fade in timeout={1000}>
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CheckCircle 
                    sx={{ 
                      fontSize: 100, 
                      color: 'success.main',
                      mb: 3,
                      filter: 'drop-shadow(0 8px 16px rgba(76, 175, 80, 0.3))'
                    }} 
                  />
                  <Typography variant="h4" fontWeight="bold" color="success.main" gutterBottom>
                    Registrasi Berhasil!
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Akun Anda akan diverifikasi oleh admin dalam 1-2 hari kerja.
                  </Typography>
                  <Button
                    component={Link}
                    to="/login"
                    variant="contained"
                    size="large"
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Masuk ke Akun
                  </Button>
                </Box>
              </Fade>
            )}
          </Box>
        </Paper>

        {/* Login Link */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Sudah punya akun?{' '}
            <Button 
              component={Link}
              to="/login"
              variant="text"
              sx={{ 
                fontWeight: 'bold',
                textDecoration: 'underline',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline'
                }
              }}
            >
              Masuk di sini
            </Button>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}