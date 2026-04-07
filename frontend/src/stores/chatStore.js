// src/stores/chatStore.js

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import chatApi from '../services/chatApi';
import socketService from '../services/socketService';
import useAuthStore from './authStore'; // We need the user ID

const useChatStore = create(
  devtools(
    (set, get) => ({
      // State
      reports: [],
      currentReport: null,
      messages: [],
      unreadCount: 0,
      isLoading: false, // For list loading
      isMessagesLoading: false, // For messages loading specifically
      isConnected: false,
      typingUsers: new Set(),
      onlineUsers: new Set(),
      
      // Pagination
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
      },
      
      // Error handling
      error: null,
      
      // Actions
      
      // **FIXED**: Initialize chat (connect socket and load data)
      initialize: () => {
        // Prevent multiple initializations
        if (get().isConnected) return;
        
        const { id: userId } = useAuthStore.getState().user;
        if (!userId) {
          console.error("Chat Store: Cannot initialize without user ID.");
          return;
        }
        // Deduplicate incoming newMessage events to avoid double-counting
        const processedNewMessageIds = new Set();

        try {
          // Connect to socket
          socketService.connect(userId);
          
          // Setup socket event listeners
          socketService.on('connected', () => {
            set({ isConnected: true });
            // Re-join room if a report is selected
            const { currentReport } = get();
            if (currentReport) {
              socketService.joinRoom(currentReport.id, currentReport.userId);
            }
          });
          
          socketService.on('disconnected', () => {
            set({ isConnected: false });
          });
          
          socketService.on('newMessage', (message) => {
            // Ignore duplicates from multiple broadcasts
            if (processedNewMessageIds.has(message.id)) return;
            processedNewMessageIds.add(message.id);
            const { currentReport, messages } = get();

            // Refresh chat list to fetch accurate lastMessage and unread counts
            get().getReportsWithMessages();

            // Append to active chat if open
            if (currentReport && message.reportId === currentReport.id) {
              const safeMessages = Array.isArray(messages) ? messages : [];
              if (!safeMessages.some(m => m.id === message.id)) {
                set({ messages: [...safeMessages, message] });
                // Mark read in backend and reset unread
                get().markMessagesAsRead(currentReport.id);
              }
            }
          });
          
          socketService.on('messagesRead', ({ reportId, userId }) => {
            const { messages, currentReport } = get();
            if (!messages || !Array.isArray(messages) || currentReport?.id !== reportId) return;
            
            // Mark messages sent by the current user as read by the other party
            const updatedMessages = messages.map(msg => 
              msg.senderId === useAuthStore.getState().user.id 
                ? { ...msg, status: 'read', isRead: true } 
                : msg
            );
            set({ messages: updatedMessages });
          });
          
          // **FIXED**: This listener now works because initialize is called
          socketService.on('messageDeleted', ({ messageId }) => {
            const { messages } = get();
            if (!messages || !Array.isArray(messages)) return;
            
            const updatedMessages = messages.filter(msg => msg.id !== messageId);
            set({ messages: updatedMessages });
          });
          
          // Other listeners... (typing, userJoined, etc. remain the same)
          
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      cleanup: () => {
        socketService.disconnect();
        set({ 
          isConnected: false, 
          currentReport: null, 
          messages: [], 
          typingUsers: new Set(),
          onlineUsers: new Set()
        });
      },
      
      getReportsWithMessages: async (page = 1, limit = 20) => {
        try {
          set({ isLoading: true, error: null });
          const response = await chatApi.getReportsWithMessages(page, limit);
          if (response.status === 'success') {
            set({ reports: response.data.reports, pagination: response.data.pagination });
          }
        } catch (error) {
          set({ error: error.message, reports: [] }); // Clear reports on error
        } finally {
          set({ isLoading: false });
        }
      },
      
      // **FIXED**: Select report logic
      selectReport: async (report) => {
        const { currentReport } = get();
        // Prevent re-selecting the same report
        if (currentReport?.id === report.id) return;

        try {
          // Use a specific loading state for the message panel
          set({ isMessagesLoading: true, error: null, currentReport: report, messages: [] });
          
          // Leave old room and join new one
          if (currentReport) {
            socketService.leaveRoom(currentReport.id, currentReport.userId);
          }
          await chatApi.joinRoom(report.id);
          socketService.joinRoom(report.id, report.userId);
          
          // Fetch messages for the new report
          await get().getMessages(report.id);
          
          // Mark messages as read and update the report list
          await get().markMessagesAsRead(report.id);
          get().updateReportInList(report.id, { unreadCount: 0 });

        } catch (error) {
          set({ error: error.message });
        } finally {
          set({ isMessagesLoading: false });
        }
      },
      
      getMessages: async (reportId, page = 1, limit = 50) => {
        try {
          const response = await chatApi.getMessages(reportId, page, limit);
          if (response.status === 'success') {
            const { messages, pagination } = response.data;
            set({ messages: messages.reverse(), pagination }); // Assuming API returns latest first, reverse for display
          }
        } catch (error) {
          set({ error: error.message, messages: [] });
        }
      },
      
      sendMessage: async (content, attachments = []) => {
        const { currentReport } = get();
        if (!currentReport) throw new Error('No report selected');

        try {
          set({ error: null });
          // The socket 'newMessage' event will handle adding the message to the state.
          // This avoids duplicate messages.
          await chatApi.sendMessage(currentReport.id, content, attachments);
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },
      
      // **FIXED**: markMessagesAsRead with better error handling
      markMessagesAsRead: async (reportId) => {
        try {
          // Make the API call first.
          await chatApi.markMessagesAsRead(reportId);
          
          // On success, update local state. No optimistic update needed here
          // as it's a background task, but we'll still update UI.
          const { messages } = get();
          if (messages && Array.isArray(messages)) {
            const updatedMessages = messages.map(msg => ({ ...msg, isRead: true, status: 'read' }));
            set({ messages: updatedMessages });
          }
          get().getUnreadCount();
        } catch (error) {
          // If the API call fails, we log it but don't change the UI state.
          console.error('Failed to mark messages as read:', error);
          // Optionally set an error state: set({ error: 'Could not update read status.' });
        }
      },
      
      getUnreadCount: async () => { /* ... no changes needed ... */ },
      
      // **FIXED**: deleteMessage with optimistic update
      deleteMessage: async (messageId) => {
        const { messages } = get();
        // Find the message to delete and store the original messages array
        const originalMessages = [...messages];
        const updatedMessages = originalMessages.filter(msg => msg.id !== messageId);

        // Optimistically update the UI
        set({ messages: updatedMessages, error: null });

        try {
          // Make the API call
          await chatApi.deleteMessage(messageId);
          // If successful, the backend should emit a 'messageDeleted' event
          // which will confirm the state for other users. Our state is already correct.
        } catch (error) {
          // If the API call fails, revert the state and show an error
          set({ messages: originalMessages, error: "Failed to delete message. Please try again." });
          throw error;
        }
      },
      
      // Helper to update a single report in the list (e.g., for last message)
      updateReportInList: (reportId, updates) => {
        set(state => {
          const safeReports = Array.isArray(state.reports) ? state.reports : [];
          return {
            reports: safeReports.map(r =>
              r.id === reportId ? { ...r, ...updates } : r
            )
          };
        });
      },

      clearError: () => set({ error: null }),

      // Send typing indicator to other participants in the room
      sendTypingIndicator: (isTyping) => {
        const { currentReport } = get();
        const { id: userId } = useAuthStore.getState().user || {};
        if (!currentReport || !userId) return;

        try {
          socketService.sendTypingIndicator(currentReport.id, userId, isTyping);
        } catch (err) {
          console.error('Failed to send typing indicator:', err);
        }
      },

      // ... other functions like sendTypingIndicator, reset, etc.
    }),
    { name: 'chat-store' }
  )
);

export default useChatStore;