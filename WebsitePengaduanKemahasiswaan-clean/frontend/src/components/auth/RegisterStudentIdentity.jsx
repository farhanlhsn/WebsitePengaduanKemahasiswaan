import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Avatar,
  InputAdornment,
  Alert,
  Fade
} from '@mui/material';
import { AccountCircle, Email } from '@mui/icons-material';

export default function RegisterStudentIdentity({
  formData,
  handleInputChange,
  validationErrors,
  setValidationErrors,
  error,
  clearError
}) {
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
              if (typeof setValidationErrors === 'function') {
                setValidationErrors({});
              }
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
}
