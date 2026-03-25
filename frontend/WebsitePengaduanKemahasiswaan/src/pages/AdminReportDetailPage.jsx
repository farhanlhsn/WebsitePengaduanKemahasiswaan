import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Container, Paper, Typography, Button, Chip, Grid, Avatar,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Card, CardContent, CardActions, Tooltip, Stack,
  useTheme, IconButton, AppBar, Toolbar, Menu, MenuItem, ListItemIcon
} from '@mui/material';
import {
  ArrowBack, Assignment, AccessTime, Person, Category as CategoryIcon,
  Delete, Restore, Download, Visibility, AttachFile,
  School, Email, Today, CheckCircle, HourglassEmpty,
  Cancel, Error as ErrorIcon, Pending, Chat, Send, Description, Close as CloseIcon, Edit
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import useReportStore from '../stores/reportStore';
import useChatStore from '../stores/chatStore';
import useAuthStore from '../stores/authStore';
import { DocViewerPlus } from 'react-doc-viewer-plus';
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
import AdminLayout from '../components/admin/AdminLayout';
import RichTextDisplay from '../components/ui/RichTextDisplay';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const STATUS_CONFIG = {
  PENDING: { label: 'Menunggu Verifikasi Admin', color: THEME_COLORS.pending, icon: <Pending /> },
  IN_REVIEW: { label: 'Ditinjau', color: THEME_COLORS.pending, icon: <HourglassEmpty /> },
  IN_PROGRESS: { label: 'Diproses', color: THEME_COLORS.pending, icon: <HourglassEmpty /> },
  RESOLVED: { label: 'Selesai', color: THEME_COLORS.resolved, icon: <CheckCircle /> },
  REJECTED: { label: 'Ditolak', color: THEME_COLORS.rejected, icon: <ErrorIcon /> },
  CANCELED: { label: 'Dibatalkan', color: THEME_COLORS.canceled, icon: <Cancel /> },
};

const cardStyle = {
  borderRadius: 4,
  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.03)',
  display: 'flex',
  flexDirection: 'column',
};

const InfoItem = ({ icon, label, value, color }) => (
  <Box>
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
      <Avatar sx={{ bgcolor: alpha(color, 0.15), color: color, width: 32, height: 32, borderRadius: 2 }}>
        {React.cloneElement(icon, { sx: { fontSize: '1rem' } })}
      </Avatar>
      <Typography variant="body2" fontWeight={600} color="text.secondary">{label}</Typography>
    </Stack>
    <Typography variant="body1" fontWeight={500} sx={{ pl: '48px' }}>{value || 'N/A'}</Typography>
  </Box>
);

const ActionDialog = ({ open, onClose, onConfirm, title, icon, color, confirmText, children, buttonColor }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
    <DialogTitle sx={{ pb: 1 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar sx={{ bgcolor: `${color}.main`, borderRadius: 2 }}>{icon}</Avatar>
        <Typography variant="h5" fontWeight={800}>{title}</Typography>
      </Stack>
    </DialogTitle>
    <DialogContent sx={{ py: 2 }}>{children}</DialogContent>
    <DialogActions sx={{ p: 2, pt: 0 }}>
      <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600 }}>Batal</Button>
      <Button onClick={onConfirm} color={color} variant="contained" sx={{ borderRadius: 2, fontWeight: 600, bgcolor: buttonColor }}>{confirmText}</Button>
    </DialogActions>
  </Dialog>
);

const BACKEND_UPLOAD_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/v1\/api\/?$/, '')
  : 'http://localhost:6060';

const AdminReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuthStore();
  const { getReportById, deleteReport, restoreReport, updateReportStatus, loading, error } = useReportStore();
  const { selectReport } = useChatStore();

  const [report, setReport] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfPreviewAttachment, setPdfPreviewAttachment] = useState(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchReport = async () => {
      if (id) {
        const data = await getReportById(id);
        setReport(data);
      }
    };
    fetchReport();
  }, [id, getReportById]);

  const handleDelete = async () => {
    await deleteReport(id);
    setDeleteDialog(false);
    navigate('/admin/reports');
  };

  const handleRestore = async () => {
    await restoreReport(id);
    setRestoreDialog(false);
    const updated = await getReportById(id);
    setReport(updated);
  };

  const handleOpenChat = async () => {
    if (report) {
      await selectReport(report);
      navigate('/admin/chat');
    }
  };

  const handleStatusMenuOpen = (event) => {
    setStatusMenuAnchor(event.currentTarget);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
  };

  const handleStatusChange = async (newStatus) => {
    handleStatusMenuClose();
    try {
      setActionError(null);
      await updateReportStatus(id, newStatus);
      setReport(prev => prev ? { ...prev, status: newStatus } : prev);
    } catch (e) {
      setActionError(e?.message || 'Gagal mengubah status laporan');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getFileTypeIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return '🖼️';
    if (fileType?.startsWith('video/')) return '🎥';
    if (fileType?.includes('pdf')) return '📄';
    return '📁';
  };

  const handleAttachmentPreview = (attachment) => {
    const isDoc = attachment.fileType.includes('msword') ||
                  attachment.fileType.includes('officedocument.wordprocessingml.document');
    if (isDoc) {
      const url = `${BACKEND_UPLOAD_URL}${attachment.filePath}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
      return;
    }
    const isPdf = attachment.fileType.includes('pdf');
    if (isPdf) {
      setPdfPreviewAttachment(attachment);
      setPdfPreviewOpen(true);
      return;
    }
    setPreviewAttachment(attachment);
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewAttachment(null);
  };

  if (loading && !report) return <LoadingSpinner fullScreen message="Memuat detail laporan..." />;
  if ((error && !report)) return (
    <AdminLayout>
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ borderRadius: 3, fontSize: '1rem', p: 3 }}>
          {error || 'Laporan tidak ditemukan atau gagal dimuat.'}
        </Alert>
      </Container>
    </AdminLayout>
  );

  const currentStatus = STATUS_CONFIG[report?.status] || STATUS_CONFIG.PENDING;

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/admin/reports')} 
            variant="text" 
            sx={{ 
              mb: 2,
              color: 'text.secondary', 
              textTransform: 'none', 
              fontSize: '1rem',
              fontWeight: 600,
              '&:hover': { 
                backgroundColor: alpha(theme.palette.primary.main, 0.05) 
              } 
            }}
          >
            Kembali ke Laporan
          </Button>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Detail Laporan
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Informasi lengkap tentang laporan #{report?.registrationNumber}
          </Typography>
        </Box>

        {/* Content Grid */}
        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              <Paper sx={cardStyle}>
                <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.15), 
                      color: theme.palette.primary.main, 
                      width: 56, 
                      height: 56,
                      borderRadius: 3,
                      flexShrink: 0 
                    }}>
                      <Assignment sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h5" fontWeight={800} sx={{ wordBreak: 'break-word' }}>
                        {report?.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        No. Laporan: {report?.registrationNumber}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                    Deskripsi Laporan
                  </Typography>
                  <Box sx={{ 
                    p: 3, 
                    mb: 3, 
                    bgcolor: 'grey.50', 
                    borderRadius: 2, 
                    minHeight: '150px',
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <RichTextDisplay content={report?.description} variant="body1" showFullButton={true} />
                  </Box>

                  {report?.attachments && report.attachments.length > 0 && (
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                        <Avatar sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.15), 
                          color: theme.palette.primary.main,
                          width: 32,
                          height: 32,
                          borderRadius: 2
                        }}>
                          <AttachFile sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Typography variant="h6" fontWeight={700}>Lampiran</Typography>
                        <Chip 
                          label={`${report.attachments.length} file`} 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha(theme.palette.primary.main, 0.1), 
                            color: theme.palette.primary.main,
                            fontWeight: 600 
                          }} 
                        />
                      </Stack>
                      <Grid container spacing={2}>
                        {report.attachments.map((attachment) => (
                          <Grid item xs={12} sm={6} key={attachment.id}>
                            <Card variant="outlined" sx={{ 
                              borderRadius: 2, 
                              borderColor: 'grey.200', 
                              height: '100%',
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                borderColor: 'primary.main'
                              }
                            }}>
                              <CardContent>
                                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                                  <Typography sx={{ fontSize: '2rem', flexShrink: 0 }}>
                                    {getFileTypeIcon(attachment.fileType)}
                                  </Typography>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Tooltip title={attachment.fileName || 'Unknown file'}>
                                      <Typography variant="subtitle2" fontWeight={700} noWrap>
                                        {attachment.fileName || 'Unknown file'}
                                      </Typography>
                                    </Tooltip>
                                  </Box>
                                </Stack>
                              </CardContent>
                              <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                                <Button 
                                  size="small" 
                                  startIcon={<Visibility />} 
                                  onClick={() => handleAttachmentPreview(attachment)} 
                                  variant="outlined"
                                  sx={{ borderRadius: 2, fontWeight: 600 }}
                                >
                                  Lihat
                                </Button>
                                <Button 
                                  size="small" 
                                  startIcon={<Download />} 
                                  component="a" 
                                  href={`${BACKEND_UPLOAD_URL}${attachment.filePath}`} 
                                  download={attachment.fileName} 
                                  variant="contained"
                                  sx={{ borderRadius: 2, fontWeight: 600, ml: 'auto' }}
                                >
                                  Unduh
                                </Button>
                              </CardActions>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Stack>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3} sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}>
              {report?.user && (
                <Paper sx={{ ...cardStyle, p: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                    Informasi Pelapor
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.15), 
                      color: theme.palette.primary.main, 
                      width: 56, 
                      height: 56,
                      borderRadius: 3,
                      fontWeight: 800
                    }}>
                      {report.user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>
                      {report.user.name}
                    </Typography>
                  </Stack>
                  <Stack spacing={2.5}>
                    <InfoItem 
                      icon={<School />} 
                      label="NIM" 
                      value={report.user.nim} 
                      color={theme.palette.text.secondary} 
                    />
                    <InfoItem 
                      icon={<Email />} 
                      label="Email" 
                      value={report.user.email} 
                      color={theme.palette.text.secondary} 
                    />
                  </Stack>
                </Paper>
              )}

              <Paper sx={{ ...cardStyle, p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                  Informasi Laporan
                </Typography>
                <Stack spacing={2.5} sx={{ mb: 3 }}>
                  <InfoItem 
                    icon={<CategoryIcon />} 
                    label="Kategori" 
                    value={report?.category?.name} 
                    color={theme.palette.primary.main} 
                  />
                  <InfoItem 
                    icon={<Today />} 
                    label="Tanggal Dibuat" 
                    value={formatDate(report?.createdAt)} 
                    color={theme.palette.text.secondary} 
                  />
                  {report?.updatedAt !== report?.createdAt && (
                    <InfoItem 
                      icon={<AccessTime />} 
                      label="Terakhir Diupdate" 
                      value={formatDate(report?.updatedAt)} 
                      color={theme.palette.warning.main} 
                    />
                  )}
                  {report?.closedAt && (
                    <InfoItem 
                      icon={<CheckCircle />} 
                      label="Tanggal Ditutup" 
                      value={formatDate(report?.closedAt)} 
                      color={theme.palette.success.main} 
                    />
                  )}
                  <InfoItem 
                    icon={currentStatus.icon} 
                    label="Status" 
                    value={currentStatus.label} 
                    color={currentStatus.color} 
                  />
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                  Aksi
                </Typography>
                {actionError && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {actionError}
                  </Alert>
                )}
                <Stack spacing={2}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    startIcon={<Chat />} 
                    onClick={handleOpenChat} 
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 2, 
                      fontWeight: 600
                    }}
                  >
                    Buka Chat
                  </Button>
                  
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<Edit />} 
                    onClick={handleStatusMenuOpen} 
                    disabled={!!report?.deletedAt}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 2, 
                      fontWeight: 600
                    }}
                  >
                    Ubah Status
                  </Button>
                  
                  <Menu
                    anchorEl={statusMenuAnchor}
                    open={Boolean(statusMenuAnchor)}
                    onClose={handleStatusMenuClose}
                    PaperProps={{
                      elevation: 0,
                      sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                        mt: 1.5,
                        width: 220,
                        borderRadius: 2
                      },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => (
                      <MenuItem 
                        key={statusKey} 
                        onClick={() => handleStatusChange(statusKey)}
                        selected={report?.status === statusKey}
                        disabled={report?.status === statusKey}
                        sx={{ py: 1.5, borderRadius: 1, mx: 0.5 }}
                      >
                        <ListItemIcon sx={{ color: config.color }}>
                          {config.icon}
                        </ListItemIcon>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {config.label}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Menu>

                  {report?.deletedAt ? (
                    <Button 
                      fullWidth 
                      variant="contained" 
                      color="success"
                      startIcon={<Restore />} 
                      onClick={() => setRestoreDialog(true)} 
                      sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}
                    >
                      Pulihkan Laporan
                    </Button>
                  ) : (
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      color="error" 
                      startIcon={<Delete />} 
                      onClick={() => setDeleteDialog(true)} 
                      sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}
                    >
                      Hapus Laporan
                    </Button>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>

        {/* Dialogs */}
        <ActionDialog
          open={deleteDialog}
          onClose={() => setDeleteDialog(false)}
          onConfirm={handleDelete}
          title="Hapus Laporan"
          icon={<Delete />}
          color="error"
          confirmText="Ya, Hapus"
        >
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            Apakah Anda yakin ingin menghapus laporan ini?
          </Alert>
          <Typography color="text.secondary">
            Aksi ini akan memindahkan laporan ke arsip (soft delete) dan dapat dipulihkan nanti.
          </Typography>
        </ActionDialog>

        <ActionDialog
          open={restoreDialog}
          onClose={() => setRestoreDialog(false)}
          onConfirm={handleRestore}
          title="Pulihkan Laporan"
          icon={<Restore />}
          color="success"
          confirmText="Ya, Pulihkan"
          buttonColor={theme.palette.success.main}
        >
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Apakah Anda yakin ingin memulihkan laporan ini?
          </Alert>
          <Typography color="text.secondary">
            Laporan akan dikembalikan ke status aktif dan terlihat di daftar utama.
          </Typography>
        </ActionDialog>

        {/* PDF Preview Dialog */}
        {pdfPreviewOpen && (
          <Dialog 
            fullScreen 
            open={pdfPreviewOpen} 
            onClose={() => { 
              setPdfPreviewOpen(false); 
              setPdfPreviewAttachment(null); 
              setNumPages(null); 
            }} 
            PaperProps={{ sx: { bgcolor: 'rgba(0,0,0,0.9)' } }}
          >
            <AppBar position="static" color="transparent" elevation={0}>
              <Toolbar>
                <IconButton 
                  edge="start" 
                  color="inherit" 
                  onClick={() => { 
                    setPdfPreviewOpen(false); 
                    setPdfPreviewAttachment(null); 
                    setNumPages(null); 
                  }}
                >
                  <CloseIcon sx={{ color: '#fff' }} />
                </IconButton>
                <Typography variant="h6" sx={{ flex: 1, color: '#fff', fontWeight: 600 }}>
                  {pdfPreviewAttachment?.fileName}
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Download />} 
                  component="a" 
                  href={`${BACKEND_UPLOAD_URL}${pdfPreviewAttachment?.filePath}`} 
                  download={pdfPreviewAttachment?.fileName}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  Unduh
                </Button>
              </Toolbar>
            </AppBar>
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', justifyContent: 'center' }}>
              <Document 
                file={`${BACKEND_UPLOAD_URL}${pdfPreviewAttachment?.filePath}`} 
                onLoadSuccess={({ numPages }) => setNumPages(numPages)} 
                loading={<CircularProgress />}
              >
                {Array.from(new Array(numPages), (_x, i) => (
                  <Page key={`page_${i + 1}`} pageNumber={i + 1} width={600} />
                ))}
              </Document>
            </Box>
          </Dialog>
        )}

        {/* Document Preview */}
        {previewAttachment && (
          <DocViewerPlus
            previewFile={{ 
              fileUrl: `${BACKEND_UPLOAD_URL}${previewAttachment.filePath}`, 
              fileName: previewAttachment.fileName 
            }}
            visibleViewerPlus={previewOpen}
            onVisibleChange={handlePreviewClose}
          />
        )}
      </Container>
    </AdminLayout>
  );
};

export default AdminReportDetailPage;

