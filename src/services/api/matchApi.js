import { apiClient } from './client';

export const matchApi = {
  async getMatches() {
    const res = await apiClient.get('/matches');
    return res.data.matches;
  },

  async getMatchById(id) {
    const res = await apiClient.get(`/matches/${id}`);
    return res.data.match;
  },

  async findMatches(donationId) {
    const res = await apiClient.post('/matches/find', { donationId });
    return res.data;
  },

  async acceptMatch(id) {
    const res = await apiClient.post(`/matches/${id}/accept`);
    return res.data;
  }
};
