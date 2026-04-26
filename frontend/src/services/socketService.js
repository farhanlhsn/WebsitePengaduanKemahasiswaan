import { io } from 'socket.io-client';

const apiBaseUrl = import.meta.env.VITE_API_URL;
const socketBaseUrl = import.meta.env.VITE_SOCKET_URL
  || (apiBaseUrl ? apiBaseUrl.replace(/\/v1\/api\/?$/, '') : 'http://localhost:6060');

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentRoom = null;
    this.eventListeners = new Map();
  }

  // Initialize socket connection
  connect(userId) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(socketBaseUrl, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: false
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server:', this.socket.id);
      this.isConnected = true;
      this.emit('connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason);
      this.isConnected = false;
      this.currentRoom = null;
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('connectionError', { error });
    });

    // Chat event handlers
    this.socket.on('newMessage', (message) => {
      this.emit('newMessage', message);
    });

    this.socket.on('messagesRead', (data) => {
      this.emit('messagesRead', data);
    });

    this.socket.on('messageDeleted', (data) => {
      this.emit('messageDeleted', data);
    });

    this.socket.on('userJoined', (data) => {
      this.emit('userJoined', data);
    });

    this.socket.on('userLeft', (data) => {
      this.emit('userLeft', data);
    });

    this.socket.on('userTyping', (data) => {
      this.emit('userTyping', data);
    });

    this.socket.on('messageReadReceipt', (data) => {
      this.emit('messageReadReceipt', data);
    });

    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRoom = null;
      this.eventListeners.clear();
    }
  }

  // Join a chat room
  joinRoom(reportId, userId) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    const roomData = { reportId, userId };
    this.socket.emit('joinRoom', roomData);
    this.currentRoom = `report_${reportId}`;
    
    console.log(`Joining room: report_${reportId}`);
  }

  // Leave current room
  leaveRoom(reportId, userId) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return;
    }

    const roomData = { reportId, userId };
    this.socket.emit('leaveRoom', roomData);
    this.currentRoom = null;
    
    console.log(`Leaving room: report_${reportId}`);
  }

  // Send typing indicator
  sendTypingIndicator(reportId, userId, isTyping) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('typing', { reportId, userId, isTyping });
  }

  // Send message read receipt
  sendMessageReadReceipt(reportId, messageId, userId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('messageRead', { reportId, messageId, userId });
  }

  // Event listener management
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  // Emit custom events to registered listeners
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Check connection status
  isSocketConnected() {
    return this.socket && this.isConnected;
  }

  // Get current room
  getCurrentRoom() {
    return this.currentRoom;
  }

  // Get socket ID
  getSocketId() {
    return this.socket?.id || null;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService; 