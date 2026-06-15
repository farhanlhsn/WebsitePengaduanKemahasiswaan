import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { Assignment, AttachFile, Category, Chat, Close, Today } from '@mui/icons-material';
import useReportStore from '../../stores/reportStore';
import RichTextDisplay from '../ui/RichTextDisplay';
import StatusBadge from '../ui/StatusBadge';

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

const ReportDetailModal = ({ open, report: initialReport, onClose, onOpenChat }) => {
  const { getReportById } = useReportStore();
  const [report, setReport] = React.useState(initialReport || null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !initialReport?.id) return;
    let active = true;
    setReport(initialReport);
    setLoading(true);
    getReportById(initialReport.id)
      .then((data) => { if (active) setReport(data); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, initialReport, getReportById]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper" PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}>
      <DialogTitle sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}>
            <Assignment color="primary" sx={{ mt: 0.25 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.25, wordBreak: 'break-word' }}>
                {report?.title || 'Detail Laporan'}
              </Typography>
              <Typography variant="caption" color="text.secondary">{report?.registrationNumber || 'Memuat data...'}</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} aria-label="Tutup detail laporan" size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        {loading && !report ? (
          <Box sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <Stack spacing={2.25}>
            <StatusBadge status={report?.status} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: 'flex', gap: 1.25 }}>
                  <Category color="primary" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Kategori</Typography>
                    <Typography variant="body2" fontWeight={650}>{report?.category?.name || '-'}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: 'flex', gap: 1.25 }}>
                  <Today color="primary" fontSize="small" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Tanggal Laporan</Typography>
                    <Typography variant="body2" fontWeight={650}>{formatDate(report?.createdAt)}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Deskripsi Laporan</Typography>
              <Box sx={{ p: 1.75, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'grey.50', maxHeight: 320, overflowY: 'auto' }}>
                <RichTextDisplay content={report?.description || '-'} variant="body2" showFullButton={false} />
              </Box>
            </Box>
            {!!report?.attachments?.length && (
              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Lampiran ({report.attachments.length})</Typography>
                <Stack spacing={0.75}>
                  {report.attachments.map((attachment) => (
                    <Box key={attachment.id || attachment.filePath} sx={{ display: 'flex', gap: 1, alignItems: 'center', px: 1.25, py: 0.9, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                      <AttachFile fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.fileName}</Typography>
                      <Link href={`${BACKEND_UPLOAD_URL}${attachment.filePath}`} target="_blank" rel="noreferrer" underline="hover" variant="caption">Buka</Link>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5 }}>
        <Button onClick={onClose}>Tutup</Button>
        <Button variant="contained" startIcon={<Chat />} onClick={() => onOpenChat?.(report)} disabled={!report}>
          Buka Percakapan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportDetailModal;
