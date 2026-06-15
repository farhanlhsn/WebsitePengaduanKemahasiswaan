import React, { useEffect, useState } from 'react';
import {
  Box, Container, Paper, Typography, Button, Chip, Grid, Avatar,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Card, Tooltip, Stack,
  useTheme, IconButton, AppBar, Toolbar, Menu, MenuItem, ListItemIcon,
  Breadcrumbs, Link
} from '@mui/material';
import {
  Assignment, AccessTime, Category as CategoryIcon,
  Delete, Restore, Download, Visibility, VisibilityOff, AttachFile,
  School, Email, Today, CheckCircle, HourglassEmpty,
  Cancel, Error as ErrorIcon, Pending, Chat, Close as CloseIcon, Edit,
  Home, NavigateNext
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import useReportStore from '../stores/reportStore';
import useChatStore from '../stores/chatStore';
import useAuthStore from '../stores/authStore';
import { DocViewerPlus } from 'react-doc-viewer-plus';
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
import RichTextDisplay from '../components/ui/RichTextDisplay';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const STATUS_CONFIG = {
  PENDING: { label: 'Menunggu', color: '#FFA726', icon: <Pending /> },
  IN_REVIEW: { label: 'Ditinjau', color: '#FFA726', icon: <HourglassEmpty /> },
  IN_PROGRESS: { label: 'Diproses', color: '#FFA726', icon: <HourglassEmpty /> },
  RESOLVED: { label: 'Selesai', color: '#43A047', icon: <CheckCircle /> },
  REJECTED: { label: 'Ditolak', color: '#F44336', icon: <ErrorIcon /> },
  CANCELED: { label: 'Dibatalkan', color: '#BDBDBD', icon: <Cancel /> },
};

const cardSx = {
  borderRadius: 3,
  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.06)',
};

const InfoCell = ({ icon, label, value, color }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Avatar sx={{ bgcolor: alpha(color, 0.12), color, width: 32, height: 32, borderRadius: 1.5 }}>
      {React.cloneElement(icon, { sx: { fontSize: '0.95rem' } })}
    </Avatar>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ lineHeight: 1.2 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={500} noWrap>{value || '-'}</Typography>
    </Box>
  </Box>
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

  useEffect(() => { if (user && !['ADMIN', 'SUPERADMIN'].includes(user.role)) navigate('/dashboard'); }, [user, navigate]);

  useEffect(() => {
    if (id) { getReportById(id, true).then(setReport); }
  }, [id, getReportById]);

  const handleDelete = async () => { await deleteReport(id); setDeleteDialog(false); navigate('/admin/reports'); };
  const handleRestore = async () => { await restoreReport(id); setRestoreDialog(false); setReport(await getReportById(id, true)); };
  const handleOpenChat = async () => { if (report) { await selectReport(report); navigate('/admin/chat'); } };
  const handleStatusChange = async (s) => {
    setStatusMenuAnchor(null);
    const reason = ['REJECTED', 'CANCELED'].includes(s)
      ? window.prompt('Masukkan alasan perubahan status:')
      : null;
    if (['REJECTED', 'CANCELED'].includes(s) && !reason?.trim()) {
      setActionError('Alasan wajib diisi untuk status ditolak atau dibatalkan.');
      return;
    }
    try { setActionError(null); await updateReportStatus(id, s, reason); setReport(prev => prev ? { ...prev, status: s } : prev); }
    catch (e) { setActionError(e?.message || 'Gagal mengubah status'); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
  const fileIcon = (t) => t?.startsWith('image/') ? '🖼️' : t?.includes('pdf') ? '📄' : t?.startsWith('video/') ? '🎥' : '📁';

  const handleAttachmentPreview = (att) => {
    if (att.fileType.includes('msword') || att.fileType.includes('officedocument.wordprocessingml.document')) {
      const a = document.createElement('a'); a.href = `${BACKEND_UPLOAD_URL}${att.filePath}`; a.download = att.fileName; document.body.appendChild(a); a.click(); a.remove(); return;
    }
    if (att.fileType.includes('pdf')) { setPdfPreviewAttachment(att); setPdfPreviewOpen(true); return; }
    setPreviewAttachment(att); setPreviewOpen(true);
  };

  if (loading && !report) return <LoadingSpinner fullScreen message="Memuat detail laporan..." />;
  if (error && !report) return (
    <Container maxWidth="lg"><Alert severity="error" sx={{ borderRadius: 3, p: 3 }}>{error || 'Laporan tidak ditemukan.'}</Alert></Container>
  );

  const st = STATUS_CONFIG[report?.status] || STATUS_CONFIG.PENDING;
  const hasAttachments = report?.attachments?.length > 0;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>

        {/* Breadcrumb */}
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 1.5 }}>
          <Link underline="hover" color="inherit" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => navigate('/admin')}>
            <Home sx={{ fontSize: 16 }} /> Dashboard
          </Link>
          <Link underline="hover" color="inherit" sx={{ cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => navigate('/admin/reports')}>Laporan</Link>
          <Typography color="text.primary" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>#{report?.registrationNumber}</Typography>
        </Breadcrumbs>

        {/* ═══ Header Card ═══ */}
        <Paper sx={{ ...cardSx, p: { xs: 2, md: 2.5 }, mb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, gap: 2 }}>
            {/* Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, width: 44, height: 44, borderRadius: 2, flexShrink: 0 }}>
                <Assignment sx={{ fontSize: 22 }} />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ wordBreak: 'break-word', lineHeight: 1.3 }}>{report?.title}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{report?.registrationNumber}</Typography>
              </Box>
            </Box>
            {/* Actions */}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" flexShrink={0}>
              <Chip icon={st.icon} label={st.label} size="small" sx={{ bgcolor: alpha(st.color, 0.1), color: st.color, fontWeight: 600, border: `1px solid ${alpha(st.color, 0.2)}` }} />
              <Button size="small" variant="contained" startIcon={<Chat />} onClick={handleOpenChat} sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none', px: 2 }}>Chat</Button>
              <Button size="small" variant="outlined" startIcon={<Edit />} onClick={(e) => setStatusMenuAnchor(e.currentTarget)} disabled={!!report?.deletedAt} sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none', px: 2 }}>Status</Button>
              <Menu anchorEl={statusMenuAnchor} open={Boolean(statusMenuAnchor)} onClose={() => setStatusMenuAnchor(null)}
                PaperProps={{ elevation: 0, sx: { filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))', mt: 1.5, width: 210, borderRadius: 2 } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                {Object.entries(STATUS_CONFIG).map(([k, c]) => (
                  <MenuItem key={k} onClick={() => handleStatusChange(k)} selected={report?.status === k} disabled={report?.status === k} sx={{ py: 1.2, mx: 0.5, borderRadius: 1 }}>
                    <ListItemIcon sx={{ color: c.color }}>{c.icon}</ListItemIcon>
                    <Typography variant="body2" fontWeight={600}>{c.label}</Typography>
                  </MenuItem>
                ))}
              </Menu>
              {report?.deletedAt ? (
                <Button size="small" variant="contained" color="success" startIcon={<Restore />} onClick={() => setRestoreDialog(true)} sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>Pulihkan</Button>
              ) : (
                <Tooltip title="Hapus Laporan"><IconButton size="small" color="error" onClick={() => setDeleteDialog(true)}><Delete fontSize="small" /></IconButton></Tooltip>
              )}
            </Stack>
          </Box>
          {actionError && <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>{actionError}</Alert>}
        </Paper>

        {/* ═══ Info Summary Row ═══ */}
        <Paper sx={{ ...cardSx, p: { xs: 1.5, md: 2 }, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {report?.user && (
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: report.isAnonymous
                        ? alpha(theme.palette.warning.main, 0.15)
                        : alpha(theme.palette.primary.main, 0.1),
                      color: report.isAnonymous ? theme.palette.warning.main : theme.palette.primary.main,
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      fontWeight: 700,
                    }}
                  >
                    {report.isAnonymous
                      ? <VisibilityOff fontSize="small" />
                      : (report.user.name?.charAt(0).toUpperCase() || '?')}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {report.isAnonymous ? 'Pelapor (Anonim)' : 'Pelapor'}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {report.isAnonymous ? 'Identitas disembunyikan' : (report.user.name || '-')}
                    </Typography>
                    {!report.isAnonymous && report.user.nim && (
                      <Typography variant="caption" color="text.secondary">{report.user.nim}</Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            )}
            <Grid item xs={6} sm={3} md={2}>
              <InfoCell icon={<CategoryIcon />} label="Kategori" value={report?.category?.name} color={theme.palette.primary.main} />
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <InfoCell icon={<Today />} label="Dibuat" value={fmt(report?.createdAt)} color={theme.palette.text.secondary} />
            </Grid>
            {report?.user && !report.isAnonymous && (
              <Grid item xs={12} sm={6} md={2}>
                <InfoCell icon={<Email />} label="Email" value={report.user.email} color={theme.palette.text.secondary} />
              </Grid>
            )}
            <Grid item xs={6} sm={3} md={2}>
              {report?.closedAt
                ? <InfoCell icon={<CheckCircle />} label="Ditutup" value={fmt(report.closedAt)} color={theme.palette.success.main} />
                : report?.updatedAt !== report?.createdAt
                  ? <InfoCell icon={<AccessTime />} label="Diupdate" value={fmt(report?.updatedAt)} color={theme.palette.warning.main} />
                  : <InfoCell icon={<AccessTime />} label="Status" value={st.label} color={st.color} />
              }
            </Grid>
          </Grid>
        </Paper>

        {/* ═══ Description + Attachments ═══ */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={hasAttachments ? 7 : 12}>
            <Paper sx={{ ...cardSx, p: { xs: 2, md: 2.5 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Deskripsi Laporan</Typography>
              <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200', flex: 1, minHeight: 100, maxHeight: 450, overflowY: 'auto' }}>
                <RichTextDisplay content={report?.description} variant="body1" showFullButton={true} />
              </Box>
            </Paper>
          </Grid>

          {hasAttachments && (
            <Grid item xs={12} md={5}>
              <Paper sx={{ ...cardSx, p: { xs: 2, md: 2.5 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <AttachFile sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                  <Typography variant="subtitle1" fontWeight={700}>Lampiran</Typography>
                  <Chip label={`${report.attachments.length}`} size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, fontWeight: 700, height: 22, fontSize: '0.75rem' }} />
                </Stack>
                <Stack spacing={1} sx={{ flex: 1, maxHeight: 400, overflowY: 'auto' }}>
                  {report.attachments.map((att) => (
                    <Card key={att.id} variant="outlined" sx={{ borderRadius: 2, borderColor: 'grey.200', '&:hover': { borderColor: 'primary.main', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 1, gap: 1.5 }}>
                        <Typography sx={{ fontSize: '1.3rem', flexShrink: 0 }}>{fileIcon(att.fileType)}</Typography>
                        <Tooltip title={att.fileName}><Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>{att.fileName}</Typography></Tooltip>
                        <Stack direction="row" spacing={0.5} flexShrink={0}>
                          <Tooltip title="Lihat"><IconButton size="small" onClick={() => handleAttachmentPreview(att)} sx={{ color: 'primary.main' }}><Visibility fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Unduh"><IconButton size="small" component="a" href={`${BACKEND_UPLOAD_URL}${att.filePath}`} download={att.fileName} sx={{ color: 'success.main' }}><Download fontSize="small" /></IconButton></Tooltip>
                        </Stack>
                      </Box>
                    </Card>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* ═══ Dialogs ═══ */}
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
          <DialogTitle><Stack direction="row" alignItems="center" spacing={2}><Avatar sx={{ bgcolor: 'error.main', borderRadius: 2 }}><Delete /></Avatar><Typography variant="h6" fontWeight={700}>Hapus Laporan</Typography></Stack></DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>Apakah Anda yakin ingin menghapus laporan ini?</Alert>
            <Typography color="text.secondary" variant="body2">Aksi ini akan memindahkan laporan ke arsip (soft delete) dan dapat dipulihkan nanti.</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteDialog(false)} variant="outlined" sx={{ borderRadius: 2 }}>Batal</Button>
            <Button onClick={handleDelete} color="error" variant="contained" sx={{ borderRadius: 2 }}>Ya, Hapus</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={restoreDialog} onClose={() => setRestoreDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
          <DialogTitle><Stack direction="row" alignItems="center" spacing={2}><Avatar sx={{ bgcolor: 'success.main', borderRadius: 2 }}><Restore /></Avatar><Typography variant="h6" fontWeight={700}>Pulihkan Laporan</Typography></Stack></DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>Apakah Anda yakin ingin memulihkan laporan ini?</Alert>
            <Typography color="text.secondary" variant="body2">Laporan akan dikembalikan ke status aktif.</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRestoreDialog(false)} variant="outlined" sx={{ borderRadius: 2 }}>Batal</Button>
            <Button onClick={handleRestore} color="success" variant="contained" sx={{ borderRadius: 2 }}>Ya, Pulihkan</Button>
          </DialogActions>
        </Dialog>

        {/* PDF Preview */}
        {pdfPreviewOpen && (
          <Dialog fullScreen open={pdfPreviewOpen} onClose={() => { setPdfPreviewOpen(false); setPdfPreviewAttachment(null); setNumPages(null); }} PaperProps={{ sx: { bgcolor: 'rgba(0,0,0,0.9)' } }}>
            <AppBar position="static" color="transparent" elevation={0}>
              <Toolbar>
                <IconButton edge="start" color="inherit" onClick={() => { setPdfPreviewOpen(false); setPdfPreviewAttachment(null); setNumPages(null); }}><CloseIcon sx={{ color: '#fff' }} /></IconButton>
                <Typography variant="h6" sx={{ flex: 1, color: '#fff', fontWeight: 600 }}>{pdfPreviewAttachment?.fileName}</Typography>
                <Button variant="contained" startIcon={<Download />} component="a" href={`${BACKEND_UPLOAD_URL}${pdfPreviewAttachment?.filePath}`} download={pdfPreviewAttachment?.fileName} sx={{ borderRadius: 2 }}>Unduh</Button>
              </Toolbar>
            </AppBar>
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', justifyContent: 'center' }}>
              <Document file={`${BACKEND_UPLOAD_URL}${pdfPreviewAttachment?.filePath}`} onLoadSuccess={({ numPages }) => setNumPages(numPages)} loading={<CircularProgress />}>
                {Array.from(new Array(numPages), (_x, i) => (<Page key={`page_${i + 1}`} pageNumber={i + 1} width={600} />))}
              </Document>
            </Box>
          </Dialog>
        )}

        {/* Doc Preview */}
        {previewAttachment && (
          <DocViewerPlus
            previewFile={{ fileUrl: `${BACKEND_UPLOAD_URL}${previewAttachment.filePath}`, fileName: previewAttachment.fileName }}
            visibleViewerPlus={previewOpen}
            onVisibleChange={() => { setPreviewOpen(false); setPreviewAttachment(null); }}
          />
        )}

      </Container>
  );
};

export default AdminReportDetailPage;
