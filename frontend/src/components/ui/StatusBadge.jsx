import React from 'react';
import { Chip, Box } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  CheckCircle, HourglassEmpty, Pending, Error, Cancel, Visibility
} from '@mui/icons-material';
import { STATUS_CONFIG } from '../../utils/statusConfig';

// Ikon tetap lokal di badge; label & warna berasal dari konfigurasi terpusat.
const STATUS_ICONS = {
  PENDING: <Pending />,
  IN_REVIEW: <Visibility />,
  IN_PROGRESS: <HourglassEmpty />,
  RESOLVED: <CheckCircle />,
  ACTIVE: <CheckCircle />,
  DELETED: <Cancel />,
  REJECTED: <Error />,
  CANCELED: <Cancel />,
};

const StyledStatusBadge = styled(Chip)(({ statuscolor }) => ({
  borderRadius: 20,
  fontWeight: 600,
  fontSize: '0.875rem',
  height: 32,
  padding: '0 8px',
  border: `2px solid ${statuscolor}`,
  backgroundColor: alpha(statuscolor, 0.1),
  color: statuscolor,
  
  '& .MuiChip-icon': {
    fontSize: '1rem',
    color: statuscolor,
  },
  
  '& .MuiChip-label': {
    padding: '0 8px',
  },
  
  // Pulse animation for pending status
  animation: statuscolor === STATUS_CONFIG.PENDING.color 
    ? 'pulse 2s infinite' 
    : 'none',
  
  '@keyframes pulse': {
    '0%': {
      boxShadow: `0 0 0 0 ${alpha(statuscolor, 0.7)}`,
    },
    '70%': {
      boxShadow: `0 0 0 10px ${alpha(statuscolor, 0)}`,
    },
    '100%': {
      boxShadow: `0 0 0 0 ${alpha(statuscolor, 0)}`,
    },
  },
}));

const StatusBadge = ({ status, size = 'medium', showIcon = true, ...props }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const icon = STATUS_ICONS[status] || STATUS_ICONS.PENDING;
  
  return (
    <StyledStatusBadge
      label={config.label}
      icon={showIcon ? icon : undefined}
      statuscolor={config.color}
      size={size}
      {...props}
    />
  );
};

export default StatusBadge;