import React from 'react';
import { Skeleton, Card, CardContent, Stack, Box } from '@mui/material';

/**
 * Reusable skeleton for card-style list items (reports, users, audit logs).
 *
 * @param {object} props
 * @param {number} [props.count=3] - Number of skeleton rows to render.
 * @param {boolean} [props.compact=false] - Renders shorter rows when true.
 */
export default function ListSkeleton({ count = 3, compact = false }) {
  return (
    <Stack spacing={2} role="status" aria-label="Memuat...">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Skeleton variant="text" width="60%" height={28} />
            {!compact && <Skeleton variant="text" width="100%" />}
            {!compact && <Skeleton variant="text" width="80%" />}
            <Box sx={{ mt: compact ? 1 : 2, display: 'flex', gap: 1 }}>
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="rounded" width={100} height={24} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
