import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const getApiErrorMessage = (err, fallback) => {
  if (err.response?.data?.message) return err.response.data.message;
  if (!err.response) {
    return 'Cannot reach the server. Start the backend with "npm run dev" in the backend folder (port 5000).';
  }
  return fallback;
};

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip auth retry for login/refresh routes to prevent infinite loops
    const isAuthRoute = originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh-token');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        } catch {
          // Dispatch a custom event so AuthContext can react without a full-page reload
          localStorage.clear();
          window.dispatchEvent(new Event('auth:logout'));
        }
      } else {
        localStorage.clear();
        window.dispatchEvent(new Event('auth:logout'));
      }
    }

    return Promise.reject(error);
  }
);

export const getDashboardPath = (role) => {
  switch (role) {
    case 'admin': return '/admin';
    case 'dentist': return '/dentist';
    case 'pharmacy': return '/pharmacy';
    default: return '/dashboard';
  }
};

export const authAPI = {
  registerUser: (data) => api.post('/auth/register-user', data),
  register: (data) => api.post('/auth/register-user', data),
  registerPharmacy: (formData) =>
    api.post('/auth/register-pharmacy', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  registerDentist: (data) => api.post('/auth/register-dentist', data),
  registerPharmacyUser: (data) => api.post('/auth/register-pharmacy-user', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
};

export const predictionAPI = {
  predict: (formData) =>
    api.post('/predict', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: () => api.get('/predictions'),
  getById: (id) => api.get(`/predictions/${id}`),
  delete: (id) => api.delete(`/predictions/${id}`),
};

export const reportAPI = {
  getAll: () => api.get('/reports'),
  getById: (id) => api.get(`/reports/${id}`),
  download: (id) => api.get(`/reports/download/${id}`, { responseType: 'blob' }),
};

export const chatAPI = {
  send: (message, history = []) => api.post('/chat', { message, history }),
  getHistory: () => api.get('/chat/history'),
};

export const educationAPI = {
  getAll: (category) => api.get('/education', { params: { category } }),
  create: (data) => api.post('/education', data),
  update: (id, data) => api.put(`/education/${id}`, data),
  delete: (id) => api.delete(`/education/${id}`),
};

export const dentistAPI = {
  getAll: (params) => api.get('/dentists', { params }),
  getById: (id) => api.get(`/dentists/${id}`),
};

export const dentistDashboardAPI = {
  getPatients: () => api.get('/dentist/patients'),
  getConsultations: () => api.get('/dentist/consultations'),
  getPatientHistory: (patientId) => api.get(`/dentist/patients/${patientId}/history`),
  updateAvailability: (availability) => api.put('/dentist/availability', { availability }),
  getProfile: () => api.get('/dentist/profile'),
  updateProfile: (data) => api.put('/dentist/profile', data),
  getPayments: () => api.get('/dentist/payments'),
};

export const appointmentAPI = {
  create: (data) => api.post('/appointments', data),
  getAll: () => api.get('/appointments'),
  update: (id, data) => api.put(`/appointments/${id}`, data),
};

export const prescriptionAPI = {
  create: (data) => api.post('/prescriptions', data),
  getMy: () => api.get('/prescriptions/my'),
  getByPatient: (patientId) => api.get(`/prescriptions/patient/${patientId}`),
  getById: (id) => api.get(`/prescriptions/${id}`),
  download: (id) => api.get(`/prescriptions/${id}/download`, { responseType: 'blob' }),
};

export const pharmacySearchAPI = {
  getNearby: (params) => api.get('/pharmacies/nearby', { params }),
};

export const orderAPI = {
  sendPrescription: (data) => api.post('/orders/send-prescription', data),
  getHistory: () => api.get('/orders/history'),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
  confirm: (id) => api.put(`/orders/${id}/confirm`),
};

export const pharmacyAPI = {
  getOrders: (params) => api.get('/pharmacy/orders', { params }),
  updateOrderStatus: (id, data) => api.put(`/pharmacy/order-status/${id}`, data),
  acceptOrder: (id) => api.put(`/pharmacy/orders/${id}/accept`, { status: 'accepted' }),
  rejectOrder: (id, reason) => api.put(`/pharmacy/orders/${id}/reject`, { status: 'cancelled', rejectionReason: reason }),
  getOrderHistory: () => api.get('/pharmacy/orders/history'),
  getProfile: () => api.get('/pharmacy/profile'),
  updateProfile: (data) => api.put('/pharmacy/profile', data),
  getInventory: () => api.get('/pharmacy/inventory'),
  updateInventory: (inventory) => api.put('/pharmacy/inventory', { inventory }),
  addInventoryItem: (formData) => api.post('/pharmacy/inventory', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateInventoryItem: (itemId, formData) => api.put(`/pharmacy/inventory/${itemId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteInventoryItem: (itemId) => api.delete(`/pharmacy/inventory/${itemId}`),
  getDirectOrders: (params) => api.get('/pharmacy/direct-orders', { params }),
  updateDirectOrderStatus: (id, status, rejectionReason) => api.patch(`/pharmacy/direct-orders/${id}/status`, { status, rejectionReason }),
  updateDirectOrderPaymentStatus: (id, paymentStatus) => api.patch(`/pharmacy/direct-orders/${id}/payment-status`, { paymentStatus }),
};

export const medicineMarketAPI = {
  getAll: (params) => api.get('/medicines', { params }),
  getCategories: () => api.get('/medicines/categories'),
};

export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart', data),
  updateItem: (itemId, quantity) => api.put(`/cart/${itemId}`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete('/cart'),
};

export const directOrderAPI = {
  place: (data) => api.post('/direct-orders', data),
  getMyOrders: (params) => api.get('/direct-orders', { params }),
  getById: (id) => api.get(`/direct-orders/${id}`),
  cancel: (id) => api.put(`/direct-orders/${id}/cancel`),
  confirm: (id) => api.put(`/direct-orders/${id}/confirm`),
};

export const paymentAPI = {
  processPharmacyOrder: (data) => api.post('/payments/pharmacy-order', data),
  processPrescription: (data) => api.post('/payments/prescription', data),
  getMyPayments: () => api.get('/payments/my'),
};

export const notificationAPI = {
  get: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getPharmacyApplications: (params) => api.get('/admin/pharmacy-applications', { params }),
  approvePharmacy: (id) => api.put(`/admin/pharmacy-approve/${id}`),
  rejectPharmacy: (id, reason) => api.put(`/admin/pharmacy-reject/${id}`, { reason }),
  getPharmacies: () => api.get('/admin/pharmacies'),
  deletePharmacy: (id) => api.delete(`/admin/pharmacies/${id}`),
  getDentists: () => api.get('/admin/dentists'),
  createDentist: (data) => api.post('/admin/dentists', data),
  deleteDentist: (id) => api.delete(`/admin/dentists/${id}`),
  // Dentist approval (User model)
  getPendingDentists: () => api.get('/admin/pending-dentists'),
  approveDentist: (id) => api.put(`/admin/approve-dentist/${id}`),
  rejectDentist: (id) => api.put(`/admin/reject-dentist/${id}`),
  // Pharmacy-user approval (User model)
  getPendingPharmacyUsers: () => api.get('/admin/pending-pharmacies'),
  approvePharmacyUser: (id) => api.put(`/admin/approve-pharmacy/${id}`),
  rejectPharmacyUser: (id) => api.put(`/admin/reject-pharmacy/${id}`),
};

export default api;
