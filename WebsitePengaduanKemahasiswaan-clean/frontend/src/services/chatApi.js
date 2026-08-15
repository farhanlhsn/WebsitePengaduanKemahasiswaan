import { apiClient } from './axiosClient';

class ChatApi {
  async getReportsWithMessages(page = 1, limit = 20) {
    try {
      const response = await apiClient.get('/chat/reports', { params: { page, limit } });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getMessages(reportId, page = 1, limit = 50) {
    try {
      const response = await apiClient.get(`/chat/reports/${reportId}/messages`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async sendMessage(reportId, content, attachmentTokens = [], replyToId = null) {
    try {
      const payload = { content, attachmentTokens };
      if (replyToId) payload.replyToId = replyToId;

      const response = await apiClient.post(`/chat/reports/${reportId}/messages`, payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async markMessagesAsRead(reportId) {
    try {
      const response = await apiClient.patch(`/chat/reports/${reportId}/messages/read`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUnreadCount() {
    try {
      const response = await apiClient.get('/chat/unread-count');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteMessage(messageId) {
    try {
      const response = await apiClient.delete(`/chat/messages/${messageId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async uploadFile(reportId, file) {
    try {
      const formData = new FormData();
      formData.append('files', file);
      const response = await apiClient.post(
        `/chat/reports/${reportId}/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data.data.attachments;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || 'An error occurred';
      const err = new Error(message);
      err.code = error.response.data?.code;
      return err;
    }
    if (error.request) {
      return new Error('Network error. Please check your connection.');
    }
    return new Error('An unexpected error occurred');
  }
}

const chatApi = new ChatApi();

export default chatApi;
