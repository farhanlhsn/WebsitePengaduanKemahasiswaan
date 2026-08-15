import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Assignment,
  AttachFile,
  Category,
  Chat,
  Close,
  Person,
  Today,
  VisibilityOff,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useReportStore from '../../stores/reportStore';
import useChatStore from '../../stores/chatStore';
import RichTextDisplay from '../ui/RichTextDisplay';
import StatusBadge from '../ui/StatusBadge';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'IN_REVIEW', label: 'Ditinjau' },
  { value: 'IN_PROGRESS', label: 'Diproses' },
  { value: 'RESOLVED', label: 'Selesai' },
  { value: 'REJECTED', label: 'Ditolak' },
  { value: 'CANCELED', label: 'Dibatalkan' },
];

const BACKEND_UPLOAD_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/v1\/api\/?$/, '')
  : 'http://localhost:6060';

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  : '-';

const InfoItem = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', gap: 1.25, minWidth: 0 }}>
    <Box sx={{ color: 'primary.main', mt: 0.1 }}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
      <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>{value || '-'}</Typography>
    </Box>
  </Box>
);

const AdminReportDetailModal = ({ open, reportId, initialReport, onClose, onUpdated }) => {
  const navigate = useNavigate();
  const { getReportById, updateReportStatus } = useReportStore();
  const { selectReport } = useChatStore();
  const [report, setReport] = React.useState(initialReport || null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState(initialReport?.status || '');
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!open || !reportId) return;
    let active = true;
    setReport(initialReport || null);
    setStatus(initialReport?.status || '');
    setReason('');
    setError('');
    setLoading(true);
    getReportById(reportId, true)
      .then((data) => {
        if (!active) return;
        setReport(data);
        setStatus(data?.status || '');
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.message || err?.message || 'Gagal memuat detail laporan.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [open, reportId, initialReport, getReportById]);

  const requiresReason = ['REJECTED', 'CANCELED'].includes(status);

  const handleSaveStatus = async () => {
    if (!report || status === report.status) return;
    if (requiresReason && !reason.trim()) {
      setError('Alasan wajib diisi untuk status ditolak atau dibatalkan.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await updateReportStatus(report.id, status, requiresReason ? reason.trim() : null);
      const next = { ...report, ...updated, status };
      setReport(next);
      setReason('');
      onUpdated?.(next);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Gagal memperbarui status laporan.');
    } finally {
      setSaving(false);
    }
  };

  const handleChat = async () => {
    if (!report) return;
    await selectReport(report);
    onClose?.();
    navigate('/admin/chat');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}>
            <Assignment color="primary" sx={{ mt: 0.25 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.25, wordBreak: 'break-word' }}>
                {report?.title || 'Detail Laporan'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {report?.registrationNumber || 'Memuat data...'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} aria-label="Tutup detail laporan" size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        {loading && !report ? (
          <Box sx={{ minHeight: 240, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <Stack spacing={2.25}>
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <StatusBadge status={report?.deletedAt ? 'DELETED' : report?.status} />
              {report?.isAnonymous && (
                <Chip icon={<VisibilityOff />} label="Laporan anonim" color="warning" variant="outlined" size="small" />
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoItem
                  icon={report?.isAnonymous ? <VisibilityOff fontSize="small" /> : <Person fontSize="small" />}
                  label="Pelapor"
                  value={report?.isAnonymous ? 'Identitas disembunyikan' : report?.user?.name}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoItem icon={<Category fontSize="small" />} label="Kategori" value={report?.category?.name || report?.category} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoItem icon={<Today fontSize="small" />} label="Dibuat" value={formatDate(report?.createdAt)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoItem icon={<Today fontSize="small" />} label="Terakhir diperbarui" value={formatDate(report?.updatedAt)} />
              </Grid>
            </Grid>

            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Deskripsi Laporan</Typography>
              <Box sx={{ p: 1.75, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'grey.50', maxHeight: 280, overflowY: 'auto' }}>
                <RichTextDisplay content={report?.description || '-'} variant="body2" showFullButton={false} />
              </Box>
            </Box>

            {!!report?.attachments?.length && (
              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                  Lampiran ({report.attachments.length})
                </Typography>
                <Stack spacing={0.75}>
                  {report.attachments.map((attachment) => (
                    <Box
                      key={attachment.id || attachment.filePath}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 0.9, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                    >
                      <AttachFile fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {attachment.fileName}
                      </Typography>
                      <Link href={`${BACKEND_UPLOAD_URL}${attachment.filePath}`} target="_blank" rel="noreferrer" underline="hover" variant="caption">
                        Buka
                      </Link>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {!report?.deletedAt && (
              <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.25 }}>Perbarui Status</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'flex-start' }}>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 190 } }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={status} label="Status" onChange={(event) => setStatus(event.target.value)}>
                      {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {requiresReason && (
                    <TextField
                      size="small"
                      label="Alasan"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Tuliskan alasan perubahan status"
                      fullWidth
                    />
                  )}
                  <Button
                    variant="contained"
                    onClick={handleSaveStatus}
                    disabled={saving || !status || status === report?.status || (requiresReason && !reason.trim())}
                    sx={{ minWidth: 130, whiteSpace: 'nowrap' }}
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Status'}
                  </Button>
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5 }}>
        <Button onClick={onClose}>Tutup</Button>
        <Button variant="outlined" startIcon={<Chat />} onClick={handleChat} disabled={!report || !!report.deletedAt}>
          Buka Percakapan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminReportDetailModal;
