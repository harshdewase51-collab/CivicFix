import tokenStorage from './tokenStorage.js';

export const authUtils = {
  getToken: () => tokenStorage.getToken(),
  setToken: (token) => tokenStorage.setToken(token),
  getUser: () => tokenStorage.getUser(),
  setUser: (user) => tokenStorage.setUser(user),
  clearSession: () => tokenStorage.clearSession(),
  hasValidToken: () => tokenStorage.hasValidToken()
};

export { tokenStorage };
export default authUtils;
