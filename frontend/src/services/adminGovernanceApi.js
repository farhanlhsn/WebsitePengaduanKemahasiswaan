/**
 * SUPERADMIN-only governance API client.
 * Uses the shared axios client with single-flight refresh-on-401.
 */

import { apiClient } from './axiosClient';

const BASE = '/admin-governance';

export const listAdmins = () =>
  apiClient.get(`${BASE}/admins`).then((r) => r.data?.data ?? r.data);

export const promoteToAdmin = (userId) =>
  apiClient.post(`${BASE}/users/${userId}/promote-admin`).then((r) => r.data);

export const demoteAdmin = (userId) =>
  apiClient.post(`${BASE}/users/${userId}/demote-admin`).then((r) => r.data);

export const promoteToSuperAdmin = (userId) =>
  apiClient.post(`${BASE}/users/${userId}/promote-superadmin`).then((r) => r.data);

export const demoteSuperAdmin = (userId) =>
  apiClient.post(`${BASE}/users/${userId}/demote-superadmin`).then((r) => r.data);

export const grantCategory = (userId, categoryId) =>
  apiClient.post(`${BASE}/users/${userId}/categories`, { categoryId }).then((r) => r.data);

export const revokeCategory = (userId, categoryId) =>
  apiClient.delete(`${BASE}/users/${userId}/categories/${categoryId}`).then((r) => r.data);
