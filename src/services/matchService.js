import { matchApi } from './api/matchApi';

export const matchService = {
  async getMatches() {
    return matchApi.getMatches();
  },

  async acceptMatch(id) {
    return matchApi.acceptMatch(id);
  }
};
