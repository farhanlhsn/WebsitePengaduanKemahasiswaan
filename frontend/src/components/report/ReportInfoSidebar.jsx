import React from "react";
import { Paper, Typography, Stack, Avatar, Box, Divider, Button } from "@mui/material";
import { Category, Today, AccessTime, CheckCircle, Chat, Restore, Delete, Cancel } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

const THEME_COLORS = {
  primary: "#43A047",
  pending: "#FFA726",
  resolved: "#43A047",
  rejected: "#F44336",
  canceled: "#BDBDBD",
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

const ReportInfoSidebar = ({
  report,
  currentStatus,
  formatDate,
  onOpenChat,
  onDeleteClick,
  onRestoreClick,
}) => {
  return (
    <Paper sx={{ ...cardStyle, p: 3 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
        Informasi Laporan
      </Typography>
      <Stack spacing={2.5} sx={{ mb: 3 }}>
        <InfoItem
          icon={<Category />}
          label="Kategori"
          value={report.category?.name}
          color={THEME_COLORS.primary}
        />
        <InfoItem
          icon={<Today />}
          label="Tanggal Dibuat"
          value={formatDate(report.createdAt)}
          color={THEME_COLORS.textSecondary}
        />
        {report.updatedAt !== report.createdAt && (
          <InfoItem
            icon={<AccessTime />}
            label="Terakhir Diupdate"
            value={formatDate(report.updatedAt)}
            color={THEME_COLORS.pending}
          />
        )}
        {report.closedAt && (
          <InfoItem
            icon={<CheckCircle />}
            label="Tanggal Ditutup"
            value={formatDate(report.closedAt)}
            color={THEME_COLORS.resolved}
          />
        )}
        <InfoItem
          icon={<CheckCircle />}
          label="Status"
          value={currentStatus.label}
          color={currentStatus.color}
        />
      </Stack>
      <Divider sx={{ my: 1 }} />
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
        Aksi
      </Typography>
      <Stack spacing={2}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Chat />}
          onClick={onOpenChat}
          sx={{
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            bgcolor: THEME_COLORS.primary,
            "&:hover": { bgcolor: "#388E3C" },
          }}
        >
          Chat dengan Admin
        </Button>
        {report.deletedAt ? (
          <Button
            fullWidth
            variant="contained"
            startIcon={<Restore />}
            onClick={onRestoreClick}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              bgcolor: THEME_COLORS.primary,
              "&:hover": { bgcolor: "#388E3C" },
            }}
          >
            Pulihkan Laporan
          </Button>
        ) : (
          report.status === 'PENDING' && (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={onDeleteClick}
              sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}
            >
              Batalkan Laporan
            </Button>
          )
        )}
      </Stack>
    </Paper>
  );
};

export default ReportInfoSidebar;
