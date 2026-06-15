import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';

/**
 * Generic empty-state UI for lists, tables, and dashboards.
 *
 * @param {object} props
 * @param {React.ComponentType} [props.icon] - Icon component (default: InboxOutlined).
 * @param {string} props.title - Bold heading.
 * @param {string} [props.description] - Supporting text.
 * @param {string} [props.actionLabel] - Optional CTA button label.
 * @param {() => void} [props.onAction] - Click handler for the CTA.
 * @param {object} [props.sx] - Additional sx overrides.
 */
export default function EmptyState({
  icon = InboxOutlined,
  title,
  description,
  actionLabel,
  onAction,
  sx = {},
}) {
  const Icon = icon;
  return (
    <Box
      sx={{
        py: { xs: 4, md: 6 },
        px: 2,
        textAlign: 'center',
        ...sx,
      }}
      role="status"
    >
      {React.createElement(Icon, { sx: { fontSize: 64, color: 'text.disabled', mb: 2 }, 'aria-hidden': true })}
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ mb: actionLabel ? 3 : 0, maxWidth: 480, mx: 'auto' }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
