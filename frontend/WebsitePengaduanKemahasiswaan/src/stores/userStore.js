import { create } from 'zustand';
import {
  getUserByEmail as apiGetUserByEmail,
  getUserById as apiGetUserById,
  getUserStats as apiGetUserStats,
  updateUser as apiUpdateUser,
  getAllUsers as apiGetAllUsers,
  verifyStudent as apiVerifyStudent,
  deleteUser as apiDeleteUser,
  restoreUser as apiRestoreUser,
  permanentDeleteUser as apiPermanentDeleteUser,
  cleanupOldDeletedUsers as apiCleanupOldDeletedUsers
} from '../services/api';

const useUserStore = create((set, get) => ({
  // State
  users: [],
  user: null,
  currentUser: null,
  stats: null,
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Get all users (admin only)
  getAllUsers: async (includeDeleted = false) => {
    try {
      set({ loading: true, error: null });
      const users = await apiGetAllUsers(includeDeleted);
      set({ users, loading: false });
      return users;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to fetch users' });
      throw error;
    }
  },

  // Get user by email
  getUserByEmail: async (email) => {
    try {
      set({ loading: true, error: null });
      const user = await apiGetUserByEmail(email);
      set({ user, loading: false });
      return user;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to fetch user' });
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (userId, includeDeleted = false) => {
    try {
      set({ loading: true, error: null });
      const user = await apiGetUserById(userId, includeDeleted);
      set({ user, loading: false });
      return user;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to fetch user' });
      throw error;
    }
  },

  // Get user stats
  getUserStats: async () => {
    try {
      set({ loading: true, error: null });
      const stats = await apiGetUserStats();
      set({ stats, loading: false });
      return stats;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to fetch user stats' });
      throw error;
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      set({ loading: true, error: null });
      const updatedUser = await apiUpdateUser(userId, userData);
      
      // Update current user if it's the same
      const currentUser = get().currentUser;
      if (currentUser && currentUser.id === userId) {
        set({ currentUser: updatedUser });
      }

      // Update in users list
      set(state => ({
        users: state.users.map(user => 
          user.id === userId ? updatedUser : user
        ),
        user: updatedUser, 
        loading: false 
      }));
      return updatedUser;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to update user' });
      throw error;
    }
  },

  // Verify student (admin only)
  verifyStudent: async (userId) => {
    try {
      set({ loading: true, error: null });
      const verifiedUser = await apiVerifyStudent(userId);
      
      // Update in users list
      set(state => ({
        users: state.users.map(user => 
          user.id === userId ? verifiedUser : user
        ),
        loading: false 
      }));
      return verifiedUser;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to verify student' });
      throw error;
    }
  },

  // Delete user (soft delete, admin only)
  deleteUser: async (userId) => {
    try {
      set({ loading: true, error: null });
      await apiDeleteUser(userId);
      
      // Remove from users list or mark as deleted
      set(state => ({
        users: state.users.filter(user => user.id !== userId),
        loading: false 
      }));
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to delete user' });
      throw error;
    }
  },

  // Restore user (admin only)
  restoreUser: async (userId) => {
    try {
      set({ loading: true, error: null });
      const restoredUser = await apiRestoreUser(userId);
      
      // Add back to users list
      set(state => ({
        users: [restoredUser, ...state.users],
        loading: false 
      }));
      return restoredUser;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to restore user' });
      throw error;
    }
  },

  // Permanent delete user (admin only)
  permanentDeleteUser: async (userId) => {
    try {
      set({ loading: true, error: null });
      await apiPermanentDeleteUser(userId);
      
      // Remove from users list permanently
      set(state => ({
        users: state.users.filter(user => user.id !== userId),
        loading: false 
      }));
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to permanently delete user' });
      throw error;
    }
  },

  // Cleanup old deleted users (admin only)
  cleanupOldDeletedUsers: async (daysOld = 90) => {
    try {
      set({ loading: true, error: null });
      const result = await apiCleanupOldDeletedUsers(daysOld);
      set({ loading: false });
      return result;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to cleanup old deleted users' });
      throw error;
    }
  },

  // Set current user (from auth)
  setCurrentUser: (user) => set({ currentUser: user }),

  // Reset store
  reset: () => set({
    users: [],
    user: null,
    currentUser: null,
    stats: null,
    loading: false,
    error: null
  })
}));

export default useUserStore;