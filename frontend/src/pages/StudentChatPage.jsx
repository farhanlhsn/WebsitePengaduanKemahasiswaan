// src/pages/StudentChatPage.js

import React, { useEffect, Suspense } from 'react';
import { Box, Grid, IconButton, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import useChatStore from '../stores/chatStore';
import useReportStore from '../stores/reportStore';
import useAuthStore from '../stores/authStore'; // Import auth store

// Lazy load chat components to keep bundle small
const ChatList = React.lazy(() => import('../components/chat/ChatList'));
const ChatInterface = React.lazy(() => import('../components/chat/ChatInterface'));
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function StudentChatPage() {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const { user } = useAuthStore(); // Get user state
  // Select individual pieces from the zustand store to keep their references
  // stable between renders and avoid triggering effects on every update.
  const reports = useChatStore((state) => state.reports);
  const getReportsWithMessages = useChatStore((state) => state.getReportsWithMessages);
  const selectReport = useChatStore((state) => state.selectReport);
  const initialize = useChatStore((state) => state.initialize);
  const { getReportById } = useReportStore();

  // Establish socket connection once when the user ID is available.
  // We intentionally do NOT call `cleanup()` on unmount so the socket
  // remains connected while navigating between different chat routes
  // (e.g. /dashboard/chat → /dashboard/chat/:reportId).
  useEffect(() => {
    if (user?.id) {
      initialize();
    }
    // We leave the connection open; it can be cleaned up on logout or app unload.
  }, [user?.id, initialize]);

  // Auto-select report based on route param
  useEffect(() => {
    // Make sure we have reports loaded before trying to select one
    if (!reports?.length) {
        getReportsWithMessages();
        return; // The effect will re-run when reports are populated
    }

    const init = async () => {
      if (!reportId) return;

      let rpt = reports.find(r => String(r.id) === String(reportId));

      // Fallback to fetching the report individually if not in the list
      if (!rpt) {
        try {
          rpt = await getReportById(reportId);
        } catch (err) {
          console.error('Failed to load report by id:', err);
        }
      }

      if (rpt) {
        try {
          await selectReport(rpt);
        } catch (err) {
          console.error('Failed to select report:', err);
        }
      }
    };
    init();
  // IMPORTANT: We remove most dependencies to control this flow better.
  // It should run when reportId changes or when reports are first loaded.
  }, [reportId, reports, getReportById, selectReport, getReportsWithMessages]);

  return (
    <Suspense fallback={<LoadingSpinner fullScreen message="Memuat chat..." />}> 
      <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: '#f8f9fa' }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight={700}>Chat & Komunikasi</Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Adjusted width for better layout on larger screens */}
          <Grid size={{ xs: 12, md: 4, lg: 3 }}>
            <ChatList onReportSelect={(r) => navigate(`/dashboard/chat/${r.id}`)} />
          </Grid>
          <Grid size={{ xs: 12, md: 8, lg: 9 }}>
            <ChatInterface />
          </Grid>
        </Grid>
      </Box>
    </Suspense>
  );
}