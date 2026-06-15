import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import { 
  Close, 
  Person, 
  Computer, 
  Dns, 
  AccessTime, 
  Category, 
  Description, 
  AdminPanelSettings,
  Fingerprint,
  History,
  Code,
  Visibility
} from '@mui/icons-material';
import { format } from 'date-fns';
import { alpha } from '@mui/material/styles';

const AuditLogDetailModal = ({ open, onClose, log }) => {
  const theme = useTheme();

  if (!log) return null;

  const getActionColor = (action) => {
    if (action.includes('DELETE')) return theme.palette.error.main;
    if (action.includes('RESTORE') || action.includes('VERIFY')) return theme.palette.success.main;
    if (action.includes('UPDATE')) return theme.palette.primary.main;
    return theme.palette.info.main;
  };

  const actionColor = getActionColor(log.action);

  const renderMetadata = () => {
    if (!log.metadata) return <Typography variant="body2" color="textSecondary">No metadata available</Typography>;
    
    try {
      const metadata = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
      
      // Check if metadata contains old/new values for better diff display
      const hasDiff = ('oldStatus' in metadata && 'newStatus' in metadata) || 
                      ('oldValue' in metadata && 'newValue' in metadata);

      if (hasDiff) {
        const oldVal = metadata.oldStatus || metadata.oldValue;
        const newVal = metadata.newStatus || metadata.newValue;
        return (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.warning.light, 0.05) }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">Change Log</Typography>
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs={5}>
                 <Typography variant="caption" display="block" color="text.secondary">From</Typography>
                 <Chip label={String(oldVal)} size="small" color="default" variant="outlined" />
              </Grid>
              <Grid item xs={2} sx={{ textAlign: 'center' }}>
                 <Typography variant="body1" color="text.secondary">→</Typography>
              </Grid>
              <Grid item xs={5} sx={{ textAlign: 'right' }}>
                 <Typography variant="caption" display="block" color="text.secondary">To</Typography>
                 <Chip label={String(newVal)} size="small" color="primary" />
              </Grid>
            </Grid>
            {/* Render other keys if any */}
            {Object.entries(metadata).filter(([k]) => !['oldStatus', 'newStatus', 'oldValue', 'newValue'].includes(k)).length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                {Object.entries(metadata).filter(([k]) => !['oldStatus', 'newStatus', 'oldValue', 'newValue'].includes(k)).map(([key, value]) => (
                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                     <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{key}:</Typography>
                     <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{String(value)}</Typography>
                  </Box>
                ))}
              </>
            )}
          </Paper>
        );
      }

      return (
        <Paper variant="outlined" sx={{ overflow: 'hidden', bgcolor: 'background.paper' }}>
          {Object.entries(metadata).map(([key, value], index) => (
            <Box key={key}>
              <Box sx={{ display: 'flex', p: 1.5, bgcolor: index % 2 === 0 ? 'transparent' : alpha(theme.palette.common.black, 0.02) }}>
                <Typography variant="body2" color="text.secondary" sx={{ width: '140px', flexShrink: 0, fontWeight: 600 }}>
                  {key}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Typography>
              </Box>
              {index < Object.keys(metadata).length - 1 && <Divider />}
            </Box>
          ))}
        </Paper>
      );
    } catch {
      return <Typography variant="body2" color="error">Invalid metadata format</Typography>;
    }
  };

  const InfoCard = ({ icon, label, value, subValue, fullWidth }) => (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        height: '100%', 
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`
        }
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box sx={{ 
          p: 1, 
          borderRadius: 1.5, 
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: theme.palette.primary.main,
          display: 'flex'
        }}>
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight="600" display="block" sx={{ mb: 0.5 }}>
            {label.toUpperCase()}
          </Typography>
          <Typography variant="body1" fontWeight="500" noWrap={!fullWidth} title={String(value)}>
            {value || '-'}
          </Typography>
          {subValue && (
             <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', mt: 0.5, display: 'block' }}>
               {subValue}
             </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden' }
      }}
    >
      {/* Header Banner */}
      <Box sx={{ 
        p: 3, 
        background: `linear-gradient(135deg, ${alpha(actionColor, 0.1)} 0%, ${alpha(actionColor, 0.05)} 100%)`,
        borderBottom: `1px solid ${alpha(actionColor, 0.2)}`
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
             <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Chip 
                  label={log.action.replace(/_/g, ' ')} 
                  sx={{ 
                    bgcolor: actionColor, 
                    color: '#fff', 
                    fontWeight: 'bold',
                    borderRadius: 1.5
                  }} 
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTime fontSize="small" />
                  {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm:ss')}
                </Typography>
             </Stack>
             <Typography variant="h5" fontWeight="700">
               {log.entityType} <span style={{ opacity: 0.5, fontSize: '0.8em' }}>#{log.entityId}</span>
             </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
            <Close />
          </IconButton>
        </Stack>
      </Box>
      
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Actor Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
              <Person fontSize="small" color="action" /> ACTOR DETAILS
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <InfoCard 
                  icon={<AdminPanelSettings />}
                  label="Pelaku" 
                  value={log.actorName ? log.actorName : `ID: ${log.actorId}`}
                  subValue={`Peran: ${log.actorRole}`}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InfoCard 
                  icon={<Dns />}
                  label="Jaringan" 
                  value={log.ip}
                  subValue="Alamat IP"
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <InfoCard 
              icon={<Computer />}
              label="Agen Pengguna" 
              value={log.userAgent}
              fullWidth
            />
          </Grid>

          {/* Metadata Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 2, mt: 1, display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
              <Code fontSize="small" color="action" /> ACTION METADATA
            </Typography>
            {renderMetadata()}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: 'background.paper', borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, ml: 1 }}>
          Log ID: {log.id}
        </Typography>
        <Button onClick={onClose} variant="contained" disableElevation sx={{ px: 4 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuditLogDetailModal;

