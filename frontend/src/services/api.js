import { apiClient, refreshAccessToken } from './axiosClient';

// ==================== AUTH API ====================

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const registerStudent = async (userData, ktmFile) => {
  // Create FormData for multipart/form-data
  const formData = new FormData();

  // Add user data
  formData.append('name', userData.name);
  formData.append('email', userData.email);
  formData.append('password', userData.password);
  formData.append('nim', userData.nim);

  // Add KTM file if provided
  if (ktmFile) {
    formData.append('ktm', ktmFile);
  }

  // Fix H3: teruskan error axios apa adanya (tanpa dibungkus) agar `.response`
  // berisi pesan backend tetap bisa dibaca oleh caller.
  const response = await apiClient.post('/auth/registerStudent', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

export const refreshToken = async () => refreshAccessToken();

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

export const getReportById = async (reportId, includeDeleted = false) => {
  const params = includeDeleted ? '?includeDeleted=true' : '';
  const response = await apiClient.get(`/reports/${reportId}${params}`);
  return response.data.data;
};

export const updateReportStatus = async (reportId, status, reason = null) => {
  const response = await apiClient.patch(`/reports/${reportId}/status`, { status, ...(reason ? { reason } : {}) });
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

export const getReportStats = async () => {
  const response = await apiClient.get('/reports/stats');
  return response.data.data;
};

export const getUserStatsById = async (userId) => {
  const response = await apiClient.get(`/users/${userId}/stats`);
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

export const createCategory = async (categoryData) => {
  const response = await apiClient.post('/categories', categoryData);
  return response.data.data;
};

export const updateCategory = async (categoryId, categoryData) => {
  const response = await apiClient.put(`/categories/${categoryId}`, categoryData);
  return response.data.data;
};

export const deleteCategory = async (categoryId) => {
  const response = await apiClient.delete(`/categories/${categoryId}`);
  return response.data.data;
};

export const restoreCategory = async (categoryId) => {
  const response = await apiClient.post(`/categories/${categoryId}/restore`);
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

export const updateProfile = async (userData) => {
  const response = await apiClient.put(`/users/profile/me`, userData);
  return response.data.data;
};

export const getMyPreferences = async () => {
  const response = await apiClient.get('/users/preferences/me');
  return response.data.data;
};

export const updateMyPreferences = async (preferences) => {
  const response = await apiClient.put('/users/preferences/me', preferences);
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

export const getUnverifiedStudents = async () => {
  const response = await apiClient.get('/users/unverified/students');
  return response.data.data;
};

export const getUnverifiedAdmins = async () => {
  const response = await apiClient.get('/users/unverified/admins');
  return response.data.data;
};

// ==================== ADMIN DASHBOARD API ====================

export const getAdminDashboardStats = async () => {
  const response = await apiClient.get('/admin/dashboard/stats');
  return response.data.data;
};

// ==================== AUDIT LOGS API ====================

export const getAuditLogs = async (filters = {}) => {
  const params = new URLSearchParams();
  
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      params.append(key, filters[key]);
    }
  });
  
  const response = await apiClient.get(`/audit-logs?${params}`);
  return response.data.data;
};

export const getAuditLogsByEntity = async (entityType, entityId) => {
  const response = await apiClient.get(`/audit-logs/entity/${entityType}/${entityId}`);
  return response.data.data;
};

export const getAuditLogsByActor = async (actorId) => {
  const response = await apiClient.get(`/audit-logs/actor/${actorId}`);
  return response.data.data;
};

export const getAuditStats = async () => {
  const response = await apiClient.get('/audit-logs/stats');
  return response.data.data;
};

export const cleanupOldAuditLogs = async (daysOld = 365) => {
  const response = await apiClient.post(`/audit-logs/cleanup?daysOld=${daysOld}`);
  return response.data.data;
};

// ==================== BULK OPERATIONS API ====================

// Users
export const bulkVerifyUsers = async (userIds) => {
  const response = await apiClient.post('/bulk-operations/users/verify', { userIds });
  return response.data.data;
};

export const bulkDeleteUsers = async (userIds) => {
  const response = await apiClient.post('/bulk-operations/users/delete', { userIds });
  return response.data.data;
};

export const bulkRestoreUsers = async (userIds) => {
  const response = await apiClient.post('/bulk-operations/users/restore', { userIds });
  return response.data.data;
};

// Reports
export const bulkUpdateReportStatus = async (reportIds, status) => {
  const response = await apiClient.post('/bulk-operations/reports/update-status', { reportIds, status });
  return response.data.data;
};

export const bulkDeleteReports = async (reportIds) => {
  const response = await apiClient.post('/bulk-operations/reports/delete', { reportIds });
  return response.data.data;
};

export const bulkRestoreReports = async (reportIds) => {
  const response = await apiClient.post('/bulk-operations/reports/restore', { reportIds });
  return response.data.data;
};

// Categories
export const bulkDeleteCategories = async (categoryIds) => {
  const response = await apiClient.post('/bulk-operations/categories/delete', { categoryIds });
  return response.data.data;
};

export const bulkRestoreCategories = async (categoryIds) => {
  const response = await apiClient.post('/bulk-operations/categories/restore', { categoryIds });
  return response.data.data;
};

// ==================== REPORT PERMANENT DELETE ====================

export const permanentDeleteReport = async (reportId) => {
  const response = await apiClient.delete(`/reports/${reportId}/permanent`);
  return response.data.data;
};

// ==================== PASSWORD RESET API ====================

export const forgotPassword = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await apiClient.post('/auth/reset-password', { token, newPassword });
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};

// ==================== REPORT PRIORITY API ====================

export const updateReportPriority = async (reportId, priority) => {
  const response = await apiClient.patch(`/reports/${reportId}/priority`, { priority });
  return response.data.data;
};

// ==================== REPORT ASSIGNMENT API ====================

export const assignReport = async (reportId, assignedToId) => {
  const response = await apiClient.patch(`/reports/${reportId}/assign`, { assignedToId });
  return response.data.data;
};

export const getMyAssignedReports = async (filters = {}, lastItemId = null, limit = 10) => {
  const params = new URLSearchParams({ limit: limit.toString(), assignedToId: 'me' });
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      params.append(key, filters[key]);
    }
  });
  if (lastItemId) params.append('lastItemId', lastItemId);
  const response = await apiClient.get(`/reports?${params}`);
  return response.data.data;
};

// ==================== REPORT EDIT API ====================

export const editReport = async (reportId, data) => {
  const response = await apiClient.put(`/reports/${reportId}`, data);
  return response.data.data;
};

// ==================== USER REJECTION API ====================

export const rejectStudent = async (userId, reason) => {
  const response = await apiClient.put(`/users/reject/${userId}`, { reason });
  return response.data;
};

// ==================== EXPORT API ====================

export const exportReportsCsv = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) params.append(key, filters[key]);
  });
  const response = await apiClient.get(`/admin/export/reports?${params}`, {
    responseType: 'blob'
  });
  return response.data;
};

export const exportUsersCsv = async () => {
  const response = await apiClient.get('/admin/export/users', {
    responseType: 'blob'
  });
  return response.data;
};
