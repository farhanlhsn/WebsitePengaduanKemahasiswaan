// src/stores/chatStore.js

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import chatApi from '../services/chatApi';
import socketService from '../services/socketService';
import useAuthStore from './authStore'; // We need the user ID

// ── Typing indicator: timer per pengguna (level modul, di luar store) ────────
// Event `chat:typing` dari backend hanya berisi { userId, isTyping, timestamp }
// dan dikirim per-room, jadi indikator dibersihkan otomatis setelah ~3 detik
// jika tidak ada event typing lanjutan.
const TYPING_TIMEOUT_MS = 3000;
const typingTimeouts = new Map(); // kunci: `${reportId}:${userId}` -> id timeout

function clearTypingTimeout(key) {
  const timer = typingTimeouts.get(key);
  if (timer) {
    clearTimeout(timer);
    typingTimeouts.delete(key);
  }
}

function clearAllTypingTimeouts() {
  typingTimeouts.forEach((timer) => clearTimeout(timer));
  typingTimeouts.clear();
}

const useChatStore = create(
  devtools(
    (set, get) => ({
      // State
      reports: [],
      currentReport: null,
      messages: [],
      unreadCount: 0,
      totalUnread: 0, // total pesan belum dibaca di semua laporan (badge sidebar)
      isLoading: false, // For list loading
      isMessagesLoading: false, // For messages loading specifically
      isConnected: false,
      // { [reportId]: Array<userId|'reporter'> } — userId berupa angka, atau
      // pseudonim 'reporter' untuk pelapor pada laporan anonim.
      typingUsers: {},
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
          socketService.connect();
          
          socketService.on('connected', () => {
            set({ isConnected: true });
            // Ambil total pesan belum dibaca untuk badge di sidebar
            get().getUnreadCount();
            const { currentReport } = get();
            if (currentReport) {
              socketService.joinRoom(currentReport.id).catch((err) => {
                set({ error: err.message || 'Gagal bergabung ke room chat.' });
              });
            }
          });
          
          socketService.on('disconnected', () => {
            clearAllTypingTimeouts();
            set({ isConnected: false, typingUsers: {} });
          });

          socketService.on('roomJoinFailed', (err) => {
            set({ error: err.message || 'Akses chat ditolak.', currentReport: null });
          });

          socketService.on('chat:error', (err) => {
            if (err?.code === 'ACCESS_DENIED' || err?.code === 'ROOM_NOT_JOINED') {
              set({ error: err.message || 'Akses chat ditolak.' });
            }
          });

          socketService.on('chat:list:update', () => {
            get().getReportsWithMessages();
            get().getUnreadCount();
          });
          
          socketService.on('chat:message', (message) => {
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
                // Enrich replyTo data if message has replyToId but missing replyTo details
                let enrichedMessage = message;
                if (message.replyToId && !message.replyTo) {
                  const originalMsg = safeMessages.find(m => m.id === message.replyToId);
                  if (originalMsg) {
                    enrichedMessage = {
                      ...message,
                      replyTo: {
                        id: originalMsg.id,
                        content: originalMsg.content,
                        sender: originalMsg.sender ? { name: originalMsg.sender.name } : null
                      }
                    };
                  }
                }
                set({ messages: [...safeMessages, enrichedMessage] });
                // Mark read in backend and reset unread
                get().markMessagesAsRead(currentReport.id);
              }
            }
          });
          
          socketService.on('chat:read', ({ reportId }) => {
            const { messages, currentReport } = get();
            if (!messages || !Array.isArray(messages) || currentReport?.id !== reportId) return;
            
            const updatedMessages = messages.map(msg => 
              msg.senderId === useAuthStore.getState().user.id 
                ? { ...msg, status: 'read', isRead: true } 
                : msg
            );
            set({ messages: updatedMessages });
          });
          
          socketService.on('chat:message:deleted', ({ messageId }) => {
            const { messages } = get();
            if (!messages || !Array.isArray(messages)) return;
            
            const updatedMessages = messages.filter(msg => msg.id !== messageId);
            set({ messages: updatedMessages });
          });
          
          // Indikator mengetik: payload { userId, isTyping, timestamp } dikirim
          // per-room (tanpa reportId), jadi reportId diturunkan dari room aktif.
          socketService.on('chat:typing', (data) => {
            const { userId, isTyping } = data || {};
            if (userId === null || userId === undefined) return;

            // Abaikan event typing milik sendiri (backend seharusnya tidak
            // mengirimnya ke pengirim, tapi tetap dijaga sebagai guard).
            const myId = useAuthStore.getState().user?.id;
            if (myId !== null && myId !== undefined && String(userId) === String(myId)) return;

            const roomMatch = /^report_(\d+)$/.exec(socketService.getCurrentRoom() || '');
            const reportId = roomMatch ? Number(roomMatch[1]) : get().currentReport?.id;
            if (!reportId) return;

            const key = `${reportId}:${userId}`;
            clearTypingTimeout(key);

            if (isTyping) {
              const currentTyping = get().typingUsers?.[reportId] || [];
              if (!currentTyping.includes(userId)) {
                set((state) => ({
                  typingUsers: {
                    ...(state.typingUsers || {}),
                    [reportId]: [...(state.typingUsers?.[reportId] || []), userId],
                  },
                }));
              }
              // Bersihkan otomatis bila tidak ada event lanjutan dalam ~3 detik
              typingTimeouts.set(
                key,
                setTimeout(() => {
                  typingTimeouts.delete(key);
                  get().removeTypingUser(reportId, userId);
                }, TYPING_TIMEOUT_MS)
              );
            } else {
              get().removeTypingUser(reportId, userId);
            }
          });
          
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      cleanup: () => {
        clearAllTypingTimeouts();
        socketService.disconnect();
        set({ 
          isConnected: false, 
          currentReport: null, 
          messages: [], 
          typingUsers: {},
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
          set({ isMessagesLoading: true, error: null, messages: [] });

          await socketService.joinRoom(report.id);
          set({ currentReport: report });

          await get().getMessages(report.id);
          await get().markMessagesAsRead(report.id);
          get().updateReportInList(report.id, { unreadCount: 0 });

        } catch (error) {
          set({
            error: error.message || 'Gagal bergabung ke chat laporan ini.',
            currentReport: null,
            messages: [],
          });
        } finally {
          set({ isMessagesLoading: false });
        }
      },
      
      getMessages: async (reportId, page = 1, limit = 50) => {
        try {
          const response = await chatApi.getMessages(reportId, page, limit);
          if (response.status === 'success') {
            const { messages, pagination } = response.data;
            
            // Build a lookup map from the fetched batch
            const msgMap = {};
            messages.forEach(m => { msgMap[m.id] = m; });

            // Enrich any message that has replyToId but null replyTo
            const enriched = messages.map(m => {
              if (m.replyToId && !m.replyTo) {
                const original = msgMap[m.replyToId];
                if (original) {
                  return {
                    ...m,
                    replyTo: {
                      id: original.id,
                      content: original.content,
                      sender: original.sender ? { name: original.sender.name } : null
                    }
                  };
                }
              }
              return m;
            });

            set({ messages: enriched, pagination });
          }
        } catch (error) {
          set({ error: error.message, messages: [] });
        }
      },
      
      sendMessage: async (content, attachmentTokens = [], replyToId = null) => {
        const { currentReport } = get();
        if (!currentReport) throw new Error('No report selected');

        try {
          set({ error: null });
          const result = await chatApi.sendMessage(currentReport.id, content, attachmentTokens, replyToId);
          
          // Use the API response directly to add the message with full replyTo data
          if (result.status === 'success' && result.data) {
            let newMsg = result.data;
            
            // Fallback: enrich replyTo from local messages if backend didn't include it
            if (replyToId && !newMsg.replyTo) {
              const currentMsgs = Array.isArray(get().messages) ? get().messages : [];
              const originalMsg = currentMsgs.find(m => m.id === replyToId);
              if (originalMsg) {
                newMsg = {
                  ...newMsg,
                  replyTo: {
                    id: originalMsg.id,
                    content: originalMsg.content,
                    sender: originalMsg.sender ? { name: originalMsg.sender.name } : null
                  }
                };
              }
            }
            
            // Replace existing (from socket) or append - ensures replyTo data is always present
            const currentMessages = Array.isArray(get().messages) ? get().messages : [];
            const existingIndex = currentMessages.findIndex(m => m.id === newMsg.id);
            if (existingIndex >= 0) {
              // Socket added it first without replyTo — replace with enriched version
              const updated = [...currentMessages];
              updated[existingIndex] = newMsg;
              set({ messages: updated });
            } else {
              set({ messages: [...currentMessages, newMsg] });
            }
          }
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
      
      // Ambil total pesan belum dibaca (untuk badge menu chat di sidebar)
      getUnreadCount: async () => {
        try {
          const response = await chatApi.getUnreadCount();
          if (response?.status === 'success') {
            const total = Number(response.data?.unreadCount) || 0;
            set({ totalUnread: total, unreadCount: total });
          }
        } catch (error) {
          // Non-fatal: badge hanya tidak ter-update
          console.error('Failed to fetch unread count:', error);
        }
      },
      
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
          // If successful, the backend emits 'chat:message:deleted' for other clients
          // which will confirm the state for other users. Our state is already correct.
        } catch (error) {
          // If the API call fails, revert the state and show an error
          set({ messages: originalMessages, error: "Gagal menghapus pesan. Silakan coba lagi." });
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
          socketService.sendTypingIndicator(currentReport.id, isTyping);
        } catch (err) {
          console.error('Failed to send typing indicator:', err);
        }
      },

      // Hapus pengguna dari daftar mengetik pada laporan tertentu
      removeTypingUser: (reportId, userId) => {
        const currentTyping = get().typingUsers?.[reportId] || [];
        if (!currentTyping.includes(userId)) return;
        set((state) => {
          const typingUsers = { ...(state.typingUsers || {}) };
          const remaining = (typingUsers[reportId] || []).filter((id) => id !== userId);
          if (remaining.length > 0) {
            typingUsers[reportId] = remaining;
          } else {
            delete typingUsers[reportId];
          }
          return { typingUsers };
        });
      },

      // ... other functions like sendTypingIndicator, reset, etc.
    }),
    { name: 'chat-store' }
  )
);

export default useChatStore;