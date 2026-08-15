import { create } from 'zustand';
import {
  getCategories as apiGetCategories,
  searchCategories as apiSearchCategories,
  getCategoryBySlug as apiGetCategoryBySlug,
  getCategoryById as apiGetCategoryById,
  getCategoryStats as apiGetCategoryStats,
  getCategoriesWithReports as apiGetCategoriesWithReports
} from '../services/api';

const useCategoryStore = create((set) => ({
  // State
  categories: [],
  category: null,
  stats: null,
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Get all categories
  getCategories: async (includeDeleted = false) => {
    try {
      set({ loading: true, error: null });
      const categories = await apiGetCategories(includeDeleted);
      set({ categories, loading: false });
      return categories;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to fetch categories' });
      throw error;
    }
  },

  // Search categories
  searchCategories: async (query, includeDeleted = false) => {
    try {
      set({ loading: true, error: null });
      const categories = await apiSearchCategories(query, includeDeleted);
      set({ categories, loading: false });
      return categories;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to search categories' });
      throw error;
    }
  },

  // Get category by slug
  getCategoryBySlug: async (slug, includeDeleted = false) => {
    try {
      set({ loading: true, error: null });
      const category = await apiGetCategoryBySlug(slug, includeDeleted);
      set({ category, loading: false });
      return category;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to fetch category' });
      throw error;
    }
  },

  // Get category by ID
  getCategoryById: async (categoryId, includeDeleted = false) => {
    try {
      set({ loading: true, error: null });
      const category = await apiGetCategoryById(categoryId, includeDeleted);
      set({ category, loading: false });
      return category;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to fetch category' });
      throw error;
    }
  },

  // Get category stats
  getCategoryStats: async () => {
    try {
      set({ loading: true, error: null });
      const stats = await apiGetCategoryStats();
      set({ stats, loading: false });
      return stats;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to fetch category stats' });
      throw error;
    }
  },

  // Get categories with reports
  getCategoriesWithReports: async (includeDeleted = false) => {
    try {
      set({ loading: true, error: null });
      const categories = await apiGetCategoriesWithReports(includeDeleted);
      set({ categories, loading: false });
      return categories;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to fetch categories with reports' });
      throw error;
    }
  },

  // Reset store
  reset: () => set({
    categories: [],
    category: null,
    stats: null,
    loading: false,
    error: null
  })
}));

export default useCategoryStore; 