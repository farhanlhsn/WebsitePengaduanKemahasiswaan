import React from 'react';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Alert,
  Fade
} from '@mui/material';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import PasswordStrengthMeter from '../ui/PasswordStrengthMeter';

export default function RegisterSecurity({
  formData,
  handleInputChange,
  validationErrors,
  setValidationErrors,
  error,
  clearError,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword
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
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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
                height: 60,
                fontSize: '1.1rem',
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                },
              },
            }}
          />
          <PasswordStrengthMeter password={formData.password} />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Konfirmasi Password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
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
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
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
}
