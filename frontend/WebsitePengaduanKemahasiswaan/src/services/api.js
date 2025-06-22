import axios from 'axios';
import { getOrCreateDeviceFingerprint } from '../main';

const API_BASE_URL = 'http://localhost:6060/v1/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Enable cookies
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const fingerprint = getOrCreateDeviceFingerprint();
  config.headers['X-Device-Fingerprint'] = fingerprint;
  return config;
});

// Response interceptor for error handling and auto-refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't try to refresh token if:
    // 1. Already tried (_retry flag)
    // 2. Request is to login endpoint
    // 3. Request is to refresh-token endpoint  
    // 4. Response is not 401
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshResponse = await apiClient.post('/auth/refresh-token');
        const { accessToken } = refreshResponse.data;
        
        // Update localStorage and retry original request
        localStorage.setItem('token', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        localStorage.removeItem('token');
        
        // Only redirect if we're not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const registerStudent = async (userData) => {
  const response = await apiClient.post('/auth/registerStudent', userData);
  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

export const refreshToken = async () => {
  // Refresh token is sent automatically via httpOnly cookie
  const response = await apiClient.post('/auth/refresh-token');
  return response.data;
};

export const getUserDevices = async () => {
  const response = await apiClient.get('/auth/devices');
  return response.data.data;
};

export const logoutDevice = async (deviceId) => {
  const response = await apiClient.delete(`/auth/devices/${deviceId}`);
  return response.data;
};

export const logoutAllOtherDevices = async () => {
  const response = await apiClient.post('/auth/logout-other-devices');
  return response.data;
};

// ==================== REPORTS API ====================

export const createReport = async (reportData) => {
  // Check if reportData is FormData (contains files) or regular object
  const isFormData = reportData instanceof FormData;
  
  const response = await apiClient.post('/reports', reportData, {
    headers: {
      'Content-Type': isFormData ? 'multipart/form-data' : 'application/json'
    }
  });
  return response.data.data;
};

export const getUserReports = async (filters = {}, lastItemId = null, limit = 10) => {
  const params = new URLSearchParams({
    limit: limit.toString()
  });
  
  // Add filters to params
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      params.append(key, filters[key]);
    }
  });
  
  // Add lastItemId for pagination
  if (lastItemId) {
    params.append('lastItemId', lastItemId);
  }
  
  const response = await apiClient.get(`/reports/user?${params}`);
  return response.data.data;
};

export const getAllReports = async (filters = {}, lastItemId = null, limit = 10) => {
  const params = new URLSearchParams({
    limit: limit.toString()
  });
  
  // Add filters to params
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      params.append(key, filters[key]);
    }
  });
  
  // Add lastItemId for pagination
  if (lastItemId) {
    params.append('lastItemId', lastItemId);
  }
  
  const response = await apiClient.get(`/reports?${params}`);
  return response.data.data;
};

export const getReportById = async (reportId) => {
  const response = await apiClient.get(`/reports/${reportId}`);
  return response.data.data;
};

export const updateReportStatus = async (reportId, status) => {
  const response = await apiClient.patch(`/reports/${reportId}/status`, { status });
  return response.data.data;
};

export const uploadAttachments = async (reportId, files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  const response = await apiClient.post(`/reports/${reportId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.attachments;
};

export const deleteReport = async (reportId) => {
  const response = await apiClient.delete(`/reports/${reportId}`);
  return response.data.data;
};

export const restoreReport = async (reportId) => {
  const response = await apiClient.post(`/reports/${reportId}/restore`);
  return response.data.data;
};

// ==================== CATEGORIES API ====================

export const getCategories = async (includeDeleted = false) => {
  const params = includeDeleted ? '?includeDeleted=true' : '';
  const response = await apiClient.get(`/categories${params}`);
  return response.data.data;
};

export const searchCategories = async (query, includeDeleted = false) => {
  const params = new URLSearchParams({ q: query });
  if (includeDeleted) params.append('includeDeleted', 'true');
  const response = await apiClient.get(`/categories/search?${params}`);
  return response.data.data;
};

export const getCategoryBySlug = async (slug, includeDeleted = false) => {
  const params = includeDeleted ? '?includeDeleted=true' : '';
  const response = await apiClient.get(`/categories/slug/${slug}${params}`);
  return response.data.data;
};

export const getCategoryById = async (categoryId, includeDeleted = false) => {
  const params = includeDeleted ? '?includeDeleted=true' : '';
  const response = await apiClient.get(`/categories/${categoryId}${params}`);
  return response.data.data;
};

export const getCategoryStats = async () => {
  const response = await apiClient.get('/categories/stats');
  return response.data.data;
};

export const getCategoriesWithReports = async (includeDeleted = false) => {
  const params = includeDeleted ? '?includeDeleted=true' : '';
  const response = await apiClient.get(`/categories/with-reports${params}`);
  return response.data.data;
};

// ==================== USERS API ====================

export const getUserByEmail = async (email) => {
  const response = await apiClient.get(`/users/search/${email}`);
  return response.data.data;
};

export const getUserById = async (userId, includeDeleted = false) => {
  const params = includeDeleted ? '?includeDeleted=true' : '';
  const response = await apiClient.get(`/users/${userId}${params}`);
  return response.data.data;
};

export const getUserStats = async () => {
  const response = await apiClient.get('/users/stats');
  return response.data.data;
};

export const updateUser = async (userId, userData) => {
  const response = await apiClient.put(`/users/${userId}`, userData);
  return response.data.data;
};

// Admin-specific user management APIs
export const getAllUsers = async (includeDeleted = false) => {
  const params = includeDeleted ? '?includeDeleted=true' : '';
  const response = await apiClient.get(`/users${params}`);
  return response.data.data;
};

export const verifyStudent = async (userId) => {
  const response = await apiClient.put(`/users/verify/${userId}`);
  return response.data.data;
};

export const deleteUser = async (userId) => {
  const response = await apiClient.delete(`/users/${userId}`);
  return response.data.data;
};

export const restoreUser = async (userId) => {
  const response = await apiClient.post(`/users/${userId}/restore`);
  return response.data.data;
};

export const permanentDeleteUser = async (userId) => {
  const response = await apiClient.delete(`/users/${userId}/permanent`);
  return response.data.data;
};

export const cleanupOldDeletedUsers = async (daysOld = 90) => {
  const response = await apiClient.post(`/users/cleanup?daysOld=${daysOld}`);
  return response.data.data;
};
