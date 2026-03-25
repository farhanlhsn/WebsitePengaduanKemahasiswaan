import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Typography
} from '@mui/material';
import {
  MoreVert,
  CheckCircle,
  Delete,
  Restore,
  Edit
} from '@mui/icons-material';

const BulkOperationsToolbar = ({ 
  selectedCount, 
  type, // 'users', 'reports', or 'categories'
  onBulkVerify,
  onBulkDelete,
  onBulkRestore,
  onBulkUpdateStatus,
  onClearSelection
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBulkAction = async (action) => {
    handleMenuClose();

    switch (action) {
      case 'verify':
        if (window.confirm(`Verify ${selectedCount} users?`)) {
          await onBulkVerify();
        }
        break;
      case 'delete':
        if (window.confirm(`Delete ${selectedCount} ${type}?`)) {
          await onBulkDelete();
        }
        break;
      case 'restore':
        if (window.confirm(`Restore ${selectedCount} ${type}?`)) {
          await onBulkRestore();
        }
        break;
      case 'updateStatus':
        setStatusDialogOpen(true);
        break;
      default:
        break;
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    setStatusDialogOpen(false);
    await onBulkUpdateStatus(selectedStatus);
    setSelectedStatus('');
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          bgcolor: 'primary.main',
          color: 'white',
          p: 2,
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={`${selectedCount} selected`}
            color="secondary"
            sx={{ fontWeight: 'bold' }}
          />
          <Typography variant="body2">
            Bulk Operations Available
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {type === 'users' && onBulkVerify && (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckCircle />}
              onClick={() => handleBulkAction('verify')}
            >
              Verify
            </Button>
          )}

          {type === 'reports' && onBulkUpdateStatus && (
            <Button
              variant="contained"
              color="info"
              size="small"
              startIcon={<Edit />}
              onClick={() => handleBulkAction('updateStatus')}
            >
              Update Status
            </Button>
          )}

          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<Delete />}
            onClick={() => handleBulkAction('delete')}
          >
            Delete
          </Button>

          <Button
            variant="contained"
            color="warning"
            size="small"
            startIcon={<Restore />}
            onClick={() => handleBulkAction('restore')}
          >
            Restore
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={onClearSelection}
            sx={{ color: 'white', borderColor: 'white' }}
          >
            Clear
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={handleMenuOpen}
            sx={{ color: 'white', borderColor: 'white', minWidth: 'auto', px: 1 }}
          >
            <MoreVert />
          </Button>
        </Box>
      </Box>

      {/* More Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleBulkAction('delete')}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Bulk Delete
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('restore')}>
          <Restore fontSize="small" sx={{ mr: 1 }} />
          Bulk Restore
        </MenuItem>
        {type === 'users' && (
          <MenuItem onClick={() => handleBulkAction('verify')}>
            <CheckCircle fontSize="small" sx={{ mr: 1 }} />
            Bulk Verify
          </MenuItem>
        )}
        {type === 'reports' && (
          <MenuItem onClick={() => handleBulkAction('updateStatus')}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Bulk Update Status
          </MenuItem>
        )}
      </Menu>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Report Status</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="IN_REVIEW">In Review</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="RESOLVED">Resolved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="CANCELED">Canceled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleStatusUpdate} 
            variant="contained" 
            disabled={!selectedStatus}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkOperationsToolbar;


