import { create } from 'zustand';
import {
  createReport as apiCreateReport,
  uploadAttachments as apiUploadAttachments,
  getUserReports as apiGetUserReports,
  getAllReports as apiGetAllReports,
  getMyAssignedReports as apiGetMyAssignedReports,
  getReportById as apiGetReportById,
  updateReportStatus as apiUpdateReportStatus,
  updateReportPriority as apiUpdateReportPriority,
  assignReport as apiAssignReport,
  editReport as apiEditReport,
  deleteReport as apiDeleteReport,
  restoreReport as apiRestoreReport,
  bulkUpdateReportStatus as apiBulkUpdateReportStatus
} from '../services/api';

const useReportStore = create((set, get) => ({
  // State
  reports: [],
  loading: false,
  error: null,
  pagination: {
    hasNextPage: false,
    lastItemId: null,
    itemsPerPage: 10,
    totalItems: 0
  },

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Create new report
  createReport: async (reportData) => {
    try {
      set({ loading: true, error: null });
      const report = await apiCreateReport(reportData);
      set(state => ({
        reports: [report, ...state.reports],
        loading: false
      }));
      return report;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Gagal membuat laporan';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Upload attachments to report
  uploadAttachments: async (reportId, files) => {
    try {
      const attachments = await apiUploadAttachments(reportId, files);
      return attachments;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Gagal mengunggah lampiran';
      set({ error: errorMessage });
      throw error;
    }
  },

  // Get user reports (paginated)
  getUserReports: async (filters = {}, loadMore = false) => {
    try {
      set({ loading: true, error: null });
      const { itemsPerPage, lastItemId } = get().pagination;
      
      const response = await apiGetUserReports(
        filters,
        loadMore ? lastItemId : null,
        itemsPerPage
      );
      
      // Handle the response structure correctly
      const reports = response.data || [];
      const paginationInfo = response.pagination || { 
        hasNextPage: false, 
        lastItemId: null,
        totalItems: 0,
        itemsPerPage: itemsPerPage
      };
      
      set(state => ({
        reports: loadMore ? [...state.reports, ...reports] : reports,
        pagination: {
          ...state.pagination,
          hasNextPage: paginationInfo.hasNextPage,
          lastItemId: paginationInfo.lastItemId,
          totalItems: paginationInfo.totalItems,
          itemsPerPage: paginationInfo.itemsPerPage
        },
        loading: false
      }));
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Gagal memuat laporan';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Get all reports (for admin)
  getAllReports: async (filters = {}, loadMore = false) => {
    try {
      set({ loading: true, error: null });
      const { itemsPerPage, lastItemId } = get().pagination;
      
      const response = await apiGetAllReports(
        filters,
        loadMore ? lastItemId : null,
        itemsPerPage
      );
      
      // Handle the response structure correctly
      const reports = response.data || [];
      const paginationInfo = response.pagination || { 
        hasNextPage: false, 
        lastItemId: null,
        totalItems: 0,
        itemsPerPage: itemsPerPage
      };
      
      set(state => ({
        reports: loadMore ? [...state.reports, ...reports] : reports,
        pagination: {
          ...state.pagination,
          hasNextPage: paginationInfo.hasNextPage,
          lastItemId: paginationInfo.lastItemId,
          totalItems: paginationInfo.totalItems,
          itemsPerPage: paginationInfo.itemsPerPage
        },
        loading: false
      }));
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Gagal memuat laporan';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Get reports assigned to the current admin (paginated)
  getMyAssignedReports: async (filters = {}, loadMore = false) => {
    try {
      set({ loading: true, error: null });
      const { itemsPerPage, lastItemId } = get().pagination;

      const response = await apiGetMyAssignedReports(
        filters,
        loadMore ? lastItemId : null,
        itemsPerPage
      );

      // Handle the response structure correctly
      const reports = response.data || [];
      const paginationInfo = response.pagination || {
        hasNextPage: false,
        lastItemId: null,
        totalItems: 0,
        itemsPerPage: itemsPerPage
      };

      set(state => ({
        reports: loadMore ? [...state.reports, ...reports] : reports,
        pagination: {
          ...state.pagination,
          hasNextPage: paginationInfo.hasNextPage,
          lastItemId: paginationInfo.lastItemId,
          totalItems: paginationInfo.totalItems,
          itemsPerPage: paginationInfo.itemsPerPage
        },
        loading: false
      }));
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Gagal memuat laporan';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Get single report by ID
  getReportById: async (reportId, includeDeleted = false) => {
    try {
      set({ loading: true, error: null });
      const report = await apiGetReportById(reportId, includeDeleted);
      set({ loading: false });
      return report;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Gagal memuat laporan';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Update report status (admin only)
  updateReportStatus: async (reportId, status, reason = null) => {
    try {
      set({ loading: true, error: null });
      const updatedReport = await apiUpdateReportStatus(reportId, status, reason);
      
      // Update the report in the local state
      set(state => ({
        reports: state.reports.map(report => 
          report.id === reportId ? { ...report, status, ...updatedReport } : report
        ),
        loading: false
      }));
      console.log(updatedReport);
      return updatedReport;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Gagal memperbarui status laporan';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Assign report to an admin (admin only). Passing null unassigns.
  assignReport: async (reportId, assignedToId) => {
    try {
      set({ loading: true, error: null });
      const updatedReport = await apiAssignReport(reportId, assignedToId);

      // Merge the partial response (assignedToId, assignedTo) into local list
      set(state => ({
        reports: state.reports.map(report =>
          report.id === reportId ? { ...report, ...updatedReport } : report
        ),
        loading: false
      }));
      return updatedReport;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Gagal menugaskan laporan';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Update report priority (admin only): LOW | MEDIUM | HIGH | URGENT
  updateReportPriority: async (reportId, priority) => {
    try {
      set({ loading: true, error: null });
      const updatedReport = await apiUpdateReportPriority(reportId, priority);

      // Merge the partial response (priority) into local list
      set(state => ({
        reports: state.reports.map(report =>
          report.id === reportId ? { ...report, ...updatedReport } : report
        ),
        loading: false
      }));
      return updatedReport;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Gagal memperbarui prioritas laporan';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Edit report (owner, only while PENDING): title/description/categoryId
  editReport: async (reportId, data) => {
    try {
      set({ loading: true, error: null });
      const updatedReport = await apiEditReport(reportId, data);

      // Merge the partial response into local list
      set(state => ({
        reports: state.reports.map(report =>
          report.id === reportId ? { ...report, ...updatedReport } : report
        ),
        loading: false
      }));
      return updatedReport;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Gagal memperbarui laporan';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Bulk update report status (admin only)
  bulkUpdateReportStatus: async (reportIds, status) => {
    try {
      set({ loading: true, error: null });
      const result = await apiBulkUpdateReportStatus(reportIds, status);
      
      // Update reports in local state
      set(state => ({
        reports: state.reports.map(report => 
          reportIds.includes(report.id) ? { ...report, status } : report
        ),
        loading: false
      }));
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Gagal memperbarui status laporan secara massal';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Delete report (soft delete)
  deleteReport: async (reportId) => {
    try {
      set({ loading: true, error: null });
      await apiDeleteReport(reportId);
      set(state => ({
        reports: state.reports.map(report => 
          report.id === reportId ? { ...report, deletedAt: new Date().toISOString() } : report
        ),
        loading: false
      }));
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Gagal menghapus laporan';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Restore report
  restoreReport: async (reportId) => {
    try {
      set({ loading: true, error: null });
      const report = await apiRestoreReport(reportId);
      set(state => {
        const exists = state.reports.some(r => r.id === reportId);
        return {
          reports: exists
            ? state.reports.map(r => r.id === reportId ? report : r)
            : [report, ...state.reports],
          loading: false
        };
      });
      return report;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Gagal memulihkan laporan';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Reset store
  reset: () => set({
    reports: [],
    loading: false,
    error: null,
    pagination: {
      hasNextPage: false,
      lastItemId: null,
      itemsPerPage: 10,
      totalItems: 0
    }
  })
}));

export default useReportStore; 
