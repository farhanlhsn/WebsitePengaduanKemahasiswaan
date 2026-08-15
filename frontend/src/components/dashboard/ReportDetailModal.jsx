import React from 'react';
import {
  Alert,
  Box,
  Button,
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
import { Assignment, AttachFile, Category, Chat, Close, Edit, Today } from '@mui/icons-material';
import useReportStore from '../../stores/reportStore';
import useCategoryStore from '../../stores/categoryStore';
import useAuthStore from '../../stores/authStore';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { richTextToPlainText } from '../../utils/sanitizeHtml';
import RichTextDisplay from '../ui/RichTextDisplay';
import RichTextEditor from '../ui/RichTextEditor';
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

/**
 * Dialog edit laporan untuk mahasiswa (pemilik laporan, hanya saat PENDING).
 * Mengikuti pola validasi CreateReportModal: judul & deskripsi wajib,
 * kategori wajib dipilih — dengan batas minimal sesuai aturan backend
 * (judul min 3 karakter, deskripsi min 10 karakter teks polos).
 */
const EditReportDialog = ({ report, onClose, onSaved }) => {
  const { editReport } = useReportStore();
  const { categories, getCategories } = useCategoryStore();
  // Dialog hanya di-mount saat terbuka (lihat parent), jadi state form aman
  // di-inisialisasi sekali dari laporan — tidak akan tertimpa saat dialog
  // sedang digunakan.
  const [form, setForm] = React.useState(() => ({
    title: report?.title || '',
    description: report?.description || '',
    categoryId: report?.categoryId ?? report?.category?.id ?? '',
  }));
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');

  // Pastikan daftar kategori tersedia untuk Select.
  React.useEffect(() => {
    if (!categories?.length) {
      getCategories().catch(() => {});
    }
  }, [categories?.length, getCategories]);

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) {
      newErrors.title = 'Judul laporan wajib diisi';
    } else if (form.title.trim().length < 3) {
      newErrors.title = 'Judul minimal 3 karakter';
    }
    const plainDescription = richTextToPlainText(form.description).trim();
    if (!plainDescription) {
      newErrors.description = 'Deskripsi laporan wajib diisi';
    } else if (plainDescription.length < 10) {
      newErrors.description = 'Deskripsi minimal 10 karakter';
    }
    if (!form.categoryId) {
      newErrors.categoryId = 'Kategori wajib dipilih';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasChanges = Boolean(
    report
    && (form.title !== report.title
      || form.description !== report.description
      || String(form.categoryId) !== String(report.categoryId ?? report.category?.id ?? ''))
  );

  const handleSubmit = async () => {
    if (!report || !validate()) return;
    setSaving(true);
    setSubmitError('');
    try {
      const updated = await editReport(report.id, {
        title: form.title.trim(),
        description: form.description,
        categoryId: Number(form.categoryId),
      });
      const next = { ...report, ...updated };
      // Respons hanya membawa categoryId — perbarui objek kategori lokal agar
      // nama kategori yang tampil langsung benar bila kategori berubah.
      if (updated.categoryId != null) {
        const category = categories?.find((c) => String(c.id) === String(updated.categoryId));
        if (category) {
          next.category = { ...(report.category || {}), id: category.id, name: category.name };
        }
      }
      onSaved?.(next);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Gagal menyimpan perubahan laporan.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" scroll="paper" PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800 }}>
        <Edit color="primary" />
        Edit Laporan
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        {saving && <CircularProgress size={20} sx={{ mb: 1.5 }} />}
        {submitError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError('')}>{submitError}</Alert>}
        <Alert severity="info" sx={{ mb: 2 }}>
          Laporan hanya dapat diedit selama status masih <strong>PENDING</strong>.
        </Alert>
        <Stack spacing={2.25}>
          <TextField
            fullWidth
            label="Judul Laporan"
            placeholder="Masukkan judul yang jelas dan singkat"
            value={form.title}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, title: event.target.value }));
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            error={Boolean(errors.title)}
            helperText={errors.title}
          />
          <FormControl fullWidth error={Boolean(errors.categoryId)}>
            <InputLabel id="edit-report-category-label">Kategori Laporan</InputLabel>
            <Select
              labelId="edit-report-category-label"
              value={form.categoryId}
              label="Kategori Laporan"
              onChange={(event) => {
                setForm((prev) => ({ ...prev, categoryId: event.target.value }));
                if (errors.categoryId) setErrors((prev) => ({ ...prev, categoryId: '' }));
              }}
            >
              {(categories || []).map((category) => (
                <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
              ))}
            </Select>
            {errors.categoryId && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.categoryId}
              </Typography>
            )}
          </FormControl>
          <RichTextEditor
            label="Deskripsi Laporan"
            placeholder="Jelaskan masalah secara detail, kapan terjadi, dan dampaknya..."
            value={form.description}
            onChange={(content) => {
              setForm((prev) => ({ ...prev, description: content }));
              if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
            }}
            error={Boolean(errors.description)}
            helperText={errors.description || 'Gunakan toolbar di atas untuk format teks (bold, italic, list, dll)'}
            minHeight={200}
          />
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5 }}>
        <Button onClick={onClose} disabled={saving}>Batal</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !hasChanges}>
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ReportDetailModal = ({ open, report: initialReport, onClose, onOpenChat, onEdited }) => {
  const { getReportById } = useReportStore();
  const { user } = useAuthStore();
  const [report, setReport] = React.useState(initialReport || null);
  const [loading, setLoading] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [notice, setNotice] = React.useState(null); // { severity, message }

  React.useEffect(() => {
    if (!open || !initialReport?.id) return;
    let active = true;
    setReport(initialReport);
    setNotice(null);
    setEditOpen(false);
    setLoading(true);
    getReportById(initialReport.id)
      .then((data) => { if (active) setReport(data); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, initialReport, getReportById]);

  // Edit hanya untuk pemilik laporan dan selama status masih PENDING.
  const canEdit = Boolean(
    report
    && !report.deletedAt
    && report.status === 'PENDING'
    && user?.id != null
    && Number(report.userId) === Number(user.id)
  );

  const handleEdited = (updatedReport) => {
    setReport(updatedReport);
    setEditOpen(false);
    setNotice({ severity: 'success', message: 'Laporan berhasil diperbarui.' });
    onEdited?.(updatedReport);
  };

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
            {notice && <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert>}
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
        {canEdit && (
          <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditOpen(true)}>
            Edit Laporan
          </Button>
        )}
        <Button variant="contained" startIcon={<Chat />} onClick={() => onOpenChat?.(report)} disabled={!report}>
          Buka Percakapan
        </Button>
      </DialogActions>

      {editOpen && (
        <EditReportDialog
          report={report}
          onClose={() => setEditOpen(false)}
          onSaved={handleEdited}
        />
      )}
    </Dialog>
  );
};

export default ReportDetailModal;
