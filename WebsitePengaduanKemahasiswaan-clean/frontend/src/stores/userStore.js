import { create } from 'zustand';
import {
  getUserByEmail as apiGetUserByEmail,
  getUserById as apiGetUserById,
  getUserStatsById as apiGetUserStatsById,
  updateUser as apiUpdateUser,
  updateProfile as apiUpdateProfile,
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
  userStats: null,

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

  // Get user stats by ID

  getUserStatsById: async (userId) => {
    try {
      console.log('getUserStatsById store called');
      set({ loading: true, error: null });
      const userStats = await apiGetUserStatsById(userId);
      set({ userStats, loading: false });
      return userStats;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to fetch user stats by ID' });
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

  // Update own profile
  updateProfile: async (userData) => {
    try {
      set({ loading: true, error: null });
      const updatedUser = await apiUpdateProfile(userData);
      
      // Update current user
      set({ currentUser: updatedUser });

      // Update in users list if present
      set(state => ({
        users: state.users.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        ),
        user: updatedUser, 
        loading: false 
      }));
      return updatedUser;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to update profile' });
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
      
      // Mark as deleted in state instead of filtering out
      set(state => ({
        users: state.users.map(user => 
          user.id === userId ? { ...user, deletedAt: new Date().toISOString() } : user
        ),
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
      
      // Update the user in the list (or add if not present)
      set(state => {
        const exists = state.users.some(user => user.id === userId);
        return {
          users: exists
            ? state.users.map(user => user.id === userId ? restoredUser : user)
            : [restoredUser, ...state.users],
          loading: false 
        };
      });
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
    userStats: null,
    loading: false,
    error: null
  })
}));

export default useUserStore;