import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  login as apiLogin,
  registerStudent as apiRegisterStudent,
  logout as apiLogout,
  refreshToken as apiRefreshToken,
  getUserDevices as apiGetUserDevices,
  logoutDevice as apiLogoutDevice,
  logoutAllOtherDevices as apiLogoutAllOtherDevices
} from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoggedIn: false,
      loading: false,
      error: null,
      devices: [],
      role: null,

      // Actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Login
      login: async (email, password) => {
        try {
          set({ loading: true, error: null });
          
          // Clear any existing auth state before login attempt
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isLoggedIn: false
          });
          
          const response = await apiLogin(email, password);
          
          // Extract data from backend response: { accessToken, data: user }
          const { accessToken, data: user } = response;
          
          // Store access token in localStorage (refresh token is in httpOnly cookie)
          localStorage.setItem('token', accessToken);
          
          set({
            user,
            token: accessToken,
            isLoggedIn: true,
            loading: false,
            error: null,
            role: user.role || null
          });
          
          return response;
        } catch (error) {
          const errorMessage = error.response?.error || error.response?.data?.message || 'Login failed';
          
          // Ensure complete cleanup on login failure
          localStorage.removeItem('token');
          set({ 
            loading: false, 
            error: errorMessage,
            isLoggedIn: false,
            user: null,
            token: null 
          });
          
          throw error;
        }
      },

      // Register Student
      registerStudent: async (userData, ktm) => {
        try {
          set({ loading: true, error: null });
          const response = await apiRegisterStudent(userData, ktm);
          set({ loading: false });
          return response;
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Registration failed';
          set({ loading: false, error: errorMessage });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        try {
          set({ loading: true });
          await apiLogout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear state regardless of API call success
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isLoggedIn: false,
            loading: false,
            error: null,
            devices: []
          });
        }
      },

      // Refresh Token (uses httpOnly cookie automatically)
      refreshAuthToken: async () => {
        try {
          // Call refresh endpoint - it uses httpOnly cookie automatically
          const response = await apiRefreshToken();
          const { accessToken } = response;

          // Store new access token
          localStorage.setItem('token', accessToken);
          set({ token: accessToken });
          
          return response;
        } catch (error) {
          // If refresh fails, clear everything and logout user
          console.log('Token refresh failed, logging out...');
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isLoggedIn: false,
            loading: false,
            error: null,
            devices: []
          });
          throw error;
        }
      },

      // Get User Devices
      getUserDevices: async () => {
        try {
          set({ loading: true, error: null });
          const devices = await apiGetUserDevices();
          set({ devices, loading: false });
          return devices;
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to fetch devices';
          set({ loading: false, error: errorMessage });
          throw error;
        }
      },

      // Logout Device
      logoutDevice: async (deviceId) => {
        try {
          set({ loading: true, error: null });
          await apiLogoutDevice(deviceId);
          
          // Remove device from local state
          const updatedDevices = get().devices.filter(device => device.id !== deviceId);
          set({ devices: updatedDevices, loading: false });
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to logout device';
          set({ loading: false, error: errorMessage });
          throw error;
        }
      },

      // Logout All Other Devices
      logoutAllOtherDevices: async () => {
        try {
          set({ loading: true, error: null });
          await apiLogoutAllOtherDevices();
          
          // Refresh devices list
          await get().getUserDevices();
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to logout other devices';
          set({ loading: false, error: errorMessage });
          throw error;
        }
      },

      // Initialize auth from localStorage
      initializeAuth: () => {
        const token = localStorage.getItem('token');
        
        if (token) {
          set({
            token,
            isLoggedIn: true
          });
        }
      },

      // Check if user is authenticated
      isAuthenticated: () => {
        const { token, isLoggedIn } = get();
        return !!(token && isLoggedIn);
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn
      })
    }
  )
);

export default useAuthStore;
