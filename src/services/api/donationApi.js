import { apiClient } from './client';

export const donationApi = {
  async getDonations(status = 'ALL', page = 1, limit = 50) {
    let url = `/donations?page=${page}&limit=${limit}`;
    if (status && status !== 'ALL') {
      url += `&status=${encodeURIComponent(status)}`;
    }
    const res = await apiClient.get(url);
    return res.data;
  },

  async getDonationById(id) {
    const res = await apiClient.get(`/donations/${id}`);
    return res.data.donation;
  },

  async createDonation(donationData) {
    const res = await apiClient.post('/donations', donationData);
    return res.data.donation;
  },

  async updateDonation(id, updates) {
    const res = await apiClient.patch(`/donations/${id}`, updates);
    return res.data.donation;
  },

  async deleteDonation(id) {
    return apiClient.delete(`/donations/${id}`);
  }
};
