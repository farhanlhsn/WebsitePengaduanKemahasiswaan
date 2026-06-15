import React from 'react';
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem, Menu,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, CardContent, CardActions,
  Skeleton, Zoom, Tooltip, Stack, useMediaQuery
} from '@mui/material';
import { 
  Visibility, AddCircle, Assignment, ViewModule, ViewList, VisibilityOff, MoreVert
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import EnhancedButton from '../ui/EnhancedButton';
import SearchInput from '../ui/SearchInput';
import StatusBadge from '../ui/StatusBadge';
import GlassCard from '../ui/GlassCard';
import RichTextDisplay from '../ui/RichTextDisplay';
import { richTextToPlainText } from '../../utils/sanitizeHtml';
import ReportDetailModal from './ReportDetailModal';

const CATEGORY_COLOR = '#2E7D32';

function stripHtml(html) {
  return richTextToPlainText(html);
}

const ImprovedReportsTable = React.memo(({
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
  onSearchChange,
  onOpenDetail
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [viewMode, setViewMode] = React.useState(isMobile ? 'card' : 'table');
  const [actionAnchorEl, setActionAnchorEl] = React.useState(null);
  const [actionReport, setActionReport] = React.useState(null);
  const [fallbackReport, setFallbackReport] = React.useState(null);

  const openDetail = React.useCallback((report) => {
    if (onOpenDetail) onOpenDetail(report);
    else setFallbackReport(report);
  }, [onOpenDetail]);

  const openActionMenu = (event, report) => {
    event.stopPropagation();
    setActionAnchorEl(event.currentTarget);
    setActionReport(report);
  };

  const closeActionMenu = () => {
    setActionAnchorEl(null);
    setActionReport(null);
  };

  // Auto-switch to card view on mobile
  React.useEffect(() => {
    if (isMobile && viewMode === 'table') {
      setViewMode('card');
    }
  }, [isMobile, viewMode]);

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
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(auto-fill, minmax(320px, 1fr))',
        md: 'repeat(auto-fill, minmax(350px, 1fr))'
      }, 
      gap: { xs: 1.25, sm: 1.75 }, 
      p: { xs: 1.25, sm: 1.75 } 
    }}>
      {reports.map((report) => (
          <GlassCard 
            key={report.id}
            variant="default" 
            hover={false}
            sx={{
              cursor: 'pointer',
              p: 0,
              boxShadow: 'none'
            }}
            onClick={() => openDetail(report)}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={700} 
                    sx={{ 
                      mb: 0.5,
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {report.title}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      #{report.registrationNumber}
                    </Typography>
                    {report.isAnonymous && (
                      <Tooltip title="Laporan anonim — identitas Anda disembunyikan dari admin">
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            color: 'warning.main',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}
                        >
                          <VisibilityOff sx={{ fontSize: 12 }} />
                          Anonim
                        </Box>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
                <StatusBadge status={report.status} size="small" />
              </Box>

              {/* Description */}
              <Box sx={{ mb: 2 }}>
                <RichTextDisplay 
                  content={report.description}
                  variant="body2"
                  maxLines={3}
                  showFullButton={false}
                />
              </Box>

              {/* Category and Date */}
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', sm: 'center' }} 
                spacing={1}
                sx={{ mb: 2 }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: alpha(CATEGORY_COLOR, 0.1),
                    border: `1px solid ${alpha(CATEGORY_COLOR, 0.2)}`,
                    maxWidth: '100%'
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: CATEGORY_COLOR, 
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                    noWrap
                  >
                    {report.category?.name || 'Tidak ada kategori'}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(report.createdAt)}
                </Typography>
              </Stack>
            </CardContent>

            <CardActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, pt: 0 }}>
              <EnhancedButton
                variant="outlined"
                startIcon={<Visibility />}
                onClick={(e) => {
                  e.stopPropagation();
                  openDetail(report);
                }}
                fullWidth
                size="small"
              >
                Lihat Detail
              </EnhancedButton>
            </CardActions>
          </GlassCard>
      ))}
    </Box>
  );

  const MobileTableView = CardView;

  const DesktopTableView = () => (
    <TableContainer sx={{ overflowX: 'hidden' }}>
      <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, width: '17%', py: 1.5 }}>No. Registrasi</TableCell>
            <TableCell sx={{ fontWeight: 700, width: '31%', py: 1.5 }}>Judul Laporan</TableCell>
            <TableCell sx={{ fontWeight: 700, width: '17%', py: 1.5 }}>Kategori</TableCell>
            <TableCell sx={{ fontWeight: 700, width: '16%', py: 1.5 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700, width: '13%', py: 1.5 }}>Tanggal</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700, width: 56, py: 1.5 }}>Aksi</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reports.map((report) => (
              <TableRow 
                key={report.id}
                onClick={() => openDetail(report)}
                sx={{ 
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    cursor: 'pointer'
                  },
                  '&:last-child td': { border: 0 }
                }}
              >
                <TableCell sx={{ py: 1.5, wordBreak: 'break-word' }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography variant="body1" fontWeight={600}>
                      {report.registrationNumber}
                    </Typography>
                    {report.isAnonymous && (
                      <Tooltip title="Laporan anonim — identitas Anda disembunyikan dari admin">
                        <VisibilityOff sx={{ fontSize: 16, color: 'warning.main' }} />
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
                <TableCell sx={{ py: 1.5, wordBreak: 'break-word' }}>
                  <Typography variant="body1" fontWeight={500} sx={{ mb: 0.5 }}>
                    {report.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(() => {
                      const plain = stripHtml(report.description);
                      return plain.length > 50 ? `${plain.substring(0, 50)}...` : plain;
                    })()}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1.5, wordBreak: 'break-word' }}>
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
                    {report.category?.name || '-'}
                  </Box>
                </TableCell>
                <TableCell sx={{ py: 1.5, wordBreak: 'break-word' }}>
                  <StatusBadge status={report.status} />
                </TableCell>
                <TableCell sx={{ py: 1.5, wordBreak: 'break-word' }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(report.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ py: 1.5 }}>
                  <Tooltip title="Buka menu aksi">
                    <IconButton size="small" onClick={(event) => openActionMenu(event, report)} aria-label="Buka menu aksi">
                      <MoreVert />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100%', pt: 0 }}>
      <GlassCard variant="default" hover={false} sx={{ p: 0, borderRadius: { xs: 2, sm: 3 }, overflow: 'hidden', boxShadow: 'none' }}>
        {/* Header Section */}
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            mb: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Daftar Laporan
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kelola dan pantau status laporan Anda
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
              {/* View Mode Toggle - Only show on desktop */}
              {!isMobile && (
                <Box sx={{ display: 'flex', gap: 0.5, mr: 2 }}>
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
              )}

              <EnhancedButton
                variant="contained"
                startIcon={<AddCircle />}
                onClick={onCreateReport || (() => navigate('/create-report'))}
                size={isTablet ? 'medium' : 'large'}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                {isTablet ? 'Buat Laporan' : 'Buat Laporan Baru'}
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
                  sx={{ borderRadius: 2, backgroundColor: 'background.paper' }}
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
                  sx={{ borderRadius: 2, backgroundColor: 'background.paper' }}
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
            {viewMode === 'card' ? (
              <CardView />
            ) : isMobile ? (
              <MobileTableView />
            ) : (
              <DesktopTableView />
            )}

            {/* Load More Button */}
            {hasNextPage && (
              <Box sx={{ p: 3, textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <EnhancedButton
                  onClick={onLoadMore}
                  loading={loading}
                  loadingText="Memuat..."
                  variant="outlined"
                  size="small"
                >
                  Muat Lebih Banyak
                </EnhancedButton>
              </Box>
            )}
          </>
        )}

        <Menu
          anchorEl={actionAnchorEl}
          open={Boolean(actionAnchorEl)}
          onClose={closeActionMenu}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        >
          <MenuItem
            onClick={() => {
              if (actionReport) openDetail(actionReport);
              closeActionMenu();
            }}
            sx={{ gap: 1 }}
          >
            <Visibility fontSize="small" />
            Lihat Detail
          </MenuItem>
        </Menu>
      </GlassCard>
      <ReportDetailModal
        open={Boolean(fallbackReport)}
        report={fallbackReport}
        onClose={() => setFallbackReport(null)}
        onOpenChat={(report) => {
          setFallbackReport(null);
          if (report?.id) navigate(`/dashboard/chat/${report.id}`);
        }}
      />
    </Box>
  );
});

export default ImprovedReportsTable;