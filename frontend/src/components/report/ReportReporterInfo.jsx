import React from "react";
import { Paper, Typography, Stack, Avatar, Box } from "@mui/material";
import { School, Email } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

const THEME_COLORS = {
  primary: "#43A047",
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
      {value || "-"}
    </Typography>
  </Box>
);

const ReportReporterInfo = ({ user }) => {
  if (!user) return null;

  return (
    <Paper sx={{ ...cardStyle, p: 3 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
        Informasi Pelapor
      </Typography>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar
          sx={{
            bgcolor: alpha(THEME_COLORS.primary, 0.1),
            color: THEME_COLORS.primary,
            width: 56,
            height: 56,
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant="h6" fontWeight={700}>
          {user.name}
        </Typography>
      </Stack>
      <Stack spacing={2.5}>
        <InfoItem
          icon={<School />}
          label="NIM"
          value={user.nim}
          color={THEME_COLORS.textSecondary}
        />
        <InfoItem
          icon={<Email />}
          label="Email"
          value={user.email}
          color={THEME_COLORS.textSecondary}
        />
      </Stack>
    </Paper>
  );
};

export default ReportReporterInfo;
