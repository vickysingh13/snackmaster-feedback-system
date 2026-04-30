import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to admin requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sm_admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      if (isAdminRoute && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('sm_admin_token');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Public API
export const fetchMachine = (machineCode) =>
  api.get(`/machine/${encodeURIComponent(String(machineCode).trim())}`);
export const submitForm = (data) => api.post('/submit', data);

// Admin API
export const adminLogin = (email, password) =>
  api.post('/admin/login', { email, password });

export const fetchSubmissions = (params) =>
  api.get('/admin/submissions', { params });

export const updateSubmission = (id, data) =>
  api.patch(`/admin/submissions/${id}`, data);

export const fetchMachines = () => api.get('/admin/machines');
export const addMachine = (data) => api.post('/admin/machines', data);
export const updateMachine = (id, data) =>
  api.patch(`/admin/machines/${id}`, data);
export const deleteMachine = (id) => api.delete(`/admin/machines/${id}`);

export const fetchFormConfigs = () => api.get('/admin/form-configs');
export const createFormConfig = (data) => api.post('/admin/form-configs', data);
export const updateFormConfig = (id, data) =>
  api.patch(`/admin/form-configs/${id}`, data);
export const deleteFormConfig = (id) => api.delete(`/admin/form-configs/${id}`);

export const fetchWeeklyConfig = () => api.get('/admin/weekly-config');
export const updateWeeklyConfig = (data) =>
  api.put('/admin/weekly-config', data);

export const fetchAnalytics = () => api.get('/admin/analytics');

export const fetchMachineUiConfig = (machineId) =>
  api.get(`/admin/machines/${machineId}/ui-config`);
export const saveMachineUiConfig = (machineId, data) =>
  api.post(`/admin/machines/${machineId}/ui-config`, data);