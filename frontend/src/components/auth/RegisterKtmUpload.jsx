import React, { useEffect, useRef, useState } from 'react';
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

// Sama persis dengan validasi handleFileChange di RegisterPage
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_INITIAL_SIZE = 15 * 1024 * 1024; // 15MB sebelum dikompresi

export default function RegisterKtmUpload({
  formData,
  handleFileChange,
  validationErrors,
  setValidationErrors,
  error,
  clearError
}) {
  const theme = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const dragDepth = useRef(0);

  const ktmFile = formData?.ktm || null;
  const errorMessage = error || Object.values(validationErrors || {}).find(err => err);

  // Buat pratinjau dari file terpilih; revoke otomatis saat file berubah/unmount
  useEffect(() => {
    if (!ktmFile || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      setPreviewUrl(null);
      return undefined;
    }
    if (typeof ktmFile.type === 'string' && !ktmFile.type.startsWith('image/')) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(ktmFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [ktmFile]);

  const setKtmError = (message) => {
    if (typeof setValidationErrors === 'function') {
      setValidationErrors(prev => ({ ...prev, ktm: message }));
    }
  };

  const processFile = (file) => {
    if (!file) return;
    // Validasi tipe & ukuran, sama dengan alur klik
    if (!ALLOWED_TYPES.includes(file.type)) {
      setKtmError('File harus berupa gambar (JPEG, JPG, PNG, atau WebP)');
      return;
    }
    if (file.size > MAX_INITIAL_SIZE) {
      setKtmError('Ukuran file asli terlalu besar (maksimal 15MB)');
      return;
    }
    if (typeof clearError === 'function') clearError();
    // Teruskan ke handler induk (validasi ulang + kompresi) lewat event sintetis
    handleFileChange({ target: { files: [file] } });
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setIsDragging(false);
    const file = event.dataTransfer?.files?.[0];
    processFile(file);
  };

  return (
    <Fade in timeout={800}>
      <Box sx={{ mt: 3 }}>
        {/* Error Alert */}
        {errorMessage && (
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
            {errorMessage}
          </Alert>
        )}
        
        <Box
          component="label"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            display: 'block',
            border: '3px dashed',
            borderColor: isDragging
              ? 'primary.main'
              : ktmFile ? 'success.main' : alpha(theme.palette.primary.main, 0.5),
            borderRadius: 4,
            p: 6,
            textAlign: 'center',
            bgcolor: isDragging
              ? alpha(theme.palette.primary.main, 0.15)
              : ktmFile 
                ? alpha(theme.palette.success.main, 0.1) 
                : alpha(theme.palette.primary.main, 0.05),
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: ktmFile ? 'success.main' : 'primary.main',
              bgcolor: ktmFile 
                ? alpha(theme.palette.success.main, 0.15) 
                : alpha(theme.palette.primary.main, 0.1),
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8],
            }
          }}
        >
          {ktmFile ? (
            <Slide direction="up" in mountOnEnter unmountOnExit>
              <Box>
                {previewUrl && (
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="Pratinjau KTM"
                    sx={{
                      maxWidth: 240,
                      maxHeight: 180,
                      width: 'auto',
                      objectFit: 'contain',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      boxShadow: theme.shadows[2],
                      mb: 2,
                    }}
                  />
                )}
                <CheckCircle 
                  sx={{ 
                    fontSize: previewUrl ? 44 : 80, 
                    color: 'success.main',
                    mb: 2,
                    filter: 'drop-shadow(0 4px 8px rgba(76, 175, 80, 0.3))'
                  }} 
                />
                <Typography variant="h5" fontWeight="bold" color="success.main" gutterBottom>
                  File Berhasil Dipilih!
                </Typography>
                <Chip 
                  label={ktmFile.name} 
                  color="success" 
                  variant="outlined"
                  sx={{ mt: 1, fontSize: '1rem', py: 2 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Klik atau seret file baru untuk mengganti.
                </Typography>
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
                {isDragging
                  ? 'Lepaskan file di sini'
                  : 'Klik di sini atau drag & drop file'}
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
