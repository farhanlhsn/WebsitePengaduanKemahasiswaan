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
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Info, Person, Assignment, History, MoreVert } from '@mui/icons-material';
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

const ACTION_LABELS = {
  SOFT_DELETE: 'Dihapus sementara',
  RESTORE: 'Pulihkan',
  HARD_DELETE: 'Hapus Permanen',
  UPDATE_STATUS: 'Ubah Status',
  VERIFY_MAHASISWA: 'Verifikasi Mahasiswa',
};

const ENTITY_LABELS = {
  USER: 'Pengguna',
  REPORT: 'Laporan',
  CATEGORY: 'Kategori',
};

const getEntityIcon = (entityType) => {
  return entityType === 'USER' ? <Person fontSize="small" /> : <Assignment fontSize="small" />;
};

const AuditLogList = ({ logs = [], loading = false, onShowDetails, page, rowsPerPage, totalLogs, onPageChange, onRowsPerPageChange }) => {
  const [actionAnchorEl, setActionAnchorEl] = React.useState(null);
  const [selectedLog, setSelectedLog] = React.useState(null);

  const openActionMenu = (event, log) => {
    setActionAnchorEl(event.currentTarget);
    setSelectedLog(log);
  };

  const closeActionMenu = () => {
    setActionAnchorEl(null);
    setSelectedLog(null);
  };

  const showSelectedDetail = () => {
    const log = selectedLog;
    closeActionMenu();
    if (log) onShowDetails(log);
  };

  const headerCellSx = {
    fontWeight: 600,
    bgcolor: 'background.paper',
    backgroundImage: (theme) => `linear-gradient(${alpha(theme.palette.primary.main, 0.04)}, ${alpha(theme.palette.primary.main, 0.04)})`,
    py: 2
  };

  if (loading) {
    return (
      <Paper sx={{ 
        borderRadius: 3, 
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', 
        border: '1px solid rgba(0,0,0,0.05)',
        p: 8,
        textAlign: 'center' 
      }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography color="text.secondary" fontWeight={600}>
          Memuat log audit...
        </Typography>
      </Paper>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Paper sx={{ 
        borderRadius: 3, 
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', 
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
      borderRadius: 3, 
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', 
      border: '1px solid rgba(0,0,0,0.05)',
      overflow: 'hidden'
    }}>
      <TableContainer sx={{ maxHeight: 600, overflowX: 'hidden' }}>
        <Table stickyHeader size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, width: '16%' }}>
                Entitas
              </TableCell>
              <TableCell sx={{ ...headerCellSx, width: '20%' }}>
                Aksi
              </TableCell>
              <TableCell sx={{ ...headerCellSx, width: '18%', display: { xs: 'none', lg: 'table-cell' } }}>
                ID Entitas
              </TableCell>
              <TableCell sx={{ ...headerCellSx, width: '24%', display: { xs: 'none', sm: 'table-cell' } }}>
                Aktor
              </TableCell>
              <TableCell sx={{ ...headerCellSx, width: '16%', display: { xs: 'none', md: 'table-cell' } }}>
                Alamat IP
              </TableCell>
              <TableCell sx={{ ...headerCellSx, width: '18%' }}>
                Waktu
              </TableCell>
              <TableCell sx={{ 
                ...headerCellSx,
                width: 58,
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
                      label={ENTITY_LABELS[log.entityType] || log.entityType}
                      size="small"
                      color={log.entityType === 'USER' ? 'primary' : 'secondary'}
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ACTION_LABELS[log.action] || log.action.replace(/_/g, ' ')}
                      size="small"
                      color={getActionColor(log.action)}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
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
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
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
                          {log.actorName || 'Tidak diketahui'}
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
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
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
                    <Tooltip title="Buka menu aksi">
                      <IconButton size="small" onClick={(event) => openActionMenu(event, log)} aria-label="Buka menu aksi log audit">
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </Fade>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={closeActionMenu}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        <MenuItem onClick={showSelectedDetail}>
          <ListItemIcon><Info fontSize="small" /></ListItemIcon>
          Lihat detail
        </MenuItem>
      </Menu>
      
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

