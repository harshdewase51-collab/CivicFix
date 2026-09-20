import apiClient from '../api/apiClient.js';
import { tokenStorage } from '../auth/tokenStorage.js';

export const authService = {
  async login(email, password) {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data.success) {
      tokenStorage.setToken(res.data.token);
      tokenStorage.setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  },

  async register(name, email, password) {
    const res = await apiClient.post('/auth/register', { name, email, password });
    if (res.data.success) {
      tokenStorage.setToken(res.data.token);
      tokenStorage.setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    if (res.data.success) {
      tokenStorage.setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data.message || 'Session validation failed');
  },

  logout() {
    tokenStorage.clearSession();
  },

  getCurrentUser() {
    return tokenStorage.getUser();
  },

  isAuthenticated() {
    return tokenStorage.hasValidToken();
  }
};

export default authService;
