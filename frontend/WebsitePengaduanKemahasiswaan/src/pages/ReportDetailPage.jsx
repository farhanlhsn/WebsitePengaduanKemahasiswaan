import React, { useState, useEffect } from 'react';
import {
  Box, Container, Paper, Typography, Button, Chip, Grid, Avatar,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Card, CardContent, CardActions, CardHeader,
  List, ListItem, ListItemAvatar, ListItemText, Tooltip, Stack, useTheme,
  IconButton
} from '@mui/material';
import {
  ArrowBack, Assignment, AccessTime, Person, Category,
  Delete, Restore, Download, Visibility, AttachFile,
  School, Email, Today, CheckCircle, HourglassEmpty,
  Cancel, Error, Pending, Chat, Menu as MenuIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import useReportStore from '../stores/reportStore';
import DashboardSidebar from '../components/dashboard/Sidebar';

// --- THEME COLORS (Based on Dashboard Screenshot) ---
const THEME_COLORS = {
  primary: '#43A047',      // Green for primary actions, active states
  pending: '#FFA726',      // Orange/Yellow for pending/in-progress
  resolved: '#43A047',     // Green for resolved
  rejected: '#F44336',     // Red for rejected
  canceled: '#BDBDBD',     // Lighter Grey for canceled
  background: '#F8F9FA',   // Very light grey page background
  paper: '#FFFFFF',        // White for cards
  textSecondary: '#757575' // Grey color for less important text/icons
};

// --- STATUS CONFIGURATION ---
const STATUS_CONFIG = {
  PENDING: { label: 'Menunggu Verifikasi Admin', color: THEME_COLORS.pending, icon: <Pending /> },
  IN_REVIEW: { label: 'Ditinjau', color: THEME_COLORS.pending, icon: <HourglassEmpty /> },
  IN_PROGRESS: { label: 'Diproses', color: THEME_COLORS.pending, icon: <HourglassEmpty /> },
  RESOLVED: { label: 'Selesai', color: THEME_COLORS.resolved, icon: <CheckCircle /> },
  REJECTED: { label: 'Ditolak', color: THEME_COLORS.rejected, icon: <Error /> },
  CANCELED: { label: 'Dibatalkan', color: THEME_COLORS.canceled, icon: <Cancel /> },
};

// --- Reusable Styles ---
const cardStyle = {
  bgcolor: THEME_COLORS.paper,
  borderRadius: 4,
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  border: 'none',
  display: 'flex',
  flexDirection: 'column',
};

// --- Reusable Helper Components ---
const InfoItem = ({ icon, label, value, color }) => (
  <Box>
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
      <Avatar sx={{ bgcolor: alpha(color, 0.1), color: color, width: 32, height: 32 }}>
        {React.cloneElement(icon, { sx: { fontSize: '1rem' } })}
      </Avatar>
      <Typography variant="body1" fontWeight={600} color="text.secondary">{label}</Typography>
    </Stack>
    <Typography variant="body1" fontWeight={500} sx={{ pl: '48px' }}>{value || 'N/A'}</Typography>
  </Box>
);

const ActionDialog = ({ open, onClose, onConfirm, title, icon, color, confirmText, children, buttonColor }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
    <DialogTitle sx={{ pb: 1 }}><Stack direction="row" alignItems="center" spacing={2}><Avatar sx={{ bgcolor: `${color}.main` }}>{icon}</Avatar><Typography variant="h5" fontWeight={700}>{title}</Typography></Stack></DialogTitle>
    <DialogContent sx={{ py: 2 }}>{children}</DialogContent>
    <DialogActions sx={{ p: 2, pt: 0 }}><Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Batal</Button><Button onClick={onConfirm} color={color} variant="contained" sx={{ borderRadius: 2, bgcolor: buttonColor }}>{confirmText}</Button></DialogActions>
  </Dialog>
);

const drawerWidth = 280;

const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { getReportById, deleteReport, restoreReport, loading, error } = useReportStore();
  const [report, setReport] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (id) {
        const reportData = await getReportById(id);
        setReport(reportData);
      }
    };
    fetchReport();
  }, [id, getReportById]);

  const handleDelete = async () => { await deleteReport(id); setDeleteDialog(false); navigate('/dashboard'); };
  const handleRestore = async () => { await restoreReport(id); setRestoreDialog(false); const updatedReport = await getReportById(id); setReport(updatedReport); };
  const handleDrawerToggle = () => { setMobileOpen(!mobileOpen); };
  const formatDate = (dateString) => { if (!dateString) return 'N/A'; return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
  const getFileTypeIcon = (fileType) => { if (fileType?.startsWith('image/')) return '🖼️'; if (fileType?.startsWith('video/')) return '🎥'; if (fileType?.includes('pdf')) return '📄'; return '📁'; };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: THEME_COLORS.background }}><CircularProgress sx={{ color: THEME_COLORS.primary }} /></Box>;
  if (error || !report) return <Box sx={{ minHeight: '100vh', bgcolor: THEME_COLORS.background, py: 5 }}><Container maxWidth="md"><Alert severity={error ? "error" : "info"} sx={{ borderRadius: 3, fontSize: '1.1rem', p: 3 }}>{error || 'Laporan tidak ditemukan atau gagal dimuat.'}</Alert></Container></Box>;

  const currentStatus = STATUS_CONFIG[report.status] || STATUS_CONFIG.PENDING;

  return (
    <Box sx={{ display: 'flex', bgcolor: THEME_COLORS.background }}>
      <DashboardSidebar open={mobileOpen} onClose={handleDrawerToggle} drawerWidth={drawerWidth} activeMenu="reports" onMenuChange={() => { }} />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: { sm: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 2 } }}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ display: { sm: 'none' }, mr: 2 }}><MenuIcon /></IconButton>
              <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} variant="text" sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '1rem', '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) } }}>Kembali ke Dashboard</Button>
            </Box>
            <Typography variant="h4" fontWeight={700}>Detail Laporan</Typography>
            <Typography color="text.secondary">Informasi lengkap tentang laporan #{report.registrationNumber}</Typography>
          </Box>

          {/* === KUNCI PERBAIKAN TOTAL: MENGGANTI GRID DENGAN FLEXBOX EKSPLISIT === */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: 'flex-start',
            gap: theme.spacing(4)
          }}>

            {/* --- KOLOM KIRI (KONTEN UTAMA) --- */}
            <Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
              <Stack spacing={4}>
                <Paper sx={{ ...cardStyle, width: '100%' }}>
                  <Box sx={{ p: { xs: 2, md: 3 }, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Grid container spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
                      <Grid item xs={12} md={8} sx={{ minWidth: 0 }}><Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}><Avatar sx={{ bgcolor: alpha(THEME_COLORS.primary, 0.1), color: THEME_COLORS.primary, width: 56, height: 56, flexShrink: 0 }}><Assignment sx={{ fontSize: 28 }} /></Avatar><Box sx={{ minWidth: 0, flex: 1 }}><Typography variant="h5" fontWeight={700} sx={{ wordBreak: 'break-word' }}>{report.title}</Typography><Typography variant="body1" color="text.secondary">#{report.registrationNumber}</Typography></Box></Stack></Grid>
                    </Grid>
                  </Box>
                  <Box sx={{ p: { xs: 2, md: 3 }, minWidth: 0, flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>Deskripsi Laporan</Typography>
                    <Box sx={{ p: 3, mb: 4, bgcolor: THEME_COLORS.background, borderRadius: 2, minWidth: 0, minHeight: '150px' }}><Typography variant="body1" sx={{ lineHeight: 1.8, wordBreak: 'break-word' }}>{report.description}</Typography></Box>
                    {report.attachments && report.attachments.length > 0 && (
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}><AttachFile sx={{ color: THEME_COLORS.primary }} /><Typography variant="h6" fontWeight={600}>Lampiran</Typography><Chip label={`${report.attachments.length} file`} size="small" sx={{ bgcolor: alpha(THEME_COLORS.primary, 0.1), color: THEME_COLORS.primary }} /></Stack>
                        <Grid container spacing={2} sx={{ minWidth: 0 }}>
                          {report.attachments.map((attachment) => (
                            <Grid item xs={12} sm={6} md={4} key={attachment.id} sx={{ minWidth: 0 }}><Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'grey.200', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}><CardContent sx={{ minWidth: 0, flex: 1 }}><Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1, minWidth: 0 }}><Typography sx={{ fontSize: '2rem', flexShrink: 0 }}>{getFileTypeIcon(attachment.fileType)}</Typography><Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}><Tooltip title={attachment.fileName || 'Unknown file'}><Typography variant="subtitle1" fontWeight={600} noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{attachment.fileName || 'Unknown file'}</Typography></Tooltip></Box></Stack></CardContent><CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}><Button size="small" startIcon={<Visibility />} href={`/api/attachments/${attachment.filePath}`} target="_blank" variant="text" sx={{ color: 'text.secondary' }}>Lihat</Button><Button size="small" startIcon={<Download />} href={`/api/attachments/${attachment.filePath}`} download={attachment.fileName} variant="contained" sx={{ ml: 'auto', bgcolor: THEME_COLORS.primary, '&:hover': { bgcolor: '#388E3C' } }}>Unduh</Button></CardActions></Card></Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </Box>
                </Paper>
                {report.messages && report.messages.length > 0 && (
                  <Paper sx={{ ...cardStyle, width: '100%' }}>
                    <CardHeader avatar={<Avatar sx={{ bgcolor: alpha(THEME_COLORS.primary, 0.1), color: THEME_COLORS.primary }}><Chat /></Avatar>} title={<Typography variant="h6" fontWeight={600}>Komunikasi & Pesan</Typography>} subheader={`${report.messages.length} pesan dalam percakapan`} sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />
                    <Box sx={{ p: { xs: 1, md: 2 }, minWidth: 0 }}>
                      <List sx={{ p: 0, minWidth: 0 }}>
                        {report.messages.map((message, index) => (
                          <React.Fragment key={message.id}>
                            <ListItem alignItems="flex-start" sx={{ py: 2, px: { xs: 1, md: 2 }, minWidth: 0 }}><ListItemAvatar sx={{ mr: 1.5 }}><Avatar sx={{ width: 48, height: 48, bgcolor: message.sender.role === 'ADMIN' ? 'secondary.light' : alpha(THEME_COLORS.primary, 0.2) }}>{message.sender.name.charAt(0).toUpperCase()}</Avatar></ListItemAvatar><ListItemText sx={{ minWidth: 0 }} primary={<Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0 }}><Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 0, flex: 1 }}>{message.sender.name}</Typography><Chip label={message.sender.role === 'ADMIN' ? 'Admin' : 'Mahasiswa'} size="small" sx={{ bgcolor: message.sender.role === 'ADMIN' ? 'secondary.main' : THEME_COLORS.primary, color: 'white', flexShrink: 0 }}/></Stack>} secondary={<><Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5, mb: 1.5 }}>{formatDate(message.createdAt)}</Typography><Box sx={{ p: 2, mt: 1, bgcolor: THEME_COLORS.background, borderRadius: 2, display: 'block', maxWidth: '100%', minWidth: 0 }}><Typography variant="body1" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</Typography></Box></>}/></ListItem>
                            {index < report.messages.length - 1 && <Divider variant="inset" component="li" />}
                          </React.Fragment>
                        ))}
                      </List>
                    </Box>
                  </Paper>
                )}
              </Stack>
            </Box>

            {/* --- KOLOM KANAN (SIDEBAR INFO) --- */}
            <Box sx={{
              width: { xs: '100%', lg: 380 },
              flexShrink: 0,
              position: { lg: 'sticky' },
              top: { lg: theme.spacing(3) },
            }}>
              <Stack spacing={4}>
                {report.user && (
                  <Paper sx={{ ...cardStyle, p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>Informasi Pelapor</Typography>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                      <Avatar sx={{ bgcolor: alpha(THEME_COLORS.primary, 0.1), color: THEME_COLORS.primary, width: 56, height: 56 }}>{report.user.name.charAt(0).toUpperCase()}</Avatar>
                      <Typography variant="h6" fontWeight={700}>{report.user.name}</Typography>
                    </Stack>
                    <Stack spacing={2.5}><InfoItem icon={<School />} label="NIM" value={report.user.nim} color={THEME_COLORS.textSecondary} /><InfoItem icon={<Email />} label="Email" value={report.user.email} color={THEME_COLORS.textSecondary} /></Stack>
                  </Paper>
                )}
                <Paper sx={{ ...cardStyle, p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>Informasi Laporan</Typography>
                  <Stack spacing={2.5} sx={{ mb: 3 }}>
                    <InfoItem icon={<Category />} label="Kategori" value={report.category?.name} color={THEME_COLORS.primary} />
                    <InfoItem icon={<Today />} label="Tanggal Dibuat" value={formatDate(report.createdAt)} color={THEME_COLORS.textSecondary} />
                    {report.updatedAt !== report.createdAt && <InfoItem icon={<AccessTime />} label="Terakhir Diupdate" value={formatDate(report.updatedAt)} color={THEME_COLORS.pending} />}
                    {report.closedAt && <InfoItem icon={<CheckCircle />} label="Tanggal Ditutup" value={formatDate(report.closedAt)} color={THEME_COLORS.resolved} />}
                    <InfoItem icon={<CheckCircle />} label="Status" value={currentStatus.label} color={currentStatus.color} />
                  </Stack>
                  <Divider sx={{ my: 1 }} /><Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>Aksi</Typography>
                  {report.deletedAt ? (<Button fullWidth variant="contained" startIcon={<Restore />} onClick={() => setRestoreDialog(true)} sx={{ py: 1.5, borderRadius: 2, fontWeight: 600, bgcolor: THEME_COLORS.primary, '&:hover': { bgcolor: '#388E3C' } }}>Pulihkan Laporan</Button>) : (<Button fullWidth variant="outlined" color="error" startIcon={<Delete />} onClick={() => setDeleteDialog(true)} sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}>Hapus Laporan</Button>)}
                </Paper>
              </Stack>
            </Box>
          </Box>

          <ActionDialog open={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleDelete} title="Hapus Laporan" icon={<Delete />} color="error" confirmText="Ya, Hapus"><Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>Apakah Anda yakin ingin menghapus laporan ini?</Alert><Typography color="text.secondary">Aksi ini akan memindahkan laporan ke arsip (soft delete) dan dapat dipulihkan nanti.</Typography></ActionDialog>
          <ActionDialog open={restoreDialog} onClose={() => setRestoreDialog(false)} onConfirm={handleRestore} title="Pulihkan Laporan" icon={<Restore />} color="success" confirmText="Ya, Pulihkan" buttonColor={THEME_COLORS.primary}><Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>Apakah Anda yakin ingin memulihkan laporan ini?</Alert><Typography color="text.secondary">Laporan akan dikembalikan ke status aktif dan terlihat di daftar utama.</Typography></ActionDialog>
        </Container>
      </Box>
    </Box>
  );
};

export default ReportDetailPage;