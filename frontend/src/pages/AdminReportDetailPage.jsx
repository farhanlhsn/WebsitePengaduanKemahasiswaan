import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Grid, Avatar,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Stack, Fade, TextField,
  useTheme, IconButton, AppBar, Toolbar, Menu, MenuItem, ListItemIcon,
  Breadcrumbs, Link
} from '@mui/material';
import {
  Assignment, AccessTime, Category as CategoryIcon,
  Delete, Restore, Download, VisibilityOff, AttachFile,
  Today, CheckCircle, HourglassEmpty,
  Cancel, Error as ErrorIcon, Pending, Chat, Close as CloseIcon, Edit,
  Home, NavigateNext
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import useReportStore from '../stores/reportStore';
import useChatStore from '../stores/chatStore';
import { DocViewerPlus } from 'react-doc-viewer-plus';
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
import RichTextDisplay from '../components/ui/RichTextDisplay';
import LoadingSpinner from '../components/ui/LoadingSpinner';

import ReportStatusTimeline from '../components/dashboard/ReportStatusTimeline';
import ReportAttachmentCard from '../components/report/ReportAttachmentCard';
import ReportReporterInfo from '../components/report/ReportReporterInfo';

const THEME_COLORS = {
  primary: "#43A047",
  pending: "#FFA726",
  resolved: "#43A047",
  rejected: "#F44336",
  canceled: "#BDBDBD",
  background: "#F8F9FA",
  paper: "#FFFFFF",
  textSecondary: "#757575",
};

const STATUS_CONFIG = {
  PENDING: { label: 'Menunggu Verifikasi Admin', color: THEME_COLORS.pending, icon: <Pending /> },
  IN_REVIEW: { label: 'Ditinjau', color: THEME_COLORS.pending, icon: <HourglassEmpty /> },
  IN_PROGRESS: { label: 'Diproses', color: THEME_COLORS.pending, icon: <HourglassEmpty /> },
  RESOLVED: { label: 'Selesai', color: THEME_COLORS.resolved, icon: <CheckCircle /> },
  REJECTED: { label: 'Ditolak', color: THEME_COLORS.rejected, icon: <ErrorIcon /> },
  CANCELED: { label: 'Dibatalkan', color: THEME_COLORS.canceled, icon: <Cancel /> },
};

const cardStyle = {
  bgcolor: THEME_COLORS.paper,
  borderRadius: 4,
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  border: "none",
  display: "flex",
  flexDirection: "column",
};

const InfoItem = ({ icon, label, value, color }) => (
  <Box>
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
      <Avatar
        sx={{ bgcolor: alpha(color, 0.1), color: color, width: 32, height: 32 }}
      >
        {React.cloneElement(icon, { sx: { fontSize: "1rem" } })}
      </Avatar>
      <Typography variant="body1" fontWeight={600} color="text.secondary">
        {label}
      </Typography>
    </Stack>
    <Typography variant="body1" fontWeight={500} sx={{ pl: "48px" }}>
      {value || "N/A"}
    </Typography>
  </Box>
);

const BACKEND_UPLOAD_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/v1\/api\/?$/, '')
  : 'http://localhost:6060';

const AdminReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
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

  // Fix M10: alasan REJECTED/CANCELED via Dialog (bukan window.prompt yang
  // tidak ramah mobile & tidak konsisten dengan desain).
  const [reasonDialog, setReasonDialog] = useState({ open: false, status: null });
  const [reasonText, setReasonText] = useState('');
  const [reasonLoading, setReasonLoading] = useState(false);

  useEffect(() => {
    if (id) { getReportById(id, true).then(setReport); }
  }, [id, getReportById]);

  const handleDelete = async () => { await deleteReport(id); setDeleteDialog(false); navigate('/admin/reports'); };
  const handleRestore = async () => { await restoreReport(id); setRestoreDialog(false); setReport(await getReportById(id, true)); };
  const handleOpenChat = async () => { if (report) { await selectReport(report); navigate('/admin/chat'); } };
  const handleStatusChange = async (s) => {
    setStatusMenuAnchor(null);
    // Fix M10: untuk REJECTED/CANCELED buka dialog alasan alih-alih window.prompt.
    if (['REJECTED', 'CANCELED'].includes(s)) {
      setActionError(null);
      setReasonText('');
      setReasonDialog({ open: true, status: s });
      return;
    }
    try {
      setActionError(null);
      await updateReportStatus(id, s, null);
      setReport(prev => prev ? { ...prev, status: s } : prev);
    } catch (e) {
      setActionError(e?.message || 'Gagal mengubah status');
    }
  };

  const handleReasonConfirm = async () => {
    const { status } = reasonDialog;
    if (!reasonText.trim()) {
      setActionError('Alasan wajib diisi untuk status ditolak atau dibatalkan.');
      return;
    }
    setReasonLoading(true);
    try {
      setActionError(null);
      await updateReportStatus(id, status, reasonText.trim());
      setReport(prev => prev ? { ...prev, status } : prev);
      setReasonDialog({ open: false, status: null });
      setReasonText('');
    } catch (e) {
      setActionError(e?.message || 'Gagal mengubah status');
    } finally {
      setReasonLoading(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  const handleAttachmentPreview = (att) => {
    if (att.fileType.includes('msword') || att.fileType.includes('officedocument.wordprocessingml.document')) {
      const a = document.createElement('a'); a.href = `${BACKEND_UPLOAD_URL}${att.filePath}`; a.download = att.fileName; document.body.appendChild(a); a.click(); a.remove(); return;
    }
    if (att.fileType.includes('pdf')) { setPdfPreviewAttachment(att); setPdfPreviewOpen(true); return; }
    setPreviewAttachment(att); setPreviewOpen(true);
  };

  if (loading && !report) return <LoadingSpinner fullScreen message="Memuat detail laporan..." />;
  if (error && !report) return (
    <Box><Alert severity="error" sx={{ borderRadius: 3, p: 3 }}>{error || 'Laporan tidak ditemukan.'}</Alert></Box>
  );

  const st = STATUS_CONFIG[report?.status] || STATUS_CONFIG.PENDING;

  return (
    <Fade in timeout={300}>
      <Box>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => navigate('/admin')}>
            <Home sx={{ fontSize: 16 }} /> Dasbor
          </Link>
          <Link underline="hover" color="inherit" sx={{ cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => navigate('/admin/reports')}>Semua Laporan</Link>
          <Typography color="text.primary" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>#{report?.registrationNumber}</Typography>
        </Breadcrumbs>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700}>
            Detail Laporan
          </Typography>
          <Typography color="text.secondary">
            Informasi lengkap tentang laporan #{report?.registrationNumber}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(4) }}>
          {report?.isAnonymous && (
            <Alert
              severity="info"
              icon={<VisibilityOff />}
              sx={{
                borderRadius: 3,
                bgcolor: alpha(theme.palette.warning.main, 0.08),
                color: 'text.primary',
                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                '& .MuiAlert-icon': { color: theme.palette.warning.main },
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                Laporan ini dikirim secara anonim
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                Sistem menyembunyikan identitas pelapor (nama, NIM, email) pada tampilan awal, 
                namun Anda dapat melihatnya di bawah untuk keperluan administrasi.
              </Typography>
            </Alert>
          )}

          <Box sx={{ width: "100%" }}>
            <Stack spacing={4}>
              <Paper sx={{ ...cardStyle, width: "100%", p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                  Status Laporan
                </Typography>
                <ReportStatusTimeline status={report?.status} />
              </Paper>

              <Paper sx={{ ...cardStyle, width: "100%" }}>
                <Box sx={{ p: { xs: 2, md: 3 }, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Grid container spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
                    <Grid size={{ xs: 12, md: 8 }} sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
                        <Avatar sx={{ bgcolor: alpha(THEME_COLORS.primary, 0.1), color: THEME_COLORS.primary, width: 56, height: 56, flexShrink: 0 }}>
                          <Assignment sx={{ fontSize: 28 }} />
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="h5" fontWeight={700} sx={{ wordBreak: "break-word" }}>
                            {report?.title}
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            No. Laporan: {report?.registrationNumber}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
                
                <Box sx={{ p: { xs: 2, md: 3 }, minWidth: 0, flex: 1 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                    Deskripsi Laporan
                  </Typography>
                  <Box sx={{ p: 3, mb: 4, bgcolor: THEME_COLORS.background, borderRadius: 2, minWidth: 0, minHeight: "150px" }}>
                    <RichTextDisplay content={report?.description} variant="body1" showFullButton={true} />
                  </Box>
                  
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <AttachFile sx={{ color: THEME_COLORS.primary }} />
                    <Typography variant="h6" fontWeight={600}>
                      Lampiran
                    </Typography>
                    <Chip label={`${report?.attachments?.length || 0} file`} size="small" sx={{ bgcolor: alpha(THEME_COLORS.primary, 0.1), color: THEME_COLORS.primary }} />
                  </Stack>
                  {report?.attachments && report.attachments.length > 0 && (
                    <Box>
                      <Grid container spacing={2} sx={{ minWidth: 0 }}>
                        {report.attachments.map((attachment) => (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={attachment.id} sx={{ minWidth: 0 }}>
                            <ReportAttachmentCard attachment={attachment} onPreview={handleAttachmentPreview} downloadUrl={`${BACKEND_UPLOAD_URL}${attachment.filePath}`} />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Stack>
          </Box>

          <Box sx={{ width: "100%" }}>
            <Stack spacing={4}>
              <ReportReporterInfo user={report?.user} />
              
              <Paper sx={{ ...cardStyle, p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                  Informasi & Aksi Laporan
                </Typography>
                <Stack spacing={2.5} sx={{ mb: 3 }}>
                  <InfoItem icon={<CategoryIcon />} label="Kategori" value={report?.category?.name} color={THEME_COLORS.primary} />
                  <InfoItem icon={<Today />} label="Tanggal Dibuat" value={fmt(report?.createdAt)} color={THEME_COLORS.textSecondary} />
                  {report?.updatedAt !== report?.createdAt && (
                    <InfoItem icon={<AccessTime />} label="Terakhir Diperbarui" value={fmt(report?.updatedAt)} color={THEME_COLORS.pending} />
                  )}
                  {report?.closedAt && (
                    <InfoItem icon={<CheckCircle />} label="Tanggal Ditutup" value={fmt(report?.closedAt)} color={THEME_COLORS.resolved} />
                  )}
                  <InfoItem icon={st.icon} label="Status Saat Ini" value={st.label} color={st.color} />
                </Stack>
                <Divider sx={{ my: 1 }} />
                {actionError && <Alert severity="error" sx={{ my: 1, borderRadius: 2 }}>{actionError}</Alert>}
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 1, mb: 2 }}>
                  Aksi
                </Typography>
                <Stack spacing={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Chat />}
                    onClick={handleOpenChat}
                    sx={{ py: 1.5, borderRadius: 2, fontWeight: 600, bgcolor: THEME_COLORS.primary, "&:hover": { bgcolor: "#388E3C" } }}
                  >
                    Buka Chat dengan Pelapor
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={(e) => setStatusMenuAnchor(e.currentTarget)}
                    disabled={!!report?.deletedAt}
                    aria-label="Status"
                    sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}
                  >
                    Ubah Status Laporan
                  </Button>
                  <Menu anchorEl={statusMenuAnchor} open={Boolean(statusMenuAnchor)} onClose={() => setStatusMenuAnchor(null)}
                    PaperProps={{ elevation: 0, sx: { filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))', mt: 1.5, width: 250, borderRadius: 2 } }}
                    transformOrigin={{ horizontal: 'center', vertical: 'top' }} anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}>
                    {Object.entries(STATUS_CONFIG).map(([k, c]) => (
                      <MenuItem key={k} onClick={() => handleStatusChange(k)} selected={report?.status === k} disabled={report?.status === k} sx={{ py: 1.2, mx: 0.5, borderRadius: 1 }}>
                        <ListItemIcon sx={{ color: c.color }}>{c.icon}</ListItemIcon>
                        <Typography variant="body2" fontWeight={600}>{c.label}</Typography>
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
          </Box>
        </Box>

        {/* Dialog Hapus */}
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
          <DialogTitle><Stack direction="row" alignItems="center" spacing={2}><Avatar sx={{ bgcolor: 'error.main', borderRadius: 2 }}><Delete /></Avatar><Typography variant="h6" fontWeight={700}>Hapus Laporan</Typography></Stack></DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>Apakah Anda yakin ingin menghapus laporan ini?</Alert>
            <Typography color="text.secondary" variant="body2">Aksi ini akan memindahkan laporan ke arsip dan dapat dipulihkan nanti.</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteDialog(false)} variant="outlined" sx={{ borderRadius: 2 }}>Batal</Button>
            <Button onClick={handleDelete} color="error" variant="contained" sx={{ borderRadius: 2 }}>Ya, Hapus</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Pulihkan */}
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

        {/* Dialog Alasan (REJECTED/CANCELED) — Fix M10 */}
        <Dialog
          open={reasonDialog.open}
          onClose={() => { if (!reasonLoading) setReasonDialog({ open: false, status: null }); }}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight={700}>
              {reasonDialog.status === 'REJECTED' ? 'Tolak Laporan' : 'Batalkan Laporan'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
              Alasan akan dicatat di audit log dan diberitahukan ke pelapor.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={3}
              label="Alasan"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              error={!reasonText.trim()}
              helperText={!reasonText.trim() ? 'Alasan wajib diisi' : ''}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setReasonDialog({ open: false, status: null })} variant="outlined" sx={{ borderRadius: 2 }} disabled={reasonLoading}>Batal</Button>
            <Button
              onClick={handleReasonConfirm}
              color={reasonDialog.status === 'REJECTED' ? 'error' : 'warning'}
              variant="contained"
              sx={{ borderRadius: 2 }}
              disabled={reasonLoading}
              startIcon={reasonLoading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {reasonLoading ? 'Memproses…' : 'Konfirmasi'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Pratinjau PDF */}
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

        {/* Pratinjau Dokumen */}
        {previewAttachment && (
          <DocViewerPlus
            previewFile={{ fileUrl: `${BACKEND_UPLOAD_URL}${previewAttachment.filePath}`, fileName: previewAttachment.fileName }}
            visibleViewerPlus={previewOpen}
            onVisibleChange={() => { setPreviewOpen(false); setPreviewAttachment(null); }}
          />
        )}
      </Box>
    </Fade>
  );
};

export default AdminReportDetailPage;
