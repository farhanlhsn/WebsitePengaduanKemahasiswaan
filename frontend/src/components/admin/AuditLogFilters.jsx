import React from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Paper,
  Typography,
  Avatar,
  Divider,
  MenuItem
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FilterList, Clear } from '@mui/icons-material';

const AuditLogFilters = ({ filters, onFiltersChange, onClear }) => {
  const handleChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 999, // pill style
      height: 40
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0,0,0,0.1)'
    }
  };

  return (
    <Paper
      sx={{
        borderRadius: 4,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)',
        overflow: 'hidden',
        mb: 3
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          pb: 2.5,
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          background: (theme) =>
            `linear-gradient(135deg, 
              ${alpha(theme.palette.background.paper, 0.9)}, 
              ${alpha(theme.palette.background.default, 0.6)})`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
              color: 'primary.main',
              width: 40,
              height: 40
            }}
          >
            <FilterList />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Filter Audit Logs
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Filter Form */}
      <Box
        sx={{
          p: 3,
          pt: 2.5,
          backgroundColor: (theme) => alpha(theme.palette.background.default, 0.6)
        }}
      >
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Tipe Entitas */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Tipe Entitas"
              value={filters.entityType || ''}
              onChange={(e) => handleChange('entityType', e.target.value)}
              InputLabelProps={{
                sx: { fontWeight: 600 }
              }}
              sx={inputSx}
            >
              <MenuItem value="">
                <Typography fontWeight={600}>Semua</Typography>
              </MenuItem>
              <MenuItem value="USER">
                <Typography fontWeight={600}>User</Typography>
              </MenuItem>
              <MenuItem value="REPORT">
                <Typography fontWeight={600}>Report</Typography>
              </MenuItem>
              <MenuItem value="CATEGORY">
                <Typography fontWeight={600}>Kategori</Typography>
              </MenuItem>
            </TextField>
          </Grid>

          {/* Aksi */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Aksi"
              value={filters.action || ''}
              onChange={(e) => handleChange('action', e.target.value)}
              InputLabelProps={{
                sx: { fontWeight: 600 }
              }}
              sx={inputSx}
            >
              <MenuItem value="">
                <Typography fontWeight={600}>Semua</Typography>
              </MenuItem>
              <MenuItem value="SOFT_DELETE">
                <Typography fontWeight={600}>Soft Delete</Typography>
              </MenuItem>
              <MenuItem value="RESTORE">
                <Typography fontWeight={600}>Restore</Typography>
              </MenuItem>
              <MenuItem value="HARD_DELETE">
                <Typography fontWeight={600}>Hard Delete</Typography>
              </MenuItem>
              <MenuItem value="UPDATE_STATUS">
                <Typography fontWeight={600}>Update Status</Typography>
              </MenuItem>
              <MenuItem value="VERIFY_MAHASISWA">
                <Typography fontWeight={600}>Verifikasi Mahasiswa</Typography>
              </MenuItem>
            </TextField>
          </Grid>

          {/* Tanggal Mulai */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Tanggal Mulai"
              value={filters.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
              InputLabelProps={{
                shrink: true,
                sx: { fontWeight: 600 }
              }}
              sx={inputSx}
            />
          </Grid>

          {/* Tanggal Akhir */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Tanggal Akhir"
              value={filters.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
              InputLabelProps={{
                shrink: true,
                sx: { fontWeight: 600 }
              }}
              sx={inputSx}
            />
          </Grid>

          {/* Limit */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Limit"
              value={filters.limit || 50}
              onChange={(e) => handleChange('limit', e.target.value)}
              inputProps={{ min: 1, max: 200 }}
              InputLabelProps={{
                sx: { fontWeight: 600 }
              }}
              sx={inputSx}
            />
          </Grid>

          {/* Tombol Hapus */}
          <Grid item xs={12} sm={6} md={2}>
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: { xs: 'flex-start', md: 'center' }
              }}
            >
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Clear />}
                onClick={onClear}
                sx={{
                  height: 40,
                  borderRadius: 999,
                  fontWeight: 600,
                  borderColor: 'rgba(0,0,0,0.12)',
                  color: 'text.secondary',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'error.main',
                    bgcolor: (theme) => alpha(theme.palette.error.main, 0.05),
                    color: 'error.main'
                  }
                }}
              >
                Hapus
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default AuditLogFilters;
