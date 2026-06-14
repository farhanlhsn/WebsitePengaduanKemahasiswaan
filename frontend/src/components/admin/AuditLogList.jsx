import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Typography,
  IconButton,
  Tooltip,
  TablePagination,
  Fade,
  CircularProgress,
  Avatar
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Info, Person, Assignment, History } from '@mui/icons-material';
import { format } from 'date-fns';

const getActionColor = (action) => {
  const colors = {
    SOFT_DELETE: 'warning',
    RESTORE: 'success',
    HARD_DELETE: 'error',
    UPDATE_STATUS: 'info',
    VERIFY_MAHASISWA: 'success'
  };
  return colors[action] || 'default';
};

const getEntityIcon = (entityType) => {
  return entityType === 'USER' ? <Person fontSize="small" /> : <Assignment fontSize="small" />;
};

const AuditLogList = ({ logs = [], loading = false, onShowDetails, page, rowsPerPage, totalLogs, onPageChange, onRowsPerPageChange }) => {
  const headerCellSx = {
    fontWeight: 600,
    bgcolor: 'background.paper',
    backgroundImage: (theme) => `linear-gradient(${alpha(theme.palette.primary.main, 0.04)}, ${alpha(theme.palette.primary.main, 0.04)})`,
    py: 2
  };

  if (loading) {
    return (
      <Paper sx={{ 
        borderRadius: 4, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
        border: '1px solid rgba(0,0,0,0.05)',
        p: 8,
        textAlign: 'center' 
      }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography color="text.secondary" fontWeight={600}>
          Memuat audit logs...
        </Typography>
      </Paper>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Paper sx={{ 
        borderRadius: 4, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
        border: '1px solid rgba(0,0,0,0.05)',
        p: 8,
        textAlign: 'center' 
      }}>
        <Avatar sx={{ 
          width: 64, 
          height: 64, 
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
          color: 'primary.main',
          mx: 'auto',
          mb: 2
        }}>
          <History sx={{ fontSize: 32 }} />
        </Avatar>
        <Typography variant="h6" fontWeight={700} color="text.secondary" gutterBottom>
          Tidak Ada Log
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Belum ada aktivitas audit yang tercatat
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ 
      borderRadius: 4, 
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
      border: '1px solid rgba(0,0,0,0.05)',
      overflow: 'hidden'
    }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellSx}>
                Entitas
              </TableCell>
              <TableCell sx={headerCellSx}>
                Aksi
              </TableCell>
              <TableCell sx={headerCellSx}>
                ID Entitas
              </TableCell>
              <TableCell sx={headerCellSx}>
                Aktor
              </TableCell>
              <TableCell sx={headerCellSx}>
                IP Address
              </TableCell>
              <TableCell sx={headerCellSx}>
                Waktu
              </TableCell>
              <TableCell sx={{ 
                ...headerCellSx,
                textAlign: 'center'
              }}>
                Detail
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log, index) => (
              <Fade in timeout={200 + index * 50} key={log.id}>
                <TableRow 
                  hover
                  sx={{ 
                    '&:hover': { 
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02) 
                    }
                  }}
                >
                  <TableCell>
                    <Chip
                      icon={getEntityIcon(log.entityType)}
                      label={log.entityType}
                      size="small"
                      color={log.entityType === 'USER' ? 'primary' : 'secondary'}
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.action.replace(/_/g, ' ')}
                      size="small"
                      color={getActionColor(log.action)}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        bgcolor: 'action.hover',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'inline-block',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    >
                      {log.entityId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ 
                        width: 24, 
                        height: 24, 
                        fontSize: '0.75rem',
                        bgcolor: 'primary.main' 
                      }}>
                        {log.actorName?.charAt(0)?.toUpperCase() || 'A'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.875rem' }}>
                          {log.actorName || 'Unknown'}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontFamily: 'monospace',
                            color: 'text.secondary',
                            fontSize: '0.7rem'
                          }}
                        >
                          ID: {log.actorId}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontFamily: 'monospace',
                        bgcolor: 'action.hover',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'inline-block',
                        fontWeight: 600
                      }}
                    >
                      {log.ip || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Lihat Detail">
                      <IconButton 
                        size="small" 
                        onClick={() => onShowDetails(log)}
                        color="primary"
                      >
                        <Info fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </Fade>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      {totalLogs > 0 && (
        <TablePagination
          component="div"
          count={totalLogs}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Baris per halaman:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`
          }
          sx={{
            borderTop: '1px solid rgba(0,0,0,0.06)',
            bgcolor: (theme) => alpha(theme.palette.background.default, 0.3)
          }}
        />
      )}
    </Paper>
  );
};

export default AuditLogList;

