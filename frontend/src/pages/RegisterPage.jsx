import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent, 
  Avatar, 
  Fade, 
  useTheme, 
  alpha, 
  CircularProgress
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { 
  ArrowBack,
  ArrowForward,
  CheckCircle,
  School,
  SecurityOutlined,
  VerifiedUser,
  PersonAdd
} from '@mui/icons-material';

import RegisterStudentIdentity from '../components/auth/RegisterStudentIdentity';
import RegisterSecurity from '../components/auth/RegisterSecurity';
import RegisterKtmUpload from '../components/auth/RegisterKtmUpload';
import imageCompression from 'browser-image-compression';

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
    description: 'Unggah dokumen KTM',
    icon: <VerifiedUser />,
  },
];

export default function RegisterPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { registerStudent, loading, error, clearError, isLoggedIn, user } = useAuthStore();
  
  useEffect(() => {
    if (isLoggedIn && user) {
      if (['ADMIN', 'SUPERADMIN'].includes(user.role)) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isLoggedIn, user, navigate]);
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
  const [isCompressing, setIsCompressing] = useState(false);

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

  const handleFileChange = async (event) => {
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
      
      // Validasi file size awal (max 15MB)
      const maxInitialSize = 15 * 1024 * 1024; // 15MB
      if (file.size > maxInitialSize) {
        setValidationErrors(prev => ({
          ...prev,
          ktm: 'Ukuran file asli terlalu besar (maksimal 15MB)'
        }));
        return;
      }
      
      setIsCompressing(true);
      setValidationErrors(prev => ({
        ...prev,
        ktm: ''
      }));
      
      try {
        const options = {
          maxSizeMB: 1,             // Target size < 1MB
          maxWidthOrHeight: 1200,   // Max width/height 1200px
          useWebWorker: true        // Background worker
        };

        const compressedFile = await imageCompression(file, options);
        
        // Reconstruct the File object to keep its original name
        const finalFile = new File([compressedFile], file.name, {
          type: file.type,
          lastModified: Date.now()
        });

        setFormData(prev => ({
          ...prev,
          ktm: finalFile
        }));
      } catch (err) {
        console.error('Client-side compression failed, falling back to original file:', err);
        if (file.size > 5 * 1024 * 1024) {
          setValidationErrors(prev => ({
            ...prev,
            ktm: 'Gagal mengompresi gambar dan file asli melebihi 5MB'
          }));
          setIsCompressing(false);
          return;
        }
        setFormData(prev => ({
          ...prev,
          ktm: file
        }));
      } finally {
        setIsCompressing(false);
      }
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
        } else if (formData.password.length < 8) {
          errors.password = 'Password minimal 8 karakter';
        } else if (!/[a-z]/.test(formData.password)) {
          errors.password = 'Password harus mengandung huruf kecil';
        } else if (!/[A-Z]/.test(formData.password)) {
          errors.password = 'Password harus mengandung huruf besar';
        } else if (!/[0-9]/.test(formData.password)) {
          errors.password = 'Password harus mengandung angka';
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
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <RegisterStudentIdentity
            formData={formData}
            handleInputChange={handleInputChange}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
            error={error}
            clearError={clearError}
          />
        );
      case 1:
        return (
          <RegisterSecurity
            formData={formData}
            handleInputChange={handleInputChange}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
            error={error}
            clearError={clearError}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
          />
        );
      case 2:
        return (
          <RegisterKtmUpload
            formData={formData}
            handleFileChange={handleFileChange}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
            error={error}
            clearError={clearError}
          />
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
      <Container maxWidth="sm" sx={{ mx: 'auto' }}>
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
          <Box sx={{ p: { xs: 3, md: 4 } }}>
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
                            py: 1,
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
                        data-testid={`next-step-${index}`}
                        onClick={index === steps.length - 1 ? handleSubmit : handleNextStep}
                        endIcon={
                          (loading || (index === steps.length - 1 && isCompressing)) ? <CircularProgress size={20} color="inherit" /> :
                          index === steps.length - 1 ? <PersonAdd /> : <ArrowForward />
                        }
                        variant="contained"
                        disabled={loading || (index === steps.length - 1 && isCompressing)}
                        sx={{ 
                          borderRadius: 3,
                          px: 4,
                          py: 1.2,
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                          boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                          '&:hover': {
                            transform: (loading || isCompressing) ? 'none' : 'translateY(-3px)',
                            boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.5)}`,
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        {loading ? 'Memproses...' : 
                         (index === steps.length - 1 && isCompressing) ? 'Mengompresi KTM...' :
                         (index === steps.length - 1 ? 'Daftar Sekarang' : 'Lanjutkan')}
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
                      py: 1.5,
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
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Sudah punya akun?{' '}
            <Button 
              component={Link}
              to="/login"
              variant="text"
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
              Masuk di sini
            </Button>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}