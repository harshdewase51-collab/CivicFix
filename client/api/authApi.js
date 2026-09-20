import authService from '../services/authService.js';

export const authApi = {
  login: (email, password) => authService.login(email, password),
  register: (name, email, password) => authService.register(name, email, password),
  getMe: () => authService.getMe(),
  logout: () => authService.logout(),
  getCurrentUser: () => authService.getCurrentUser(),
  isAuthenticated: () => authService.isAuthenticated()
};

export default authApi;
