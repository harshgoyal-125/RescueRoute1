import { apiClient } from './client';

export const shelterApi = {
  async getShelters() {
    const res = await apiClient.get('/shelters');
    return res.data.shelters;
  },

  async getShelterById(id) {
    const res = await apiClient.get(`/shelters/${id}`);
    return res.data.shelter;
  },

  async updateCapacity(id, capacityData) {
    const res = await apiClient.patch(`/shelters/${id}/capacity`, capacityData);
    return res.data.shelter;
  }
};
