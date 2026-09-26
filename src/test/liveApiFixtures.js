import { vi } from 'vitest';
import { authApi, deliveryApi, donationApi, matchApi, shelterApi } from '../services/api';

// Isolated, plausible backend responses. No simulated records are shown in production.
export const testDriver = { _id: '507f1f77bcf86cd799439011', name: 'Test Driver', email: 'driver@test.invalid', role: 'DRIVER' };
export const testShelter = { _id: '507f1f77bcf86cd799439012', name: 'Test Shelter', email: 'shelter@test.invalid', role: 'SHELTER' };
export const testDelivery = {
  _id: '507f1f77bcf86cd799439013', status: 'DRIVER_ASSIGNED', driverId: testDriver._id,
  pickup: 'Test Donor', pickupAddress: '100 Main St', pickupCoordinates: [-122.4194, 37.7749],
  destination: 'Test Shelter', destinationAddress: '200 Main St', destinationCoordinates: [-122.4150, 37.7780],
  food: 'Prepared Meals', quantity: '10 meals', deadline: 'Tomorrow 8 PM', distanceKm: 1,
};
export function mockBackend({ user = null, deliveries = [], capacity = null } = {}) {
  vi.spyOn(authApi, 'getMe').mockResolvedValue(user);
  vi.spyOn(authApi, 'login').mockRejectedValue(new Error('Invalid email or password.'));
  vi.spyOn(donationApi, 'getDonations').mockResolvedValue({ donations: [] });
  vi.spyOn(deliveryApi, 'getDeliveries').mockResolvedValue(deliveries);
  vi.spyOn(deliveryApi, 'updateStatus').mockImplementation(async (id, status) => ({
    ...deliveries.find(d => d._id === id), status,
  }));
  vi.spyOn(matchApi, 'getMatches').mockResolvedValue([]);
  vi.spyOn(shelterApi, 'getShelterById').mockResolvedValue({
    capacity: capacity || { current: 0, max: 100 }, preferredRadiusMiles: 8, foodPreferences: ['Prepared Meals'],
  });
  vi.spyOn(shelterApi, 'updateCapacity').mockResolvedValue({});
}
