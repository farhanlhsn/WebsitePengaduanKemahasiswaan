import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  TextField,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import AdminSectionHeader from './admin/AdminSectionHeader';
import {
  Security,
  Delete,
  CleaningServices,
  Storage,
  Info,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import {
  cleanupOldDeletedUsers,
  cleanupOldAuditLogs
} from '../services/api';

const SystemSecurityPage = () => {
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupType, setCleanupType] = useState('');
  const [daysOld, setDaysOld] = useState(90);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const { onMobileMenuClick } = useOutletContext() ?? {};

  const handleCleanupOpen = (type) => {
    setCleanupType(type);
    setDaysOld(type === 'audit' ? 365 : 90);
    setCleanupDialogOpen(true);
  };

  const handleCleanupSubmit = async () => {
    try {
      let result;
      if (cleanupType === 'users') {
        result = await cleanupOldDeletedUsers(daysOld);
        showSnackbar(`Cleaned up ${result.deleted || 0} old deleted users`, 'success');
      } else if (cleanupType === 'audit') {
        result = await cleanupOldAuditLogs(daysOld);
        showSnackbar(`Cleaned up ${result.deleted || 0} old audit logs`, 'success');
      }
      setCleanupDialogOpen(false);
    } catch (error) {
      showSnackbar('Cleanup failed: ' + error.message, 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Container maxWidth="xl">
        {/* Header */}
        <AdminSectionHeader
          title="System & Security"
          subtitle="System maintenance and security settings"
          onMobileMenuClick={onMobileMenuClick}
          showRefresh={false}
          showNotifications={false}
        />

      <Grid container spacing={3}>
        {/* System Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Info color="primary" />
              <Typography variant="h6">System Information</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="System Status"
                  secondary="Operational"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Storage fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Database"
                  secondary="MySQL - Connected"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Security fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Authentication"
                  secondary="JWT with Refresh Tokens"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Security Features */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Security color="primary" />
              <Typography variant="h6">Security Features</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Audit Logging"
                  secondary="All admin actions are logged"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Role-Based Access"
                  secondary="Admin middleware protection"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Soft Delete"
                  secondary="Data recovery capability"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Device Tracking"
                  secondary="Multi-device session management"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Database Cleanup */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CleaningServices color="warning" />
              <Typography variant="h6">Database Cleanup</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Warning: Cleanup operations are irreversible
              </Typography>
              <Typography variant="caption">
                Please backup your database before performing cleanup operations.
              </Typography>
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Delete color="error" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        Cleanup Deleted Users
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Permanently remove users that have been soft-deleted for more than the specified number of days.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={() => handleCleanupOpen('users')}
                    >
                      Cleanup Users
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Delete color="error" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        Cleanup Audit Logs
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Remove audit logs older than the specified number of days to free up database space.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={() => handleCleanupOpen('audit')}
                    >
                      Cleanup Logs
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Best Practices */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Warning color="info" />
              <Typography variant="h6">Best Practices</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List>
              <ListItem>
                <ListItemText
                  primary="Regular Backups"
                  secondary="Create database backups before major operations"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Monitor Audit Logs"
                  secondary="Review audit logs regularly for suspicious activities"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Data Retention"
                  secondary="Keep deleted data for 90 days before permanent cleanup"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Password Policy"
                  secondary="Enforce strong passwords and regular password changes"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Cleanup Confirmation Dialog */}
      <Dialog open={cleanupDialogOpen} onClose={() => setCleanupDialogOpen(false)}>
        <DialogTitle>
          Confirm Cleanup Operation
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This operation is irreversible!
          </Alert>
          <Typography variant="body2" paragraph>
            {cleanupType === 'users'
              ? 'This will permanently delete all users that have been soft-deleted for more than the specified number of days.'
              : 'This will permanently delete all audit logs older than the specified number of days.'}
          </Typography>
          <TextField
            type="number"
            label="Days Old"
            fullWidth
            value={daysOld}
            onChange={(e) => setDaysOld(parseInt(e.target.value))}
            inputProps={{ min: 1 }}
            helperText={`Delete items older than ${daysOld} days`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCleanupSubmit}
            color="error"
            variant="contained"
          >
            Confirm Cleanup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Container>
    </>
  );
};

export default SystemSecurityPage;

