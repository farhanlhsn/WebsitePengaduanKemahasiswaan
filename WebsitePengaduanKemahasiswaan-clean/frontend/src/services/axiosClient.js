import axios from 'axios';
import { getOrCreateDeviceFingerprint } from '../utils/fingerprint';
import { getAccessToken, setAccessToken, clearAccessToken } from './authToken';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:6060/v1/api';

/** Dedicated client for refresh — no response interceptors to avoid recursion. */
export const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

let refreshPromise = null;

async function performRefresh() {
  const response = await refreshClient.post('/auth/refresh-token', null, {
    headers: { 'X-Device-Fingerprint': getOrCreateDeviceFingerprint() },
  });
  const data = response.data;
  setAccessToken(data.accessToken);
  return data;
}

/** Single-flight refresh shared by interceptors and auth store. */
export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function attachAuthInterceptors(client) {
  client.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Device-Fingerprint'] = getOrCreateDeviceFingerprint();
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/login') &&
        !originalRequest.url?.includes('/auth/refresh-token')
      ) {
        originalRequest._retry = true;

        try {
          const data = await refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return client(originalRequest);
        } catch (refreshError) {
          clearAccessToken();
          if (!window.location.pathname.includes('/login')) {
            sessionStorage.setItem(
              'redirectUrl',
              window.location.pathname + window.location.search
            );
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient = attachAuthInterceptors(
  axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    withCredentials: true,
  })
);
