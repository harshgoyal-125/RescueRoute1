import { shelterApi } from './api/shelterApi';

export const shelterService = {
  async getShelterById(id) {
    return shelterApi.getShelterById(id);
  },

  async updateCapacity(id, capacityData) {
    return shelterApi.updateCapacity(id, capacityData);
  }
};
