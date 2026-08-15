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
import useAuthStore from '../../stores/authStore';
import { listAdmins } from '../../services/adminGovernanceApi';
import { getAllUsers } from '../../services/api';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { STATUS_CONFIG } from '../../utils/statusConfig';
import RichTextDisplay from '../ui/RichTextDisplay';
import StatusBadge from '../ui/StatusBadge';

// Label opsi status diambil dari konfigurasi terpusat.
const STATUS_OPTIONS = [
  'PENDING',
  'IN_REVIEW',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED',
  'CANCELED',
].map((value) => ({ value, label: STATUS_CONFIG[value].label }));

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Rendah' },
  { value: 'MEDIUM', label: 'Sedang' },
  { value: 'HIGH', label: 'Tinggi' },
  { value: 'URGENT', label: 'Mendesak' },
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
  const { getReportById, updateReportStatus, updateReportPriority, assignReport } = useReportStore();
  const { selectReport } = useChatStore();
  const { user } = useAuthStore();
  const [report, setReport] = React.useState(initialReport || null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [savingPriority, setSavingPriority] = React.useState(false);
  const [savingAssign, setSavingAssign] = React.useState(false);
  const [status, setStatus] = React.useState(initialReport?.status || '');
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState(null); // { severity, message }
  const [admins, setAdmins] = React.useState([]);
  const [adminsLoading, setAdminsLoading] = React.useState(false);
  const [adminsError, setAdminsError] = React.useState('');

  // Snapshot initialReport via ref: efek buka/fetch hanya boleh dipicu oleh
  // perubahan open/reportId, bukan oleh identity initialReport yang berubah
  // tiap kali store men-merge pembaruan (bisa menghapus notice sukses).
  const initialReportRef = React.useRef(initialReport);
  React.useEffect(() => {
    initialReportRef.current = initialReport;
  }, [initialReport]);

  React.useEffect(() => {
    if (!open || !reportId) return;
    let active = true;
    const seeded = initialReportRef.current;
    setReport(seeded || null);
    setStatus(seeded?.status || '');
    setReason('');
    setError('');
    setNotice(null);
    setLoading(true);
    getReportById(reportId, true)
      .then((data) => {
        if (!active) return;
        // Merge di atas state sebelumnya agar field yang tidak ikut pada
        // respons detail (mis. assignedTo hasil merge aksi assign) tetap ada.
        setReport((prev) => ({ ...(prev || {}), ...data }));
        setStatus(data?.status || '');
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.message || err?.message || 'Gagal memuat detail laporan.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [open, reportId, getReportById]);

  // Muat daftar admin untuk kontrol penugasan. `listAdmins` hanya tersedia
  // untuk SUPERADMIN; untuk ADMIN biasa fallback ke daftar pengguna lalu
  // saring sisi klien. Jika keduanya gagal, kontrol dinonaktifkan + hint.
  React.useEffect(() => {
    if (!open) return;
    let active = true;
    setAdmins([]);
    setAdminsError('');
    setAdminsLoading(true);
    (async () => {
      try {
        let list = null;
        if (user?.role === 'SUPERADMIN') {
          try {
            list = await listAdmins();
          } catch {
            list = null; // 403/ gagal — coba fallback di bawah
          }
        }
        if (!Array.isArray(list)) {
          const users = await getAllUsers();
          list = (users || []).filter(
            (u) => (u.role === 'ADMIN' || u.role === 'SUPERADMIN') && u.isVerified && !u.deletedAt
          );
        } else {
          list = list.filter((u) => u.isVerified);
        }
        if (!active) return;
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setAdmins(list);
      } catch {
        if (active) setAdminsError('Daftar admin tidak dapat dimuat. Penugasan laporan tidak tersedia.');
      } finally {
        if (active) setAdminsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [open, user?.role]);

  const requiresReason = ['REJECTED', 'CANCELED'].includes(status);

  const handleSaveStatus = async () => {
    if (!report || status === report.status) return;
    if (requiresReason && !reason.trim()) {
      setError('Alasan wajib diisi untuk status ditolak atau dibatalkan.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice(null);
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

  const handlePriorityChange = async (event) => {
    const nextPriority = event.target.value;
    if (!report || nextPriority === report.priority) return;
    const previousPriority = report.priority;
    setSavingPriority(true);
    setNotice(null);
    // Optimistic update — dikembalikan bila gagal
    setReport((prev) => ({ ...prev, priority: nextPriority }));
    try {
      const updated = await updateReportPriority(report.id, nextPriority);
      const next = { ...report, priority: nextPriority, ...updated };
      setReport(next);
      setNotice({ severity: 'success', message: 'Prioritas laporan berhasil diperbarui.' });
      onUpdated?.(next);
    } catch (err) {
      setReport((prev) => ({ ...prev, priority: previousPriority }));
      setNotice({ severity: 'error', message: getApiErrorMessage(err, 'Gagal memperbarui prioritas laporan.') });
    } finally {
      setSavingPriority(false);
    }
  };

  const handleAssignChange = async (event) => {
    const rawValue = event.target.value;
    const nextAssignedToId = rawValue === '' ? null : Number(rawValue);
    if (!report || nextAssignedToId === (report.assignedToId ?? null)) return;
    setSavingAssign(true);
    setNotice(null);
    try {
      const updated = await assignReport(report.id, nextAssignedToId);
      const next = { ...report, ...updated };
      setReport(next);
      const assigneeName = updated?.assignedTo?.name;
      setNotice({
        severity: 'success',
        message: nextAssignedToId
          ? `Laporan berhasil ditugaskan kepada ${assigneeName || 'admin'}.`
          : 'Penugasan laporan berhasil dihapus.',
      });
      onUpdated?.(next);
    } catch (err) {
      setNotice({ severity: 'error', message: getApiErrorMessage(err, 'Gagal memperbarui penugasan laporan.') });
    } finally {
      setSavingAssign(false);
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
            {notice && <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert>}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <StatusBadge status={report?.deletedAt ? 'DELETED' : report?.status} />
                {report?.priority && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Prioritas: ${PRIORITY_OPTIONS.find((option) => option.value === report.priority)?.label || report.priority}`}
                    color={
                      report.priority === 'URGENT' ? 'error'
                        : report.priority === 'HIGH' ? 'warning'
                        : report.priority === 'MEDIUM' ? 'info'
                        : 'default'
                    }
                  />
                )}
              </Box>
              {report?.isAnonymous && (
                <Chip icon={<VisibilityOff />} label="Laporan anonim" color="warning" variant="outlined" size="small" />
              )}
            </Box>

            {report?.status === 'REJECTED' &&
              (report?.rejectedReason || '').trim() !== '' && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" component="span" fontWeight={700}>
                    Alasan ditolak:{' '}
                  </Typography>
                  <Typography variant="body2" component="span" sx={{ wordBreak: 'break-word' }}>
                    {report.rejectedReason}
                  </Typography>
                </Alert>
              )}
            {report?.status === 'CANCELED' &&
              (report?.canceledReason || '').trim() !== '' && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" component="span" fontWeight={700}>
                    Alasan dibatalkan:{' '}
                  </Typography>
                  <Typography variant="body2" component="span" sx={{ wordBreak: 'break-word' }}>
                    {report.canceledReason}
                  </Typography>
                </Alert>
              )}

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
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.25 }}>Prioritas &amp; Penugasan</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 190 } }}>
                    <InputLabel id="admin-report-priority-label">Prioritas</InputLabel>
                    <Select
                      labelId="admin-report-priority-label"
                      value={report?.priority || ''}
                      label="Prioritas"
                      onChange={handlePriorityChange}
                      disabled={savingPriority || !report?.priority}
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 240 } }} error={Boolean(adminsError)}>
                    <InputLabel id="admin-report-assign-label">Ditugaskan kepada</InputLabel>
                    <Select
                      labelId="admin-report-assign-label"
                      value={report?.assignedToId ?? ''}
                      label="Ditugaskan kepada"
                      onChange={handleAssignChange}
                      disabled={savingAssign || adminsLoading || Boolean(adminsError)}
                      renderValue={(value) => {
                        if (value === '' || value === null || value === undefined) return 'Belum ditugaskan';
                        const admin = admins.find((item) => item.id === value);
                        return admin?.name || report?.assignedTo?.name || String(value);
                      }}
                    >
                      <MenuItem value="">Belum ditugaskan</MenuItem>
                      {admins.map((admin) => (
                        <MenuItem key={admin.id} value={admin.id}>
                          {admin.name}
                          {admin.id === user?.id ? ' (Anda)' : ''}
                          {admin.role === 'SUPERADMIN' ? ' — Super Admin' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                    {adminsLoading && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                        Memuat daftar admin...
                      </Typography>
                    )}
                    {adminsError && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                        {adminsError}
                      </Typography>
                    )}
                  </FormControl>
                </Stack>
              </Box>
            )}

            {!report?.deletedAt && (
              <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.25 }}>Perbarui Status</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'flex-start' }}>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 190 } }}>
                    <InputLabel id="admin-report-status-label">Status</InputLabel>
                    <Select
                      labelId="admin-report-status-label"
                      value={status}
                      label="Status"
                      onChange={(event) => setStatus(event.target.value)}
                    >
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
