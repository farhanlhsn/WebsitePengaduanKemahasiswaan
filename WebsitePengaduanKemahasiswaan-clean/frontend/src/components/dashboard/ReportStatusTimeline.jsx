import React from 'react';
import { Box, Stepper, Step, StepLabel, Typography, Alert } from '@mui/material';
import {
  HourglassEmpty,
  RateReview,
  Engineering,
  CheckCircle,
  Cancel,
  BlockOutlined,
} from '@mui/icons-material';

const FLOW = ['PENDING', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED'];

const ICONS = {
  PENDING: HourglassEmpty,
  IN_REVIEW: RateReview,
  IN_PROGRESS: Engineering,
  RESOLVED: CheckCircle,
  REJECTED: Cancel,
  CANCELED: BlockOutlined,
};

const LABELS = {
  PENDING: 'Menunggu',
  IN_REVIEW: 'Ditinjau',
  IN_PROGRESS: 'Diproses',
  RESOLVED: 'Selesai',
  REJECTED: 'Ditolak',
  CANCELED: 'Dibatalkan',
};

/**
 * Visualizes the lifecycle of a report status:
 * PENDING → IN_REVIEW → IN_PROGRESS → RESOLVED
 * Terminal failure states (REJECTED, CANCELED) get a dedicated alert UI.
 *
 * @param {object} props
 * @param {string} props.status - Current status of the report.
 * @param {Array<{status: string, timestamp: string}>} [props.statusHistory] - Optional history of status transitions.
 */
export default function ReportStatusTimeline({ status, statusHistory = [] }) {
  if (status === 'REJECTED' || status === 'CANCELED') {
    const Icon = ICONS[status];
    return (
      <Alert
        severity={status === 'REJECTED' ? 'error' : 'warning'}
        icon={<Icon />}
        sx={{ borderRadius: 2 }}
      >
        Laporan {LABELS[status]}
      </Alert>
    );
  }

  const activeIndex = FLOW.indexOf(status);

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Stepper activeStep={activeIndex} alternativeLabel sx={{ py: 2 }}>
        {FLOW.map((stage) => {
          const Icon = ICONS[stage];
          const completed = FLOW.indexOf(stage) <= activeIndex;
          const historyEntry = statusHistory.find((h) => h.status === stage);

          return (
            <Step key={stage} completed={completed}>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: completed ? 'primary.main' : 'grey.300',
                      color: completed ? 'primary.contrastText' : 'text.disabled',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>
                )}
                optional={
                  historyEntry?.timestamp ? (
                    <Typography variant="caption" color="text.secondary">
                      {new Date(historyEntry.timestamp).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Typography>
                  ) : null
                }
              >
                {LABELS[stage]}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
}
