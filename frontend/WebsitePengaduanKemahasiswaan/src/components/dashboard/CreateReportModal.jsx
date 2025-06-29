import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Box, Typography, IconButton, Stepper, Step, StepLabel, 
  StepContent, Chip, Alert, LinearProgress
} from '@mui/material';
import { 
  Close, CloudUpload, Assignment, Category, Description, 
  AttachFile, Send 
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import RichTextEditor from '../ui/RichTextEditor';

const StyledDialog = styled(Dialog)(({ theme }) => ({
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
    description: 'Upload file pendukung (opsional)'
  }
];

const CreateReportModal = React.memo(({ open, onClose, categories, onSubmit }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    description: '',
    files: []
  });
  const [errors, setErrors] = useState({});

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
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

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  // Utility function to strip HTML tags and get plain text length
  const getTextLength = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0:
        if (!formData.title.trim()) newErrors.title = 'Judul laporan wajib diisi';
        if (!formData.categoryId) newErrors.categoryId = 'Kategori wajib dipilih';
        break;
      case 1:
        const plainTextDescription = getTextLength(formData.description);
        if (!plainTextDescription.trim()) newErrors.description = 'Deskripsi laporan wajib diisi';
        if (plainTextDescription.length < 20) newErrors.description = 'Deskripsi minimal 20 karakter';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) return;
    
    setLoading(true);
    try {
      // First, create the report without files
      const reportData = {
        title: formData.title,
        categoryId: formData.categoryId,
        description: formData.description
      };

      const createdReport = await onSubmit(reportData);
      
      // If there are files and report was created successfully, upload them
      if (formData.files.length > 0 && createdReport?.id) {
        // Import uploadAttachments function
        const { uploadAttachments } = await import('../../services/api');
        try {
          await uploadAttachments(createdReport.id, formData.files);
        } catch (uploadError) {
          console.warn('Report created but failed to upload attachments:', uploadError);
          // Don't throw error as the report was successfully created
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
      files: []
    });
    setErrors({});
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
            <Box sx={{ mt: 2 }}>
            <UploadArea component="label">
              <CloudUpload sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Upload File Pendukung
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drag & drop file di sini atau klik untuk browse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Format: JPG, PNG, PDF, DOC (Max 5MB per file)
              </Typography>
              <input
                type="file"
                hidden
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </UploadArea>
          
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
                      disabled={loading}
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