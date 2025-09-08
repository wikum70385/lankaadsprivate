import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  guestLogin: (nickname: string, gender: string) => api.post('/auth/guest-login', { nickname, gender }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

export const messageAPI = {
  getRoomMessages: (roomId: string, limit = 50, offset = 0) => 
    api.get(`/messages/room/${roomId}?limit=${limit}&offset=${offset}`),
  getPrivateMessages: (otherUserId: string, limit = 50, offset = 0) => 
    api.get(`/messages/private/${otherUserId}?limit=${limit}&offset=${offset}`),
  getUnreadCounts: () => api.get('/messages/unread-counts'),
  markAsRead: (roomId?: string, otherUserId?: string) => api.post('/messages/mark-read', { roomId, otherUserId }),
  uploadImage: (formData: FormData) => api.post('/messages/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const userAPI = {
  getOnlineUsers: () => api.get('/users/online'),
  getUserProfile: (userId: string) => api.get(`/users/profile/${userId}`),
};
