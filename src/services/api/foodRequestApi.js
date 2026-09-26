import { apiClient } from './client';

export const foodRequestApi = {
  /**
   * Submit a public food request (unauthenticated).
   */
  async submitRequest(requestData) {
    const res = await apiClient.post('/requests', requestData);
    return res.data;
  },

  /**
   * Get all food requests (Admin, Shelter).
   */
  async getRequests(filters = {}) {
    const query = new URLSearchParams();
    if (filters.status) query.append('status', filters.status);
    if (filters.urgency) query.append('urgency', filters.urgency);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await apiClient.get(`/requests${queryString}`);
    return res.data;
  },

  /**
   * Update request status (Admin only).
   */
  async updateStatus(id, status) {
    const res = await apiClient.patch(`/requests/${id}/status`, { status });
    return res.data;
  }
};
