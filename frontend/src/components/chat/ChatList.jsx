import React, { useEffect, useState } from 'react';
import {
  Box, List, ListItem, ListItemAvatar, ListItemText, Avatar, Badge,
  Typography, Chip, TextField, InputAdornment, Skeleton, Alert,
  IconButton, Tooltip, Divider
} from '@mui/material';
import {
  Search, Person, AdminPanelSettings, Circle, 
  Message, Schedule, CheckCircle, Cancel, Refresh, VisibilityOff
} from '@mui/icons-material';
import { styled, alpha, useTheme } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import useChatStore from '../../stores/chatStore';
import useAuthStore from '../../stores/authStore';

const ChatListContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  minHeight: 600,
  width: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: 16,
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
}));

const ReportsListContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    background: alpha(theme.palette.grey[300], 0.2),
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(theme.palette.grey[500], 0.3),
    borderRadius: 3,
  },
}));

const ReportListItem = styled(ListItem)(({ theme, selected }) => ({
  cursor: 'pointer',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  transition: 'all 0.2s ease',
  
  ...(selected && {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    borderLeft: `4px solid ${theme.palette.primary.main}`,
  }),
  
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, selected ? 0.08 : 0.04),
  },
}));

const StatusIndicator = ({ status }) => {
  const theme = useTheme();
  
  const statusConfig = {
    PENDING: { color: theme.palette.warning.main, label: 'Menunggu' },
    IN_REVIEW: { color: theme.palette.info.main, label: 'Review' },
    IN_PROGRESS: { color: theme.palette.primary.main, label: 'Progress' },
    RESOLVED: { color: theme.palette.success.main, label: 'Selesai' },
    REJECTED: { color: theme.palette.error.main, label: 'Ditolak' },
    CANCELED: { color: theme.palette.grey[500], label: 'Canceled' },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <Chip
      icon={<Circle sx={{ fontSize: 8 }} />}
      label={config.label}
      size="small"
      sx={{
        height: 20,
        fontSize: '0.7rem',
        backgroundColor: alpha(config.color, 0.1),
        color: config.color,
        border: `1px solid ${alpha(config.color, 0.3)}`,
        '& .MuiChip-icon': {
          color: config.color,
          fontSize: 8,
        }
      }}
    />
  );
};

const ChatList = ({ onReportSelect }) => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { 
    reports = [],
    currentReport, 
    isLoading, 
    error, 
    getReportsWithMessages,
    selectReport,
    clearError 
  } = useChatStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getReportsWithMessages();
  }, [user?.id, getReportsWithMessages]);

  useEffect(() => {
    if (!user?.id || isInitialized || !reports.length) return;
    const lastSelectedReportId = sessionStorage.getItem('lastSelectedReportId');
    if (lastSelectedReportId && !currentReport) {
      const reportToSelect = reports.find(r => String(r.id) === String(lastSelectedReportId));
      if (reportToSelect) {
        selectReport(reportToSelect);
        onReportSelect?.(reportToSelect);
      }
    }
    setIsInitialized(true);
  }, [user?.id, reports, currentReport, isInitialized, selectReport, onReportSelect]);

  const filteredReports = React.useMemo(() => {
    if (!reports || !Array.isArray(reports)) return [];
    const term = searchTerm.trim().toLowerCase();
    let list = reports;
    if (term) {
      list = reports.filter(report =>
        report.title?.toLowerCase().includes(term) ||
        report.registrationNumber?.toLowerCase().includes(term) ||
        report.user?.name?.toLowerCase().includes(term)
      );
    }
    return [...list].sort((a, b) => {
      const aUnread = (a.unreadCount || 0) > 0;
      const bUnread = (b.unreadCount || 0) > 0;
      if (aUnread !== bUnread) return aUnread ? -1 : 1;
      const aTime = a.lastMessage?.createdAt || '';
      const bTime = b.lastMessage?.createdAt || '';
      return new Date(bTime) - new Date(aTime);
    });
  }, [reports, searchTerm]);

  const handleReportClick = async (report) => {
    try {
      await selectReport(report);
      onReportSelect?.(report);
      sessionStorage.setItem('lastSelectedReportId', report.id);
    } catch (error) {
      console.error('Failed to select report:', error);
    }
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: id });
  };

  const renderSkeletonList = () => (
    <List>
      {[...Array(6)].map((_, index) => (
        <ListItem key={index}>
          <ListItemAvatar><Skeleton variant="circular" width={40} height={40} /></ListItemAvatar>
          <ListItemText primary={<Skeleton variant="text" width="80%" />} secondary={<Skeleton variant="text" width="60%" />} />
        </ListItem>
      ))}
    </List>
  );

  const renderEmptyState = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4, textAlign: 'center' }}>
      <Message sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>Belum Ada Percakapan</Typography>
      <Typography variant="body2" color="text.secondary">
        {user?.role === 'ADMIN' ? 'Belum ada laporan yang memiliki pesan' : 'Mulai chat dengan mengirim pesan pertama pada laporan Anda'}
      </Typography>
    </Box>
  );

  const renderReportItem = (report) => {
    const isSelected = currentReport?.id === report.id;
    const hasUnread = report.unreadCount > 0;
    const lastMessage = report.lastMessage;
    const isFromUser = lastMessage?.sender?.role !== 'ADMIN';

    return (
      <ReportListItem
        key={report.id}
        selected={isSelected}
        onClick={() => handleReportClick(report)}
      >
        <ListItemAvatar>
          <Badge badgeContent={report.unreadCount} color="error" overlap="circular" invisible={!hasUnread}>
            <Avatar sx={{
              bgcolor: report.isAnonymous ? 'warning.light' : (isFromUser ? 'primary.light' : 'secondary.main'),
              width: 40,
              height: 40
            }}>
              {report.isAnonymous ? <VisibilityOff fontSize="small" /> : (isFromUser ? <Person /> : <AdminPanelSettings />)}
            </Avatar>
          </Badge>
        </ListItemAvatar>
        
        {/************** PERBAIKAN UTAMA DI SINI *************/}
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ fontWeight: hasUnread ? 600 : 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {report.title}
              </Typography>
              <StatusIndicator status={report.status} />
            </Box>
          }
          secondary={
            // Gunakan React.Fragment untuk menghindari elemen <p> sebagai induk
            <React.Fragment>
              <Typography 
                component="span" // Render sebagai span
                variant="caption" 
                color="text.secondary" 
                display="block"
              >
                #{report.registrationNumber} • {report.user?.name}
              </Typography>
              
              {lastMessage && (
                <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography 
                    component="span" // Render sebagai span
                    variant="body2" 
                    sx={{ 
                      fontWeight: hasUnread ? 500 : 400,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: hasUnread ? 'text.primary' : 'text.secondary'
                    }}
                  >
                    {lastMessage.sender?.role === 'ADMIN' ? 'Admin: ' : ''}
                    {lastMessage.content}
                  </Typography>
                  <Typography 
                    component="span" // Render sebagai span
                    variant="caption" 
                    color="text.secondary"
                  >
                    {formatLastMessageTime(lastMessage.createdAt)}
                  </Typography>
                </Box>
              )}
            </React.Fragment>
          }
          secondaryTypographyProps={{ 
            component: 'div' // Render wrapper untuk secondary content sebagai <div>, bukan <p>
          }}
        />
        {/************** AKHIR DARI PERBAIKAN *************/}
      </ReportListItem>
    );
  };

  return (
    <ChatListContainer>
      <SearchContainer>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>Chat & Pesan</Typography>
          {/************** PERBAIKAN TOOLTIP DI SINI *************/}
          <Tooltip title="Refresh">
            <span> {/* Tambahkan wrapper span */}
              <IconButton size="small" onClick={() => getReportsWithMessages()} disabled={isLoading}>
                <Refresh />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        
        <TextField
          fullWidth
          size="small"
          placeholder="Cari laporan atau nama..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (<InputAdornment position="start"><Search fontSize="small" /></InputAdornment>),
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: alpha(theme.palette.background.paper, 0.8) } }}
        />
      </SearchContainer>

      <ReportsListContainer>
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" onClose={clearError} action={<IconButton size="small" onClick={() => getReportsWithMessages()}><Refresh /></IconButton>}>
              {error}
            </Alert>
          </Box>
        )}
        {isLoading ? renderSkeletonList() : !filteredReports || filteredReports.length === 0 ? renderEmptyState() : (
          <List disablePadding>{filteredReports.map(renderReportItem)}</List>
        )}
      </ReportsListContainer>
    </ChatListContainer>
  );
};

export default ChatList;