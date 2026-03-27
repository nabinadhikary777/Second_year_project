import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth/';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('login/', credentials),
  register: (userData) => api.post('register/', userData),
  logout: () => api.post('logout/'),
  getProfile: () => api.get('profile/'),
  updateProfile: (data) => {
    const formData = data instanceof FormData ? data : new FormData();
    if (!(data instanceof FormData)) {
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
    }
    return api.patch('profile/update/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  requestPasswordReset: (email) => api.post('password-reset/request/', { email }),
  resetPassword: (uid, token, new_password) =>
    api.post('password-reset/confirm/', { uid, token, new_password }),
};

export const vehicleAPI = {
  // Public
  getVehicles: (params) => api.get('vehicles/', { params }),
  getVehicle: (id) => api.get(`vehicles/${id}/`),
  getCategories: () => api.get('categories/'),
  getVehicleReviews: (id) => api.get(`vehicles/${id}/reviews/`),
  
  // Owner
  getOwnerVehicles: () => api.get('owner/vehicles/'),
  addVehicle: (data) => {
    const formData = data instanceof FormData ? data : new FormData();
    if (!(data instanceof FormData)) {
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
    }
    return api.post('owner/vehicles/add/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateVehicle: (id, data) => {
    const formData = data instanceof FormData ? data : new FormData();
    if (!(data instanceof FormData)) {
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
    }
    // Use PATCH for partial update - allows updating without resending all images
    return api.patch(`owner/vehicles/${id}/update/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getOwnerVehicle: (id) => api.get(`owner/vehicles/${id}/`),
  deleteVehicle: (id) => api.delete(`owner/vehicles/${id}/delete/`),
};

export const bookingAPI = {
  // Customer
  createBooking: (data) => api.post('bookings/create/', data),
  getCustomerBookings: (status = 'all') => api.get('customer/bookings/', { params: { status } }),
  getBookingDetail: (id) => api.get(`customer/bookings/${id}/`),
  cancelBooking: (id, reason = '') => api.put(`customer/bookings/${id}/cancel/`, { reason }),
  
  // Owner
  getOwnerBookings: (status = 'all') => api.get('owner/bookings/', { params: { status } }),
  getOwnerBookingDetail: (id) => api.get(`owner/bookings/${id}/`),
  updateBookingStatus: (id, status, reason = '') => 
    api.put(`owner/bookings/${id}/update-status/`, { status, reason }),
  
  // Reviews
  addReview: (bookingId, data) => api.post(`bookings/${bookingId}/review/`, data),
  replyToReview: (reviewId, reply) => api.put(`reviews/${reviewId}/reply/`, { reply }),
  
  // Payments
  initiateKhaltiPayment: (data) => api.post('payments/khalti/initiate/', data),
  verifyKhaltiPayment: (data) => api.post('payments/khalti/verify/', data),
  initiateKhaltiTestPayment: () => api.post('payments/khalti/initiate-test/'),
  verifyKhaltiTestPayment: (data) => api.post('payments/khalti/verify-test/', data),
  getPaymentHistory: () => api.get('payments/history/'),
};

export const dashboardAPI = {
  getStats: () => api.get('dashboard/stats/'),
};

export const notificationAPI = {
  listNotifications: () => api.get('notifications/'),
  markNotificationRead: (id) => api.post(`notifications/${id}/read/`),
  markAllNotificationsRead: () => api.post('notifications/read-all/'),
};

export const earningsAPI = {
  getEarnings: () => api.get('owner/earnings/'),
  getEarningSummary: () => api.get('owner/earnings/summary/'),
};

export default api;