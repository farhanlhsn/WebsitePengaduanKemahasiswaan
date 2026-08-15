import { io } from 'socket.io-client';
import { getAccessToken } from './authToken';

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

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const token = getAccessToken();

    this.socket = io(socketBaseUrl, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: false,
      auth: { token },
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.emit('connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.currentRoom = null;
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      const code = error.data?.code ?? 'AUTH_INVALID';
      this.emit('connectionError', { code, message: error.message });
    });

    this.socket.on('chat:message', (message) => {
      this.emit('chat:message', message);
    });

    this.socket.on('chat:read', (data) => {
      this.emit('chat:read', data);
    });

    this.socket.on('chat:message:deleted', (data) => {
      this.emit('chat:message:deleted', data);
    });

    this.socket.on('chat:list:update', (data) => {
      this.emit('chat:list:update', data);
    });

    this.socket.on('room:joined', (data) => {
      this.emit('room:joined', data);
    });

    this.socket.on('room:left', (data) => {
      this.emit('room:left', data);
    });

    this.socket.on('chat:typing', (data) => {
      this.emit('chat:typing', data);
    });

    this.socket.on('chat:error', (data) => {
      this.emit('chat:error', data);
      if (['AUTH_REVOKED', 'USER_DELETED', 'AUTH_INVALID'].includes(data?.code)) {
        this.disconnect();
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRoom = null;
      this.eventListeners.clear();
    }
  }

  joinRoom(reportId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        return reject({ code: 'NOT_CONNECTED', message: 'Socket not connected' });
      }

      this.socket.timeout(5000).emit('joinRoom', { reportId }, (err, result) => {
        if (err) {
          this.currentRoom = null;
          return reject({ code: 'TIMEOUT', message: 'Join room timeout' });
        }
        if (result?.ok) {
          this.currentRoom = result.roomId;
          resolve(result);
        } else {
          this.currentRoom = null;
          this.emit('roomJoinFailed', result);
          reject(result);
        }
      });
    });
  }

  leaveRoom(reportId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        return reject({ code: 'NOT_CONNECTED', message: 'Socket not connected' });
      }

      this.socket.timeout(5000).emit('leaveRoom', { reportId }, (err, result) => {
        if (err) return reject({ code: 'TIMEOUT', message: 'Leave room timeout' });
        this.currentRoom = null;
        resolve(result);
      });
    });
  }

  sendTypingIndicator(reportId, isTyping) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('chat:typing', { reportId, isTyping });
  }

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

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  isSocketConnected() {
    return this.socket && this.isConnected;
  }

  getCurrentRoom() {
    return this.currentRoom;
  }

  getSocketId() {
    return this.socket?.id || null;
  }
}

const socketService = new SocketService();

export default socketService;
