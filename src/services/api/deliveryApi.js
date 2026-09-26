import { apiClient } from './client';

export const deliveryApi = {
  async getDeliveries(status = 'ALL') {
    let url = '/deliveries';
    if (status && status !== 'ALL') {
      url += `?status=${encodeURIComponent(status)}`;
    }
    const res = await apiClient.get(url);
    return res.data.deliveries;
  },

  async getDeliveryById(id) {
    const res = await apiClient.get(`/deliveries/${id}`);
    return res.data.delivery;
  },

  async assignDelivery(id) {
    const res = await apiClient.post(`/deliveries/${id}/assign`);
    return res.data.delivery;
  },

  async updateStatus(id, status) {
    const res = await apiClient.patch(`/deliveries/${id}/status`, { status });
    return res.data.delivery;
  }
};
