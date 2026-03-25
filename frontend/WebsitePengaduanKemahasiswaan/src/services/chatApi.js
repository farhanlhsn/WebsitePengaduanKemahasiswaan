import axios from 'axios';
import { getOrCreateDeviceFingerprint } from '../main';

// Use VITE_API_URL from .env or fall back to localhost:6060
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:6060/v1/api',
  timeout: 10000,
  withCredentials: true,
});

// Add request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const fingerprint = getOrCreateDeviceFingerprint();
  config.headers['X-Device-Fingerprint'] = fingerprint;
  return config;
});

class ChatApi {
  // Get reports with messages (chat list)
  async getReportsWithMessages(page = 1, limit = 20) {
    try {
      const response = await api.get('/chat/reports', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get messages for a specific report
  async getMessages(reportId, page = 1, limit = 50) {
    try {
      const response = await api.get(`/chat/reports/${reportId}/messages`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Send a message to a specific report
  async sendMessage(reportId, content, attachments = []) {
    try {
      const response = await api.post(`/chat/reports/${reportId}/messages`, {
        content,
        attachments
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mark messages as read for a specific report
  async markMessagesAsRead(reportId) {
    try {
      const response = await api.patch(`/chat/reports/${reportId}/messages/read`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get unread message count
  async getUnreadCount() {
    try {
      const response = await api.get('/chat/unread-count');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Join chat room (verify access)
  async joinRoom(reportId) {
    try {
      const response = await api.post(`/chat/reports/${reportId}/join`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete a message
  async deleteMessage(messageId) {
    try {
      const response = await api.delete(`/chat/messages/${messageId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Upload a chat attachment file
  async uploadFile(file) {
    try {
      const formData = new FormData();
      // The upload route expects 'files' field
      formData.append('files', file);
      // POST to chat upload endpoint
      const response = await api.post(
        '/chat/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      // ResponseFormatter.success wraps actual data in .data
      return response.data.data.attachments;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other error
      return new Error('An unexpected error occurred');
    }
  }
}

// Create singleton instance
const chatApi = new ChatApi();

export default chatApi; 