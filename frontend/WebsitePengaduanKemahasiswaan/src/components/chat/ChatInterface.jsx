import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, IconButton, Avatar, Chip,
  List, ListItem, ListItemAvatar, ListItemText, Divider,
  Badge, Menu, MenuItem, Tooltip, Stack, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import {
  Send, AttachFile, MoreVert, Reply, Forward, Delete,
  Check, DoneAll, Schedule, Person, AdminPanelSettings,
  Close, Image, Description, GetApp
} from '@mui/icons-material';
import { styled, alpha, useTheme } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import useChatStore from '../../stores/chatStore';
import useAuthStore from '../../stores/authStore';
import chatApi from '../../services/chatApi';

const ChatContainer = styled(Paper)(({ theme }) => ({
  height: '600px',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.05)} 0%, 
    ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(1),
  backgroundColor: alpha(theme.palette.background.default, 0.3),
  
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

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOwn' && prop !== 'isAdmin'
})(({ theme, isOwn, isAdmin }) => ({
  maxWidth: '70%',
  padding: theme.spacing(1.5, 2),
  borderRadius: 18,
  marginBottom: theme.spacing(1),
  position: 'relative',
  wordBreak: 'break-word',
  
  backgroundColor: isOwn 
    ? theme.palette.primary.main
    : isAdmin 
      ? alpha(theme.palette.secondary.main, 0.1)
      : alpha(theme.palette.grey[100], 0.8),
  
  color: isOwn 
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    width: 0,
    height: 0,
    border: '8px solid transparent',
    
    ...(isOwn ? {
      right: -8,
      top: '50%',
      transform: 'translateY(-50%)',
      borderLeftColor: theme.palette.primary.main,
    } : {
      left: -8,
      top: '50%',
      transform: 'translateY(-50%)',
      borderRightColor: isAdmin 
        ? alpha(theme.palette.secondary.main, 0.1)
        : alpha(theme.palette.grey[100], 0.8),
    }),
  },
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  alignItems: 'flex-end',
  gap: theme.spacing(1),
}));

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'sent':
      return <Check fontSize="small" sx={{ color: 'text.secondary' }} />;
    case 'delivered':
      return <DoneAll fontSize="small" sx={{ color: 'text.secondary' }} />;
    case 'read':
      return <DoneAll fontSize="small" sx={{ color: 'primary.main' }} />;
    default:
      return <Schedule fontSize="small" sx={{ color: 'text.disabled' }} />;
  }
};

// Determine backend base for uploads by removing '/v1/api' from API URL
const BACKEND_UPLOAD_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/v1\/api\/?$/,'')
  : 'http://localhost:6060';

const ChatInterface = ({ 
  placeholder = false
}) => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { 
    currentReport, 
    messages = [],
    isMessagesLoading, 
    error, 
    sendMessage, 
    deleteMessage,
    sendTypingIndicator,
    clearError
  } = useChatStore();
  
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    if (!currentReport) return;

    try {
      let attachments = [];
      if (selectedFile) {
        // Upload the selected file first
        const uploaded = await chatApi.uploadFile(selectedFile);
        // uploaded is an array of attachment objects
        attachments = uploaded.map(att => ({
          fileName: att.fileName,
          fileType: att.fileType,
          filePath: att.filePath,
        }));
      }

      await sendMessage(newMessage.trim(), attachments);
      setNewMessage('');
      setSelectedFile(null);
      
      // Stop typing indicator
      if (isTyping) {
        sendTypingIndicator(false);
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicator
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTypingIndicator(false);
      }
    }, 1000);
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleMenuOpen = (event, message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };

  const formatMessageTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: id 
    });
  };

  const renderFileAttachment = (attachment) => {
    const isImage = attachment.fileType?.startsWith('image/');
    
    return (
      <Box
        sx={{
          mt: 1,
          p: 1.5,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: alpha(theme.palette.background.paper, 0.9),
          }
        }}
        onClick={() => {
          setPreviewFile(attachment);
          setFilePreviewOpen(true);
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          {isImage ? <Image fontSize="small" /> : <Description fontSize="small" />}
          <Typography variant="body2" sx={{ flex: 1 }}>
            {attachment.fileName}
          </Typography>
          <IconButton size="small">
            <GetApp fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
    );
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
      handleMenuClose();
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  // Get current data
  const reportId = currentReport?.registrationNumber;
  const reportTitle = currentReport?.title || '';
  const loading = isMessagesLoading; 
  const currentUser = user;

  // Placeholder state
  if (placeholder || !currentReport) {
    return (
      <ChatContainer>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          p: 4,
          textAlign: 'center'
        }}>
          <AdminPanelSettings sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Chat Interface
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pilih laporan untuk memulai komunikasi dengan pelapor
          </Typography>
          <Alert severity="info" sx={{ mt: 3, maxWidth: 400 }}>
            <Typography variant="body2">
              Pilih laporan dari daftar chat untuk memulai atau melanjutkan percakapan
              dengan {user?.role === 'ADMIN' ? 'pelapor' : 'admin'}.
            </Typography>
          </Alert>
        </Box>
      </ChatContainer>
    );
  }

  return (
    <ChatContainer>
      {/* Chat Header */}
      <ChatHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {reportTitle || `Laporan #${reportId}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Laporan: {reportId}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={messages?.filter(m => !m.isRead).length || 0} color="error">
            <IconButton size="small">
              <MoreVert />
            </IconButton>
          </Badge>
        </Box>
      </ChatHeader>

      {/* Messages */}
      <MessagesContainer>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : !messages || messages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center'
          }}>
            <Typography variant="body2" color="text.secondary">
              Belum ada pesan dalam percakapan ini
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Mulai komunikasi dengan mengirim pesan pertama
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2} sx={{ p: 2 }}>
            {error && (
              <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {messages?.map((message, index) => {
              const isOwn = message.senderId === currentUser?.id;
              const isAdmin = message.sender?.role === 'ADMIN';
              const showAvatar = index === 0 || 
                messages?.[index - 1]?.senderId !== message.senderId;
              
              return (
                <Box key={message.id}>
                  {showAvatar && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 1,
                      justifyContent: isOwn ? 'flex-end' : 'flex-start'
                    }}>
                      {!isOwn && (
                        <Avatar sx={{ 
                          width: 24, 
                          height: 24, 
                          bgcolor: isAdmin ? 'secondary.main' : 'primary.light'
                        }}>
                          {isAdmin ? <AdminPanelSettings fontSize="small" /> : <Person fontSize="small" />}
                        </Avatar>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {message.sender?.name}
                        {isAdmin && (
                          <Chip 
                            label="Admin" 
                            size="small" 
                            color="secondary" 
                            sx={{ ml: 1, height: 16, fontSize: '0.6rem' }}
                          />
                        )}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: 1
                  }}>
                    <MessageBubble isOwn={isOwn} isAdmin={isAdmin}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {message.content}
                      </Typography>
                      
                      {message.attachments?.map((attachment) => 
                        renderFileAttachment(attachment)
                      )}
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        mt: 0.5,
                        gap: 1
                      }}>
                        <Typography variant="caption" sx={{ 
                          opacity: 0.8,
                          fontSize: '0.7rem'
                        }}>
                          {formatMessageTime(message.createdAt)}
                        </Typography>
                        
                        {isOwn && (
                          <StatusIcon status={message.status || 'sent'} />
                        )}
                      </Box>
                    </MessageBubble>
                    
                    <IconButton 
                      size="small" 
                      sx={{ opacity: 0.5 }}
                      onClick={(e) => handleMenuOpen(e, message)}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </Stack>
        )}
      </MessagesContainer>

      {/* Input Area */}
      <InputContainer>
        {selectedFile && (
          <Box sx={{ 
            position: 'absolute', 
            bottom: '100%', 
            left: 0, 
            right: 0,
            p: 2,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <AttachFile fontSize="small" />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {selectedFile.name}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => setSelectedFile(null)}
              >
                <Close fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        )}
        
        <IconButton 
          onClick={() => fileInputRef.current?.click()}
          sx={{ alignSelf: 'flex-end', mb: 0.5 }}
        >
          <AttachFile />
        </IconButton>
        
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Ketik pesan..."
          variant="outlined"
          size="small"
          disabled={!currentReport}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            }
          }}
        />
        
        <IconButton 
          onClick={handleSendMessage}
          disabled={!newMessage.trim() && !selectedFile}
          color="primary"
          sx={{ 
            alignSelf: 'flex-end', 
            mb: 0.5,
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&:disabled': {
              bgcolor: 'grey.300',
              color: 'grey.500',
            }
          }}
        >
          <Send />
        </IconButton>
        
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx"
        />
      </InputContainer>

      {/* Message Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <Reply fontSize="small" sx={{ mr: 1 }} />
          Balas
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Forward fontSize="small" sx={{ mr: 1 }} />
          Teruskan
        </MenuItem>
        <MenuItem onClick={() => handleDeleteMessage(selectedMessage?.id)}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Hapus
        </MenuItem>
      </Menu>

      {/* File Preview Dialog */}
      <Dialog 
        open={filePreviewOpen} 
        onClose={() => setFilePreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Preview File
        </DialogTitle>
        <DialogContent>
          {previewFile && (
            <Box sx={{ textAlign: 'center' }}>
              {previewFile.fileType?.startsWith('image/') ? (
                <img 
                  src={`${BACKEND_UPLOAD_URL}${previewFile.filePath}`} 
                  alt={previewFile.fileName}
                  style={{ maxWidth: '100%', maxHeight: '400px' }}
                />
              ) : (
                <Box sx={{ p: 4 }}>
                  <Description sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6">{previewFile.fileName}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilePreviewOpen(false)}>
            Tutup
          </Button>
          {previewFile && (
            <Button 
              variant="contained" 
              startIcon={<GetApp />} 
              component="a"
              href={`${BACKEND_UPLOAD_URL}${previewFile.filePath}`} 
              download={previewFile.fileName}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </ChatContainer>
  );
};

export default ChatInterface;