import React from 'react';
import { Chip, Box } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  CheckCircle, HourglassEmpty, Pending, Error, Cancel, Visibility
} from '@mui/icons-material';

const STATUS_CONFIG = {
  PENDING: { 
    label: 'Menunggu', 
    color: '#FF9800', 
    icon: <Pending />,
    bgColor: '#FFF3E0'
  },
  IN_REVIEW: { 
    label: 'Ditinjau', 
    color: '#2196F3', 
    icon: <Visibility />,
    bgColor: '#E3F2FD'
  },
  IN_PROGRESS: { 
    label: 'Diproses', 
    color: '#FF9800', 
    icon: <HourglassEmpty />,
    bgColor: '#FFF3E0'
  },
  RESOLVED: { 
    label: 'Selesai', 
    color: '#4CAF50', 
    icon: <CheckCircle />,
    bgColor: '#E8F5E8'
  },
  ACTIVE: { 
    label: 'Aktif', 
    color: '#4CAF50', 
    icon: <CheckCircle />,
    bgColor: '#E8F5E8'
  },
  DELETED: { 
    label: 'Dihapus', 
    color: '#F44336', 
    icon: <Cancel />,
    bgColor: '#FFEBEE'
  },
  REJECTED: { 
    label: 'Ditolak', 
    color: '#F44336', 
    icon: <Error />,
    bgColor: '#FFEBEE'
  },
  CANCELED: { 
    label: 'Dibatalkan', 
    color: '#9E9E9E', 
    icon: <Cancel />,
    bgColor: '#F5F5F5'
  },
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
  
  return (
    <StyledStatusBadge
      label={config.label}
      icon={showIcon ? config.icon : undefined}
      statuscolor={config.color}
      size={size}
      {...props}
    />
  );
};

export default StatusBadge;