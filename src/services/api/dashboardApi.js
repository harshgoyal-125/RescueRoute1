import { apiClient } from './client';

export const dashboardApi = {
  async getImpactMetrics() {
    const res = await apiClient.get('/dashboard/impact');
    return res.data;
  }
};
