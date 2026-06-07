import { create } from 'zustand';
import {
  createReport as apiCreateReport,
  uploadAttachments as apiUploadAttachments,
  getUserReports as apiGetUserReports,
  getAllReports as apiGetAllReports,
  getReportById as apiGetReportById,
  updateReportStatus as apiUpdateReportStatus,
  deleteReport as apiDeleteReport,
  restoreReport as apiRestoreReport
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
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create report';
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
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to upload attachments';
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
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to fetch reports';
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
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to fetch reports';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Get single report by ID
  getReportById: async (reportId) => {
    try {
      set({ loading: true, error: null });
      const report = await apiGetReportById(reportId);
      set({ loading: false });
      return report;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to fetch report';
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
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update report status';
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
        reports: state.reports.filter(report => report.id !== reportId),
        loading: false
      }));
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete report';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Restore report
  restoreReport: async (reportId) => {
    try {
      set({ loading: true, error: null });
      const report = await apiRestoreReport(reportId);
      set(state => ({
        reports: [report, ...state.reports],
        loading: false
      }));
      return report;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to restore report';
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
