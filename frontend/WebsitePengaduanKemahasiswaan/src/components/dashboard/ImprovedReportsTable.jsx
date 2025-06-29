import React from 'react';
import {
  Box, Paper, Typography, Button, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, CircularProgress, Card, CardContent, CardActions,
  Skeleton, Fade, Zoom, Tooltip, Stack
} from '@mui/material';
import { 
  Visibility, AddCircle, Assignment, FilterList, ViewModule, ViewList 
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import EnhancedButton from '../ui/EnhancedButton';
import SearchInput from '../ui/SearchInput';
import StatusBadge from '../ui/StatusBadge';
import GlassCard from '../ui/GlassCard';

const CATEGORY_COLOR = '#2E7D32';

const ImprovedReportsTable = ({
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
  const theme = useTheme();
  const [viewMode, setViewMode] = React.useState('table'); // 'table' or 'card'

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const LoadingSkeleton = () => (
    <Box sx={{ p: 3 }}>
      {[...Array(5)].map((_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
        </Box>
      ))}
    </Box>
  );

  const EmptyState = () => (
    <Box sx={{ p: 8, textAlign: 'center' }}>
      <Zoom in timeout={800}>
        <Box>
          <Assignment sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Belum ada laporan
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Mulai buat laporan untuk menyampaikan aspirasi Anda
          </Typography>
          <EnhancedButton
            variant="contained"
            startIcon={<AddCircle />}
            onClick={onCreateReport || (() => navigate('/create-report'))}
            size="large"
          >
            Buat Laporan Pertama
          </EnhancedButton>
        </Box>
      </Zoom>
    </Box>
  );

  const CardView = () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 3, p: 2 }}>
      {reports.map((report, index) => (
        <Fade in timeout={300 + index * 100} key={report.id}>
          <GlassCard variant="glass" hover>
            <CardContent sx={{ p: 3 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }} noWrap>
                    {report.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    #{report.registrationNumber}
                  </Typography>
                </Box>
                <StatusBadge status={report.status} size="small" />
              </Box>

              {/* Description */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                {report.description.length > 120 
                  ? `${report.description.substring(0, 120)}...` 
                  : report.description}
              </Typography>

              {/* Category and Date */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: alpha(CATEGORY_COLOR, 0.1),
                    border: `1px solid ${alpha(CATEGORY_COLOR, 0.2)}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: CATEGORY_COLOR, fontWeight: 600 }}>
                    {report.category?.name || 'Tidak ada kategori'}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(report.createdAt)}
                </Typography>
              </Stack>
            </CardContent>

            <CardActions sx={{ px: 3, pb: 3, pt: 0 }}>
              <EnhancedButton
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => navigate(`/report/${report.id}`)}
                fullWidth
                size="small"
              >
                Lihat Detail
              </EnhancedButton>
            </CardActions>
          </GlassCard>
        </Fade>
      ))}
    </Box>
  );

  const TableView = () => (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="medium">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 3 }}>No. Registrasi</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 3 }}>Judul Laporan</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 3 }}>Kategori</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 3 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 3 }}>Tanggal</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '1rem', py: 3 }}>Aksi</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reports.map((report, index) => (
            <Fade in timeout={200 + index * 50} key={report.id}>
              <TableRow 
                sx={{ 
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    cursor: 'pointer'
                  },
                  '&:last-child td': { border: 0 }
                }}
              >
                <TableCell sx={{ py: 3 }}>
                  <Typography variant="body1" fontWeight={600}>
                    {report.registrationNumber}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 3, maxWidth: 400 }}>
                  <Typography variant="body1" fontWeight={500} sx={{ mb: 0.5 }}>
                    {report.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {report.description.length > 50 
                      ? `${report.description.substring(0, 50)}...` 
                      : report.description}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 3 }}>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: CATEGORY_COLOR,
                      color: 'white',
                      display: 'inline-block',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      minWidth: 80,
                      textAlign: 'center'
                    }}
                  >
                    {report.category?.name || 'N/A'}
                  </Box>
                </TableCell>
                <TableCell sx={{ py: 3 }}>
                  <StatusBadge status={report.status} />
                </TableCell>
                <TableCell sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(report.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ py: 3 }}>
                  <Tooltip title="Lihat Detail">
                    <IconButton 
                      onClick={() => navigate(`/report/${report.id}`)}
                      sx={{ 
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.08)
                        }
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </Fade>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pt: 0 }}>
      <GlassCard variant="glass" sx={{ borderRadius: { xs: 0, sm: 4 }, overflow: 'hidden' }}>
        {/* Header Section */}
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
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
              <Typography variant="body2" color="text.secondary">
                Kelola dan pantau status laporan Anda
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {/* View Mode Toggle */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, mr: 2 }}>
                <Tooltip title="Tampilan Tabel">
                  <IconButton 
                    onClick={() => setViewMode('table')}
                    color={viewMode === 'table' ? 'primary' : 'default'}
                    size="small"
                  >
                    <ViewList />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Tampilan Kartu">
                  <IconButton 
                    onClick={() => setViewMode('card')}
                    color={viewMode === 'card' ? 'primary' : 'default'}
                    size="small"
                  >
                    <ViewModule />
                  </IconButton>
                </Tooltip>
              </Box>

              <EnhancedButton
                variant="contained"
                startIcon={<AddCircle />}
                onClick={onCreateReport || (() => navigate('/create-report'))}
                size={window.innerWidth < 600 ? 'medium' : 'large'}
              >
                {window.innerWidth < 600 ? 'Buat Laporan' : 'Buat Laporan Baru'}
              </EnhancedButton>
            </Box>
          </Box>

          {/* Search and Filters */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            flexWrap: 'wrap',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: 280 } }}>
              <SearchInput
                value={searchQuery || ''}
                onChange={onSearchChange}
                placeholder="Cari laporan..."
                showFilter
              />
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              width: { xs: '100%', sm: 'auto' },
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={onStatusChange}
                  sx={{ borderRadius: 2, backgroundColor: 'white' }}
                >
                  <MenuItem value="">Semua Status</MenuItem>
                  <MenuItem value="PENDING">Menunggu</MenuItem>
                  <MenuItem value="IN_REVIEW">Ditinjau</MenuItem>
                  <MenuItem value="IN_PROGRESS">Diproses</MenuItem>
                  <MenuItem value="RESOLVED">Selesai</MenuItem>
                  <MenuItem value="REJECTED">Ditolak</MenuItem>
                  <MenuItem value="CANCELED">Dibatalkan</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Kategori"
                  onChange={onCategoryChange}
                  sx={{ borderRadius: 2, backgroundColor: 'white' }}
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

        {/* Content */}
        {loading && reports.length === 0 ? (
          <LoadingSkeleton />
        ) : reports.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {viewMode === 'card' ? <CardView /> : <TableView />}

            {/* Load More Button */}
            {hasNextPage && (
              <Box sx={{ p: 3, textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <EnhancedButton
                  onClick={onLoadMore}
                  loading={loading}
                  loadingText="Memuat..."
                  variant="outlined"
                  size="large"
                >
                  Muat Lebih Banyak
                </EnhancedButton>
              </Box>
            )}
          </>
        )}
      </GlassCard>
    </Box>
  );
};

export default ImprovedReportsTable;