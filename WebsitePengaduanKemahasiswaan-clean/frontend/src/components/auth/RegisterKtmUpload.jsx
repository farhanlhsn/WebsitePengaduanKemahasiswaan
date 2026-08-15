import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Fade,
  Slide,
  useTheme,
  alpha,
  Alert
} from '@mui/material';
import { CloudUpload, CheckCircle } from '@mui/icons-material';

export default function RegisterKtmUpload({
  formData,
  handleFileChange,
  validationErrors,
  setValidationErrors,
  error,
  clearError
}) {
  const theme = useTheme();
  
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
                label="JPG, PNG, atau WebP (Max 5MB)" 
                variant="outlined" 
                size="small"
              />
            </Box>
          )}
          <input
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
        </Box>
      </Box>
    </Fade>
  );
}
