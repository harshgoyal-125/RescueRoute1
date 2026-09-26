import { deliveryApi } from './api/deliveryApi';

export const deliveryService = {
  async getDeliveries() {
    return deliveryApi.getDeliveries();
  },

  async getDeliveryById(id) {
    return deliveryApi.getDeliveryById(id);
  },

  async updateDeliveryStatus(id, status) {
    return deliveryApi.updateStatus(id, status);
  },

  async assignDelivery(id) {
    return deliveryApi.assignDelivery(id);
  }
};
