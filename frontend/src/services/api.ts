import axios, { AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefresh);
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  govBrInit: () => api.get('/auth/govbr'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword }),
};

// Processes
export const processApi = {
  list: (params?: Record<string, unknown>) => api.get('/processes', { params }),
  get: (id: string) => api.get(`/processes/${id}`),
  create: (data: Record<string, unknown>) => api.post('/processes', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/processes/${id}`, data),
  forward: (id: string, data: Record<string, unknown>) => api.post(`/processes/${id}/forward`, data),
  close: (id: string, observation?: string) => api.post(`/processes/${id}/close`, { observation }),
  dashboard: (params?: Record<string, unknown>) => api.get('/processes/dashboard', { params }),
  publicStatus: (number: string) => api.get(`/processes/public/${number}`),
};

// Documents
export const documentApi = {
  upload: (formData: FormData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getByProcess: (processId: string) => api.get(`/documents/process/${processId}`),
  download: (id: string) => `${BASE_URL}/documents/${id}/download`,
  view: (id: string) => `${BASE_URL}/documents/${id}/view`,
  delete: (id: string) => api.delete(`/documents/${id}`),
  requestSignature: (data: Record<string, unknown>) => api.post('/documents/signatures', data),
  sign: (signatureId: string, signatureData?: string) =>
    api.post(`/documents/signatures/${signatureId}/sign`, { signatureData }),
  verify: (signatureId: string) => api.get(`/documents/verify/${signatureId}`),
  pendingSignatures: () => api.get('/documents/signatures/pending'),
};

// Users
export const userApi = {
  list: (params?: Record<string, unknown>) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  updateProfile: (data: Record<string, unknown>) => api.put('/users/profile', data),
  resetPassword: (id: string) => api.post(`/users/${id}/reset-password`),
  deactivate: (id: string) => api.delete(`/users/${id}/deactivate`),
  notifications: () => api.get('/users/notifications'),
  markRead: (id: string) => api.put(`/users/notifications/${id}/read`),
  markAllRead: () => api.put('/users/notifications/all/read'),
};

// Departments
export const departmentApi = {
  list: (params?: Record<string, unknown>) => api.get('/departments', { params }),
  tree: () => api.get('/departments/tree'),
  get: (id: string) => api.get(`/departments/${id}`),
  create: (data: Record<string, unknown>) => api.post('/departments', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/departments/${id}`, data),
};

// Reports
export const reportApi = {
  summary: () => api.get('/reports/summary'),
  byStatus: (params?: Record<string, unknown>) => api.get('/reports/by-status', { params }),
  byType: (params?: Record<string, unknown>) => api.get('/reports/by-type', { params }),
  byDepartment: (params?: Record<string, unknown>) => api.get('/reports/by-department', { params }),
  monthly: (params?: Record<string, unknown>) => api.get('/reports/monthly', { params }),
  overdue: () => api.get('/reports/overdue'),
};

// Settings
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: Record<string, string>) => api.put('/settings', data),
  processTypes: () => api.get('/settings/process-types'),
  createProcessType: (data: Record<string, unknown>) => api.post('/settings/process-types', data),
  updateProcessType: (id: string, data: Record<string, unknown>) => api.put(`/settings/process-types/${id}`, data),
};
