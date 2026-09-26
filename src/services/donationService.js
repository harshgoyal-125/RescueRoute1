import { donationApi } from './api/donationApi';

export const donationService = {
  async getDonations() {
    return donationApi.getDonations();
  },

  async getDonationById(id) {
    return donationApi.getDonationById(id);
  },

  async createDonation(donationData) {
    return donationApi.createDonation(donationData);
  }
};
