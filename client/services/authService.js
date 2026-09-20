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

  async updateProfile(profileData) {
    const res = await apiClient.patch('/auth/profile', profileData);
    if (res.data.success && res.data.user) {
      tokenStorage.setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data.message || 'Failed to update profile');
  },

  async uploadAvatar(formData) {
    const res = await apiClient.post('/auth/profile-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (res.data.success && res.data.user) {
      tokenStorage.setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data.message || 'Failed to upload profile photo');
  },

  async removeAvatar() {
    const res = await apiClient.delete('/auth/profile-photo');
    if (res.data.success && res.data.user) {
      tokenStorage.setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data.message || 'Failed to remove profile photo');
  },

  async changePassword(passwordData) {
    const res = await apiClient.post('/auth/change-password', passwordData);
    return res.data;
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
