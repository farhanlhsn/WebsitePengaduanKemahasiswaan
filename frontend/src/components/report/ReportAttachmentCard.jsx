import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Tooltip,
  Box,
  Stack,
} from "@mui/material";
import { Visibility, Download } from "@mui/icons-material";

const THEME_COLORS = {
  primary: "#43A047",
};

const getFileTypeIcon = (fileType) => {
  if (fileType?.startsWith("image/")) return "🖼️";
  if (fileType?.startsWith("video/")) return "🎥";
  if (fileType?.includes("pdf")) return "📄";
  return "📁";
};

const ReportAttachmentCard = ({ attachment, onPreview, downloadUrl }) => {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderColor: "grey.200",
        minWidth: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ minWidth: 0, flex: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ mb: 1, minWidth: 0 }}
        >
          <Typography sx={{ fontSize: "2rem", flexShrink: 0 }}>
            {getFileTypeIcon(attachment.fileType)}
          </Typography>
          <Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <Tooltip title={attachment.fileName || "Berkas tidak diketahui"}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                noWrap
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {attachment.fileName || "Berkas tidak diketahui"}
              </Typography>
            </Tooltip>
          </Box>
        </Stack>
      </CardContent>
      <CardActions
        sx={{
          px: 2,
          pb: 2,
          justifyContent: "space-between",
        }}
      >
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => onPreview(attachment)}
          variant="text"
          sx={{ color: "text.secondary" }}
        >
          Lihat
        </Button>
        <Button
          size="small"
          startIcon={<Download />}
          component="a"
          href={downloadUrl}
          download={attachment.fileName}
          variant="contained"
          sx={{
            ml: "auto",
            bgcolor: THEME_COLORS.primary,
            "&:hover": { bgcolor: "#388E3C" },
          }}
        >
          Unduh
        </Button>
      </CardActions>
    </Card>
  );
};

export default ReportAttachmentCard;
