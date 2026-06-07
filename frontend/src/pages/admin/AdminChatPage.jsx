import React from 'react';
import { Box, Grid, Fade } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import useChatStore from '../../stores/chatStore';
import ChatList from '../../components/chat/ChatList';
import ChatInterface from '../../components/chat/ChatInterface';
import AdminSectionHeader from './AdminSectionHeader';

const AdminChatPage = () => {
  const { onMobileMenuClick } = useOutletContext() ?? {};
  const { selectReport } = useChatStore();

  return (
    <Fade in timeout={300}>
      <Box>
        <AdminSectionHeader
          title="Chat & Komunikasi"
          subtitle="Komunikasi langsung dengan pelapor"
          onMobileMenuClick={onMobileMenuClick}
          showRefresh={false}
        />
        <Grid container spacing={3} sx={{ height: 'calc(100vh - 220px)' }}>
          <Grid size={{ xs: 12, md: 5, lg: 4, xl: 3 }} sx={{ '@media (min-width: 1920px)': { minHeight: 600 } }}>
            <ChatList onReportSelect={selectReport} />
          </Grid>
          <Grid size={{ xs: 12, md: 7, lg: 8, xl: 9 }} sx={{ '@media (min-width: 1920px)': { minHeight: 600 } }}>
            <ChatInterface />
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};

export default AdminChatPage;
