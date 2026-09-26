import { apiClient } from './client';

export const authApi = {
  async register(userData) {
    const res = await apiClient.post('/auth/register', userData);
    if (res.data?.token) {
      apiClient.setToken(res.data.token);
    }
    return res.data;
  },

  async login(email, password) {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data?.token) {
      apiClient.setToken(res.data.token);
    }
    return res.data;
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    return res.data.user;
  },

  logout() {
    apiClient.clearToken();
  }
};
