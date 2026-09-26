import { dashboardApi } from './api/dashboardApi';

export const dashboardService = {
  async getMetrics() {
    return dashboardApi.getImpactMetrics();
  }
};
