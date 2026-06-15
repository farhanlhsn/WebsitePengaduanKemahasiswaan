import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Box, Typography, IconButton, Stepper, Step, StepLabel, 
  StepContent, Chip, Alert, LinearProgress,
  FormControlLabel, Switch, Stack
} from '@mui/material';
import { 
  Close, CloudUpload, Assignment,
  AttachFile, Send, VisibilityOff
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import RichTextEditor from '../ui/RichTextEditor';
import { uploadAttachments } from '../../services/api';
import imageCompression from 'browser-image-compression';
import { richTextToPlainText } from '../../utils/sanitizeHtml';

const StyledDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    maxWidth: 600,
    width: '90vw',
    maxHeight: '90vh',
  }
}));

const UploadArea = styled(Box)(({ theme }) => ({
    border: `2px dashed ${theme.palette.primary.main}`,
    borderRadius: 12,
    padding: theme.spacing(3),
    textAlign: 'center',
    backgroundColor: alpha(theme.palette.primary.light, 0.05),
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
    }
  }));
  

const steps = [
  {
    label: 'Informasi Laporan',
    description: 'Judul dan kategori laporan'
  },
  {
    label: 'Detail Laporan', 
    description: 'Deskripsi lengkap masalah'
  },
  {
    label: 'Lampiran',
    description: 'Unggah berkas pendukung (opsional)'
  }
];

const CreateReportModal = React.memo(({ open, onClose, categories, onSubmit }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    description: '',
    isAnonymous: false,
    files: []
  });
  const [errors, setErrors] = useState({});
  const [submitWarning, setSubmitWarning] = useState('');

  // Whether the currently selected category permits anonymous reporting.
  const selectedCategory = useMemo(
    () => categories?.find((c) => String(c.id) === String(formData.categoryId)),
    [categories, formData.categoryId]
  );
  const canBeAnonymous = !!selectedCategory?.allowAnonymous;

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // If category changes and no longer allows anonymous, force-disable.
      if (field === 'categoryId') {
        const cat = categories?.find((c) => String(c.id) === String(value));
        if (!cat?.allowAnonymous) next.isAnonymous = false;
      }
      return next;
    });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRichTextChange = (field) => (content) => {
    setFormData(prev => ({
      ...prev,
      [field]: content
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length === 0) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_SIZE);
    
    if (oversizedFiles.length > 0) {
      setErrors(prev => ({ 
        ...prev, 
        files: `Ukuran file maksimal 5MB. File berikut melebihi batas: ${oversizedFiles.map(f => f.name).join(', ')}` 
      }));
      // Filter out oversized files
      const validFiles = selectedFiles.filter(file => file.size <= MAX_SIZE);
      if (validFiles.length === 0) return;
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next.files;
        return next;
      });
    }

    const validFiles = selectedFiles.filter(file => file.size <= MAX_SIZE);
    setIsCompressing(true);
    try {
      const processedFiles = await Promise.all(
        validFiles.map(async (file) => {
          // Only compress image files, leave PDF/DOC as-is
          if (file.type.startsWith('image/')) {
            try {
              const options = {
                maxSizeMB: 1,             // Target size < 1MB
                maxWidthOrHeight: 1600,   // Slightly higher max dimension for reports to preserve text evidence
                useWebWorker: true,
              };
              const compressedBlob = await imageCompression(file, options);
              return new File([compressedBlob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
            } catch (err) {
              console.error('Compression failed for file:', file.name, err);
              return file; // Fallback to original file
            }
          }
          return file; // Keep original if not an image
        })
      );

      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...processedFiles]
      }));
    } catch (err) {
      console.error('File processing error:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const getTextLength = (html) => richTextToPlainText(html);

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0:
        if (!formData.title.trim()) newErrors.title = 'Judul laporan wajib diisi';
        if (!formData.categoryId) newErrors.categoryId = 'Kategori wajib dipilih';
        break;
      case 1: {
        const plainTextDescription = getTextLength(formData.description);
        if (!plainTextDescription.trim()) newErrors.description = 'Deskripsi laporan wajib diisi';
        if (plainTextDescription.length < 20) newErrors.description = 'Deskripsi minimal 20 karakter';
        break;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) return;
    
    setLoading(true);
    setSubmitWarning('');
    try {
      // First, create the report without files
      const reportData = {
        title: formData.title,
        categoryId: formData.categoryId,
        description: formData.description,
        isAnonymous: !!formData.isAnonymous
      };

      const createdReport = await onSubmit(reportData);
      
      // If there are files and report was created successfully, upload them
      if (formData.files.length > 0 && createdReport?.id) {
        try {
          await uploadAttachments(createdReport.id, formData.files);
        } catch (uploadError) {
          console.warn('Report created but failed to upload attachments:', uploadError);
          setSubmitWarning(
            'Laporan berhasil dibuat, tetapi lampiran gagal diunggah. Anda dapat mencoba lagi dari detail laporan selama status masih PENDING.'
          );
          return;
        }
      }

      handleClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error; // Re-throw to let parent handle the error
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      title: '',
      categoryId: '',
      description: '',
      isAnonymous: false,
      files: []
    });
    setErrors({});
    setSubmitWarning('');
    onClose();
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Judul Laporan"
              placeholder="Masukkan judul yang jelas dan singkat"
              value={formData.title}
              onChange={handleInputChange('title')}
              error={!!errors.title}
              helperText={errors.title}
              sx={{ mb: 3 }}
            />
            
            <FormControl fullWidth error={!!errors.categoryId}>
              <InputLabel>Kategori Laporan</InputLabel>
              <Select
                value={formData.categoryId}
                label="Kategori Laporan"
                onChange={handleInputChange('categoryId')}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.categoryId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.categoryId}
                </Typography>
              )}
            </FormControl>

            {/* Anonymous toggle — only available for categories that allow it */}
            {canBeAnonymous && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  borderRadius: 2,
                  border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                }}
              >
                <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                  <VisibilityOff color="primary" sx={{ mt: 0.5 }} aria-hidden="true" />
                  <Box sx={{ flex: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!formData.isAnonymous}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, isAnonymous: e.target.checked }))
                          }
                          inputProps={{ 'aria-label': 'Laporkan secara anonim' }}
                        />
                      }
                      label={
                        <Typography variant="subtitle2" fontWeight={600}>
                          Laporkan secara anonim
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                    <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
                      Identitas Anda (nama, NIM, email) akan disembunyikan dari admin
                      untuk laporan ini. Pesan chat Anda akan tampil sebagai &ldquo;Anonim&rdquo;.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
          </Box>
        );
        
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <RichTextEditor
              label="Deskripsi Laporan"
              placeholder="Jelaskan masalah secara detail, kapan terjadi, dan dampaknya..."
              value={formData.description}
              onChange={handleRichTextChange('description')}
              error={!!errors.description}
              helperText={errors.description || 'Gunakan toolbar di atas untuk format teks (bold, italic, list, dll)'}
              minHeight={250}
            />
          </Box>
        );
        
      case 2:
        return (
            <Box sx={{ mt: 2, position: 'relative' }}>
            <UploadArea component="label" sx={{ pointerEvents: isCompressing ? 'none' : 'auto', opacity: isCompressing ? 0.7 : 1 }}>
              <CloudUpload sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight={600}>
                {isCompressing ? 'Mengompresi Gambar...' : 'Unggah Berkas Pendukung'}
              </Typography>
              {isCompressing && <LinearProgress sx={{ width: '80%', mt: 1, borderRadius: 2 }} />}
              {!isCompressing && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Drag & drop file di sini atau klik untuk browse
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Format: JPG, PNG, PDF, DOC (Max 5MB per file)
                  </Typography>
                </>
              )}
              <input
                type="file"
                hidden
                multiple
                disabled={isCompressing}
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </UploadArea>
            
            {errors.files && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                {errors.files}
              </Alert>
            )}
          
            {formData.files.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  File yang dipilih:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.files.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      onDelete={() => removeFile(index)}
                      icon={<AttachFile />}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
          
        );
        
      default:
        return null;
    }
  };

  return (
    <StyledDialog open={open} onClose={handleClose} maxWidth="md" >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2, mr: 2, ml: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assignment color="primary" />
          <Typography variant="h5" fontWeight={700}>
            Buat Laporan Baru
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 4, pt: 0 , mr: 2, ml: 2,}}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {submitWarning && (
          <Alert severity="warning" role="alert" aria-live="assertive" sx={{ mb: 2, borderRadius: 2 }}>
            {submitWarning}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="subtitle1" fontWeight={600}>
                  {step.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </StepLabel>
              <StepContent>
                {renderStepContent(index)}
                
                <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                  {index > 0 && (
                    <Button onClick={handleBack}>
                      Kembali
                    </Button>
                  )}
                  
                  {index < steps.length - 1 ? (
                    <Button 
                      variant="contained" 
                      onClick={handleNext}
                      disabled={loading}
                    >
                      Lanjutkan
                    </Button>
                  ) : (
                    <Button 
                      variant="contained" 
                      onClick={handleSubmit}
                      disabled={loading || isCompressing}
                      startIcon={<Send />}
                    >
                      {loading ? 'Mengirim...' : 'Kirim Laporan'}
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
    </StyledDialog>
  );
});

export default CreateReportModal; 
