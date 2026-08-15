import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Stack,
  useTheme,
  IconButton,
  AppBar,
  Toolbar,
  LinearProgress,
} from "@mui/material";
import {
  ArrowBack,
  Assignment,
  AccessTime,
  Person,
  Category,
  Delete,
  Restore,
  Download,
  Visibility,
  VisibilityOff,
  AttachFile,
  School,
  Email,
  Today,
  Cancel,
  Chat,
  Menu as MenuIcon,
  Send,
  Description,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import useReportStore from "../stores/reportStore";
import useChatStore from "../stores/chatStore";
import { uploadAttachments } from "../services/api";
import { DocViewerPlus } from "react-doc-viewer-plus";
import { Document, Page, pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
import DashboardSidebar from "../components/dashboard/StudentSidebar";
import RichTextDisplay from "../components/ui/RichTextDisplay";
import ChatInterface from "../components/chat/ChatInterface";
import ReportStatusTimeline from "../components/dashboard/ReportStatusTimeline";
import ReportAttachmentCard from "../components/report/ReportAttachmentCard";
import ReportReporterInfo from "../components/report/ReportReporterInfo";
import ReportInfoSidebar from "../components/report/ReportInfoSidebar";
import { getStatusConfig } from "../utils/statusConfig";

const THEME_COLORS = {
  primary: "#43A047",
  background: "#F8F9FA",
  paper: "#FFFFFF",
  textSecondary: "#757575",
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

const ActionDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  icon,
  color,
  confirmText,
  children,
  buttonColor,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
  >
    <DialogTitle sx={{ pb: 1 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar sx={{ bgcolor: `${color}.main` }}>{icon}</Avatar>
        <Typography variant="h5" fontWeight={700}>
          {title}
        </Typography>
      </Stack>
    </DialogTitle>
    <DialogContent sx={{ py: 2 }}>{children}</DialogContent>
    <DialogActions sx={{ p: 2, pt: 0 }}>
      <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
        Batal
      </Button>
      <Button
        onClick={onConfirm}
        color={color}
        variant="contained"
        sx={{ borderRadius: 2, bgcolor: buttonColor }}
      >
        {confirmText}
      </Button>
    </DialogActions>
  </Dialog>
);

const drawerWidth = 280;

const BACKEND_UPLOAD_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/v1\/api\/?$/, "")
  : "http://localhost:6060";

const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { getReportById, deleteReport, restoreReport, loading, error } =
    useReportStore();
  const { selectReport } = useChatStore();
  const [report, setReport] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfPreviewAttachment, setPdfPreviewAttachment] = useState(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [attachmentFeedback, setAttachmentFeedback] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (id) {
        const reportData = await getReportById(id);
        setReport(reportData);
      }
    };
    fetchReport();
  }, [id, getReportById]);

  // Fix M13: tombol "Coba Lagi" di error state — muat ulang laporan.
  const handleRetry = () => {
    if (id) getReportById(id).then(setReport);
  };

  const handleDelete = async () => {
    await deleteReport(id);
    setDeleteDialog(false);
    navigate("/dashboard");
  };
  const handleRestore = async () => {
    await restoreReport(id);
    setRestoreDialog(false);
    const updatedReport = await getReportById(id);
    setReport(updatedReport);
  };
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleOpenChat = async () => {
    if (report) {
      await selectReport(report);
      navigate(`/dashboard`, { state: { activeMenu: 'chat' } });
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRetryAttachmentUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || !report?.id) return;

    setUploadingAttachments(true);
    setAttachmentFeedback(null);
    try {
      await uploadAttachments(report.id, files);
      const updatedReport = await getReportById(id);
      setReport(updatedReport);
      setAttachmentFeedback({ severity: 'success', message: 'Lampiran berhasil diunggah.' });
    } catch (uploadError) {
      console.error('Attachment upload failed:', uploadError);
      setAttachmentFeedback({
        severity: 'error',
        message: uploadError.response?.data?.message || uploadError.response?.data?.error || 'Lampiran gagal diunggah.',
      });
    } finally {
      setUploadingAttachments(false);
    }
  };

  const handleAttachmentPreview = (attachment) => {
    const isDoc =
      attachment.fileType.includes("msword") ||
      attachment.fileType.includes("officedocument.wordprocessingml.document");
    if (isDoc) {
      const url = `${BACKEND_UPLOAD_URL}${attachment.filePath}`;
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
      return;
    }
    const isPdf = attachment.fileType.includes("pdf");
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

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
          bgcolor: THEME_COLORS.background,
        }}
      >
        <CircularProgress sx={{ color: THEME_COLORS.primary }} />
      </Box>
    );
  if (error || !report)
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: THEME_COLORS.background, py: 5 }}>
        <Container maxWidth="md">
          <Alert
            severity={error ? "error" : "info"}
            sx={{ borderRadius: 3, fontSize: "1.1rem", p: 3 }}
          >
            {error || "Laporan tidak ditemukan atau gagal dimuat."}
          </Alert>
          {/* Fix M13: aksi pemulihan di error state (retry + kembali). */}
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            {error && (
              <Button variant="contained" onClick={handleRetry} sx={{ borderRadius: 2 }}>
                Coba Lagi
              </Button>
            )}
            <Button variant="outlined" onClick={() => navigate("/dashboard")} sx={{ borderRadius: 2 }}>
              Kembali ke Dasbor
            </Button>
          </Stack>
        </Container>
      </Box>
    );

  const currentStatus = getStatusConfig(report.status);

  return (
    <Box sx={{ display: "flex", bgcolor: THEME_COLORS.background }}>
      <DashboardSidebar
        open={mobileOpen}
        onClose={handleDrawerToggle}
        drawerWidth={drawerWidth}
        activeMenu="reports"
        onMenuChange={() => {}}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={handleSidebarToggle}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { sm: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : "100%" },
          minHeight: "100vh",
          transition: "width 0.3s ease",
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 2 } }}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ display: { sm: "none" }, mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate("/dashboard")}
                variant="text"
                sx={{
                  color: "text.secondary",
                  textTransform: "none",
                  fontSize: "1rem",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                Kembali ke Dashboard
              </Button>
            </Box>
            <Typography variant="h4" fontWeight={700}>
              Detail Laporan
            </Typography>
            <Typography color="text.secondary">
              Informasi lengkap tentang laporan #{report.registrationNumber}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: theme.spacing(4),
            }}
          >
            {report.isAnonymous && (
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
                  Identitas Anda (nama, NIM, email) disembunyikan dari admin.
                  Pesan chat Anda tampil sebagai &ldquo;Anonim&rdquo;.
                </Typography>
              </Alert>
            )}
            <Box sx={{ width: "100%" }}>
              <Stack spacing={4}>
                <Paper sx={{ ...cardStyle, width: "100%", p: { xs: 2, md: 3 } }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                    Status Laporan
                  </Typography>
                  <ReportStatusTimeline status={report.status} />
                  {report.status === "REJECTED" &&
                    report.rejectedReason &&
                    report.rejectedReason.trim() !== "" && (
                      <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                        <Typography variant="body2" component="span" fontWeight={700}>
                          Alasan ditolak:{" "}
                        </Typography>
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{ wordBreak: "break-word" }}
                        >
                          {report.rejectedReason}
                        </Typography>
                      </Alert>
                    )}
                  {report.status === "CANCELED" &&
                    report.canceledReason &&
                    report.canceledReason.trim() !== "" && (
                      <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                        <Typography variant="body2" component="span" fontWeight={700}>
                          Alasan dibatalkan:{" "}
                        </Typography>
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{ wordBreak: "break-word" }}
                        >
                          {report.canceledReason}
                        </Typography>
                      </Alert>
                    )}
                </Paper>

                <Paper sx={{ ...cardStyle, width: "100%" }}>
                  <Box
                    sx={{
                      p: { xs: 2, md: 3 },
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Grid
                      container
                      spacing={2}
                      alignItems="center"
                      sx={{ minWidth: 0 }}
                    >
                      <Grid size={{ xs: 12, md: 8 }} sx={{ minWidth: 0 }}>
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          sx={{ minWidth: 0 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: alpha(THEME_COLORS.primary, 0.1),
                              color: THEME_COLORS.primary,
                              width: 56,
                              height: 56,
                              flexShrink: 0,
                            }}
                          >
                            <Assignment sx={{ fontSize: 28 }} />
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="h5"
                              fontWeight={700}
                              sx={{ wordBreak: "break-word" }}
                            >
                              {report.title}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                              No. Laporan: {report.registrationNumber}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>
                  <Box sx={{ p: { xs: 2, md: 3 }, minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      gutterBottom
                      sx={{ mb: 2 }}
                    >
                      Deskripsi Laporan
                    </Typography>
                    <Box
                      sx={{
                        p: 3,
                        mb: 4,
                        bgcolor: THEME_COLORS.background,
                        borderRadius: 2,
                        minWidth: 0,
                        minHeight: "150px",
                      }}
                    >
                      <RichTextDisplay
                        content={report.description}
                        variant="body1"
                        showFullButton={true}
                      />
                    </Box>
                    {attachmentFeedback && (
                      <Alert
                        severity={attachmentFeedback.severity}
                        role="alert"
                        aria-live="polite"
                        sx={{ mb: 2, borderRadius: 2 }}
                      >
                        {attachmentFeedback.message}
                      </Alert>
                    )}
                    {uploadingAttachments && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                      <AttachFile sx={{ color: THEME_COLORS.primary }} />
                      <Typography variant="h6" fontWeight={600}>
                        Lampiran
                      </Typography>
                      <Chip
                        label={`${report.attachments?.length || 0} file`}
                        size="small"
                        sx={{
                          bgcolor: alpha(THEME_COLORS.primary, 0.1),
                          color: THEME_COLORS.primary,
                        }}
                      />
                      {report.status === 'PENDING' && (
                        <Button
                          component="label"
                          size="small"
                          variant="outlined"
                          startIcon={<AttachFile />}
                          disabled={uploadingAttachments}
                        >
                          Tambah Lampiran
                          <input
                            type="file"
                            hidden
                            multiple
                            accept="image/*,.pdf,.doc,.docx"
                            onChange={handleRetryAttachmentUpload}
                          />
                        </Button>
                      )}
                    </Stack>
                    {report.attachments && report.attachments.length > 0 && (
                      <Box>
                        <Grid container spacing={2} sx={{ minWidth: 0 }}>
                          {report.attachments.map((attachment) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={attachment.id} sx={{ minWidth: 0 }}>
                              <ReportAttachmentCard
                                attachment={attachment}
                                onPreview={handleAttachmentPreview}
                                downloadUrl={`${BACKEND_UPLOAD_URL}${attachment.filePath}`}
                              />
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
                <ReportReporterInfo user={report.user} />
                <ReportInfoSidebar
                  report={report}
                  currentStatus={currentStatus}
                  formatDate={formatDate}
                  onOpenChat={handleOpenChat}
                  onDeleteClick={() => setDeleteDialog(true)}
                  onRestoreClick={() => setRestoreDialog(true)}
                />
              </Stack>
            </Box>
          </Box>

          <ActionDialog
            open={deleteDialog}
            onClose={() => setDeleteDialog(false)}
            onConfirm={handleDelete}
            title="Batalkan Laporan"
            icon={<Cancel />}
            color="error"
            confirmText="Ya, Batalkan"
          >
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              Apakah Anda yakin ingin membatalkan laporan ini?
            </Alert>
            <Typography color="text.secondary">
              Laporan Anda akan dibatalkan, tetapi tetap dapat dilihat oleh admin.
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
            buttonColor={THEME_COLORS.primary}
          >
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              Apakah Anda yakin ingin memulihkan laporan ini?
            </Alert>
            <Typography color="text.secondary">
              Laporan akan dikembalikan ke status aktif dan terlihat di daftar
              utama.
            </Typography>
          </ActionDialog>

          <Dialog
            fullScreen
            open={pdfPreviewOpen}
            onClose={() => {
              setPdfPreviewOpen(false);
              setPdfPreviewAttachment(null);
              setNumPages(null);
            }}
            PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.9)" } }}
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
                  <CloseIcon sx={{ color: "#fff" }} />
                </IconButton>
                <Typography variant="h6" sx={{ flex: 1, color: "#fff" }}>
                  {pdfPreviewAttachment?.fileName}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  component="a"
                  href={`${BACKEND_UPLOAD_URL}${pdfPreviewAttachment?.filePath}`}
                  download={pdfPreviewAttachment?.fileName}
                  sx={{ color: "#fff" }}
                >
                  Unduh
                </Button>
              </Toolbar>
            </AppBar>
            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                p: 2,
                display: "flex",
                justifyContent: "center",
              }}
            >
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

          {previewAttachment && (
            <DocViewerPlus
              previewFile={{
                fileUrl: `${BACKEND_UPLOAD_URL}${previewAttachment.filePath}`,
                fileName: previewAttachment.fileName,
              }}
              visibleViewerPlus={previewOpen}
              onVisibleChange={handlePreviewClose}
            />
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default ReportDetailPage;
