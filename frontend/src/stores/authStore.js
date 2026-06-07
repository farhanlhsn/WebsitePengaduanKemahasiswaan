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
import { setAccessToken, clearAccessToken, getAccessToken } from '../services/authToken';
import { purgeSensitiveCaches } from '../utils/cachePurge';

let refreshInFlight = null;

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
          
          // Clear any existing auth state and cached API data before login attempt
          clearAccessToken();
          await purgeSensitiveCaches();
          set({
            user: null,
            token: null,
            isLoggedIn: false
          });
          
          const response = await apiLogin(email, password);
          
          // Extract data from backend response: { accessToken, data: user }
          const { accessToken, data: user } = response;
          
          setAccessToken(accessToken);
          
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
          clearAccessToken();
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
          clearAccessToken();
          await purgeSensitiveCaches();
          set({
            user: null,
            token: null,
            isLoggedIn: false,
            loading: false,
            error: null,
            devices: [],
            role: null,
          });
        }
      },

      // Refresh Token (uses httpOnly cookie automatically)
      refreshAuthToken: async () => {
        if (refreshInFlight) return refreshInFlight;

        refreshInFlight = (async () => {
          try {
            const response = await apiRefreshToken();
            const { accessToken } = response;

            setAccessToken(accessToken);
            set({
              token: accessToken,
              user: response.data || get().user,
              role: response.data?.role || get().role,
              isLoggedIn: true,
            });

            return response;
          } catch (error) {
            console.log('Token refresh failed, logging out...');
            clearAccessToken();
            await purgeSensitiveCaches();
            set({
              user: null,
              token: null,
              isLoggedIn: false,
              loading: false,
              error: null,
              devices: [],
              role: null,
            });
            throw error;
          } finally {
            refreshInFlight = null;
          }
        })();

        return refreshInFlight;
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

      // Initialize auth from persisted, non-sensitive user snapshot only.
      initializeAuth: () => {
        if (!getAccessToken()) {
          clearAccessToken();
          set({ token: null, isLoggedIn: false });
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
        role: state.role,
      })
    }
  )
);

export default useAuthStore;
