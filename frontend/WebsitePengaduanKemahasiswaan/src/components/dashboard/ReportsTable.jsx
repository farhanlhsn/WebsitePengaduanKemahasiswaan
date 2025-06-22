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
    <Paper sx={{ 
      borderRadius: 4,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.06)',
      width: '100%'
    }}>
      <Box sx={{ p: 4, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
              Laporan Terbaru
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Kelola dan pantau status laporan Anda
            </Typography>
          </Box>
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

        {/* Search and Filters */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Cari laporan..."
            value={searchQuery || ''}
            onChange={onSearchChange}
            sx={{ 
              minWidth: 280,
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
          
          <FormControl size="small" sx={{ minWidth: 180 }}>
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
          
          <FormControl size="small" sx={{ minWidth: 180 }}>
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
          <TableContainer sx={{ width: '100%', px: 2 }}>
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
                          bgcolor: alpha(STATUS_COLORS[report.status], 0.12),
                          color: STATUS_COLORS[report.status],
                          fontWeight: 600,
                          borderRadius: 2,
                          px: 1.5,
                          py: 0.5,
                          minWidth: 80
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 3, px: 3 }}>
                      <Typography variant="body1" color="text.secondary">
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

          {/* Load More */}
          {hasNextPage && (
            <Box sx={{ p: 4, textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <Button
                onClick={onLoadMore}
                disabled={loading}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                {loading ? <CircularProgress size={20} /> : 'Muat Lebih Banyak'}
              </Button>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default ReportsTable; 