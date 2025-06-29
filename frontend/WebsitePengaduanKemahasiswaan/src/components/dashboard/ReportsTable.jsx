import React from 'react';
import {
  Box, Paper, Typography, Button, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, CircularProgress, TextField, InputAdornment
} from '@mui/material';
import { Visibility, AddCircle, Assignment, Search } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
  PENDING: '#FFC107',
  IN_REVIEW: '#2196F3',
  IN_PROGRESS: '#FF9800',
  RESOLVED: '#4CAF50',
  REJECTED: '#F44336',
  CANCELED: '#9E9E9E'
};

const STATUS_LABELS = {
  PENDING: 'Menunggu',
  IN_REVIEW: 'Ditinjau',
  IN_PROGRESS: 'Diproses',
  RESOLVED: 'Selesai',
  REJECTED: 'Ditolak',
  CANCELED: 'Dibatalkan'
};

// Category color for consistent styling
const CATEGORY_COLOR = '#2E7D32'; // Single green color matching theme


const ReportsTable = ({
  reports,
  loading,
  categories,
  statusFilter,
  categoryFilter,
  onStatusChange,
  onCategoryChange,
  onLoadMore,
  hasNextPage,
  onCreateReport,
  searchQuery,
  onSearchChange
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      bgcolor: '#f8f9fa',
      minHeight: { xs: '100vh', sm: 'auto' },
      pt: { xs: 0, sm: 0 }
    }}>
      <Paper sx={{ 
        borderRadius: { xs: 0, sm: 4 },
        overflow: 'hidden',
        boxShadow: { xs: 'none', sm: '0 2px 12px rgba(0,0,0,0.08)' },
        border: { xs: 'none', sm: '1px solid rgba(0,0,0,0.06)' },
        width: '100%',
        mx: { xs: 0, sm: 'auto' },
        bgcolor: 'white'
      }}>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        {/* Header Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Laporan Terbaru
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Kelola dan pantau status laporan Anda
            </Typography>
          </Box>
          
          {/* Desktop Button */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Button
              variant="contained"
              startIcon={<AddCircle />}
              onClick={onCreateReport || (() => navigate('/create-report'))}
              sx={{ 
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.25)'
                }
              }}
            >
              Buat Laporan
            </Button>
          </Box>

          {/* Mobile Button */}
          <Box sx={{ display: { xs: 'block', sm: 'none' }, width: '100%' }}>
            <Button
              variant="contained"
              startIcon={<AddCircle />}
              onClick={onCreateReport || (() => navigate('/create-report'))}
              fullWidth
              sx={{ 
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(46, 125, 50, 0.25)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.35)'
                }
              }}
            >
              Buat Laporan Baru
            </Button>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          flexWrap: 'wrap',
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <TextField
            size="small"
            placeholder="Cari laporan..."
            value={searchQuery || ''}
            onChange={onSearchChange}
            sx={{ 
              minWidth: { xs: '100%', sm: 280 },
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 1, sm: 1 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'white'
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 }, 
            width: { xs: '100%', sm: 'auto' },
            order: { xs: 2, sm: 2 },
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 }, flex: { xs: 1, sm: 'none' } }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={onStatusChange}
                sx={{ 
                  borderRadius: 2,
                  backgroundColor: 'white'
                }}
              >
                <MenuItem value="">Semua Status</MenuItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 }, flex: { xs: 1, sm: 'none' } }}>
              <InputLabel>Kategori</InputLabel>
              <Select
                value={categoryFilter}
                label="Kategori"
                onChange={onCategoryChange}
                sx={{ 
                  borderRadius: 2,
                  backgroundColor: 'white'
                }}
              >
                <MenuItem value="">Semua Kategori</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      {/* Table Content */}
      {loading && reports.length === 0 ? (
        <Box sx={{ p: 8, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      ) : reports.length === 0 ? (
        <Box sx={{ p: 8, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Belum ada laporan
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Mulai buat laporan untuk menyampaikan aspirasi Anda
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddCircle />}
            onClick={onCreateReport || (() => navigate('/create-report'))}
            sx={{ 
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Buat Laporan Pertama
          </Button>
        </Box>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
            {reports.map((report) => (
              <Box
                key={report.id}
                sx={{
                  p: 3,
                  mb: 2,
                  mx: 2,
                  borderRadius: 3,
                  bgcolor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => navigate(`/report/${report.id}`)}
              >
                {/* Card Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }} noWrap>
                      {report.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      #{report.registrationNumber}
                    </Typography>
                  </Box>
                  <Chip
                    label={STATUS_LABELS[report.status]}
                    size="small"
                    sx={{
                      bgcolor: alpha(STATUS_COLORS[report.status], 0.15),
                      color: STATUS_COLORS[report.status],
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      ml: 2,
                      flexShrink: 0
                    }}
                  />
                </Box>

                {/* Card Body */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                  {report.description.length > 100 
                    ? `${report.description.substring(0, 100)}...` 
                    : report.description}
                </Typography>

                {/* Card Footer */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={report.category?.name || 'Tidak ada kategori'}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.7rem',
                        height: 24,
                        borderColor: CATEGORY_COLOR,
                        color: CATEGORY_COLOR
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(report.createdAt).toLocaleDateString('id-ID')}
                  </Typography>
                </Box>
              </Box>
            ))}

            {/* Load More Button for Mobile */}
            {hasNextPage && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button
                  onClick={onLoadMore}
                  disabled={loading}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4
                  }}
                >
                  {loading ? <CircularProgress size={20} /> : 'Muat Lebih Banyak'}
                </Button>
              </Box>
            )}
          </Box>

          {/* Desktop Table Layout */}
          <TableContainer sx={{ 
            display: { xs: 'none', lg: 'block' },
            width: '100%', 
            px: { xs: 1, sm: 2 },
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#888',
              borderRadius: 4,
            },
          }}>
            <Table size="medium" sx={{ width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 3, px: 3 }}>No. Registrasi</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 3, px: 3 }}>Judul Laporan</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 3, px: 3 }}>Kategori</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 3, px: 3 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 3, px: 3 }}>Tanggal</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, fontSize: '1rem', py: 3, px: 3 }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow 
                    key={report.id}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'grey.50',
                        cursor: 'pointer'
                      },
                      '&:last-child td': { border: 0 }
                    }}
                  >
                    <TableCell sx={{ py: 3, px: 3 }}>
                      <Typography variant="body1" fontWeight={600}>
                        {report.registrationNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 3, px: 3, maxWidth: 400 }}>
                      <Typography variant="body1" fontWeight={500} sx={{ mb: 0.5 }}>
                        {report.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {report.description.length > 50 
                          ? `${report.description.substring(0, 50)}...` 
                          : report.description}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 3, px: 3 }}>
                      <Chip 
                        label={report.category?.name || 'Tidak ada kategori'}
                        size="medium"
                        sx={{ 
                          bgcolor: CATEGORY_COLOR,
                          color: 'white',
                          fontWeight: 600,
                          borderRadius: 2,
                          px: 1.5,
                          py: 0.5,
                          minWidth: 80
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 3, px: 3 }}>
                      <Chip
                        label={STATUS_LABELS[report.status]}
                        size="medium"
                        sx={{
                          bgcolor: alpha(STATUS_COLORS[report.status], 0.15),
                          color: STATUS_COLORS[report.status],
                          fontWeight: 600,
                          borderRadius: 2
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 3, px: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(report.createdAt).toLocaleDateString('id-ID', { 
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 3, px: 3 }}>
                      <IconButton 
                        onClick={() => navigate(`/report/${report.id}`)}
                        sx={{ 
                          color: 'primary.main',
                          '&:hover': {
                            bgcolor: alpha('#2E7D32', 0.08)
                          }
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Load More Button for Desktop */}
          {hasNextPage && (
            <Box sx={{ display: { xs: 'none', lg: 'block' }, p: 3, textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <Button
                onClick={onLoadMore}
                disabled={loading}
                variant="outlined"
                sx={{ 
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4
                }}
              >
                {loading ? <CircularProgress size={20} /> : 'Muat Lebih Banyak'}
              </Button>
            </Box>
          )}
        </>
      )}
    </Paper>
    </Box>
  );
};

export default ReportsTable; 