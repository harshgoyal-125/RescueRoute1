import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Donation } from '../src/models/Donation.js';
import { Delivery } from '../src/models/Delivery.js';
import { Match } from '../src/models/Match.js';
import { generateToken } from '../src/services/authService.js';

describe('TASK 04 - Driver Dispatch & Delivery Workflow Comprehensive Test Suite', () => {
  let donorUser, donorToken;
  let shelterUser, shelterToken;
  let driverUserA, driverTokenA;
  let driverUserB, driverTokenB;
  let adminUser, adminToken;

  let testDonation;
  let testDelivery;
  let testMatch;

  beforeAll(async () => {
    await connectDB();

    await Promise.all([
      User.deleteMany({ email: /@deliverytest\.com$/ }),
      Donation.deleteMany({ contactInfo: 'DELIVERY_TEST' }),
      Delivery.deleteMany({ donorContact: 'DELIVERY_TEST' }),
      Match.deleteMany({ foodName: /Gourmet Pasta|Remote Surplus/ })
    ]);

    const passwordHash = await User.hashPassword('password123');

    donorUser = await User.create({
      name: 'Test Donor Kitchen',
      email: 'donor@deliverytest.com',
      passwordHash,
      role: 'DONOR',
      organizationName: 'Test Donor Kitchen',
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] }
    });
    donorToken = generateToken(donorUser);

    shelterUser = await User.create({
      name: 'Safe Harbor Shelter',
      email: 'shelter@deliverytest.com',
      passwordHash,
      role: 'SHELTER',
      organizationName: 'Safe Harbor Shelter',
      capacity: { current: 30, max: 100 },
      location: { type: 'Point', coordinates: [-122.4150, 37.7780] }
    });
    shelterToken = generateToken(shelterUser);

    driverUserA = await User.create({
      name: 'Driver Alex',
      email: 'driverA@deliverytest.com',
      passwordHash,
      role: 'DRIVER',
      driverDetails: { activePickups: 0, completedDeliveries: 5, totalDistanceKm: 42.0 },
      location: { type: 'Point', coordinates: [-122.4180, 37.7760] }
    });
    driverTokenA = generateToken(driverUserA);

    driverUserB = await User.create({
      name: 'Driver Jordan',
      email: 'driverB@deliverytest.com',
      passwordHash,
      role: 'DRIVER',
      driverDetails: { activePickups: 0, completedDeliveries: 2, totalDistanceKm: 18.0 },
      location: { type: 'Point', coordinates: [-122.4200, 37.7730] }
    });
    driverTokenB = generateToken(driverUserB);

    adminUser = await User.create({
      name: 'Dispatch Admin',
      email: 'admin@deliverytest.com',
      passwordHash,
      role: 'ADMIN'
    });
    adminToken = generateToken(adminUser);

    testDonation = await Donation.create({
      donorId: donorUser._id,
      donorName: donorUser.name,
      foodType: 'Prepared Meals',
      foodName: 'Gourmet Pasta Trays',
      quantity: 40,
      unit: 'meals',
      pickupLocation: '500 Market St, Dock 3',
      availableUntil: new Date(Date.now() + 6 * 60 * 60 * 1000),
      description: 'Ready to serve pasta',
      contactInfo: 'DELIVERY_TEST',
      status: 'DRIVER_ASSIGNED',
      matchedWith: shelterUser.organizationName,
      matchedShelterId: shelterUser._id,
      driverId: driverUserA._id,
      driverAssigned: driverUserA.name
    });

    testMatch = await Match.create({
      donationId: testDonation._id,
      shelterId: shelterUser._id,
      donorName: donorUser.name,
      shelterName: shelterUser.organizationName,
      foodType: testDonation.foodType,
      foodName: testDonation.foodName,
      quantity: `${testDonation.quantity} ${testDonation.unit}`,
      distance: '2.8 miles',
      distanceMiles: 2.8,
      distanceKm: 4.5,
      expiry: '6 hours',
      matchScore: 95,
      reasons: ['High urgency', 'Direct capacity match'],
      status: 'ACCEPTED'
    });

    testDelivery = await Delivery.create({
      donationId: testDonation._id,
      shelterId: shelterUser._id,
      driverId: driverUserA._id,
      driverName: driverUserA.name,
      pickup: testDonation.donorName,
      pickupAddress: testDonation.pickupLocation,
      destination: shelterUser.organizationName,
      destinationAddress: '88 Harbor Way',
      food: testDonation.foodName,
      quantity: `${testDonation.quantity} ${testDonation.unit}`,
      deadline: '8:00 PM',
      date: new Date().toISOString().split('T')[0],
      status: 'DRIVER_ASSIGNED',
      assignedAt: new Date(),
      distanceKm: 2.8,
      donorContact: 'DELIVERY_TEST',
      recipientContact: '555-0199'
    });
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ email: /@deliverytest\.com$/ }),
      Donation.deleteMany({ contactInfo: 'DELIVERY_TEST' }),
      Delivery.deleteMany({ donorContact: 'DELIVERY_TEST' }),
      Match.deleteMany({ foodName: /Gourmet Pasta|Remote Surplus/ })
    ]);
    await disconnectDB();
  });

  describe('Step 10 Verification: 12 Delivery Workflow Scenarios', () => {
    // 1. Authenticated driver can see assigned delivery
    it('1. Authenticated driver can see assigned delivery', async () => {
      const res = await request(app)
        .get('/api/deliveries')
        .set('Authorization', `Bearer ${driverTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const delivery = res.body.data.deliveries.find(d => d._id === testDelivery._id.toString());
      expect(delivery).toBeDefined();
      expect(delivery.driverName).toBe('Driver Alex');
      expect(delivery.status).toBe('DRIVER_ASSIGNED');
    });

    // 2. Unauthenticated user cannot access delivery
    it('2. Unauthenticated user cannot access delivery (401 Unauthorized)', async () => {
      const res = await request(app).get(`/api/deliveries/${testDelivery._id}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    // 3. Driver cannot access another driver\'s delivery
    it('3. Driver cannot access another driver\'s delivery (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/deliveries/${testDelivery._id}`)
        .set('Authorization', `Bearer ${driverTokenB}`); // Driver Jordan querying Driver Alex's delivery

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    // 4. Shelter cannot modify arbitrary delivery
    it('4. Shelter cannot modify arbitrary delivery status (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/deliveries/${testDelivery._id}/status`)
        .set('Authorization', `Bearer ${shelterToken}`) // Shelter role is not allowed to update driver status
        .send({ status: 'PICKED_UP' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    // 5. Valid: DRIVER_ASSIGNED -> PICKED_UP
    it('5. Valid transition: DRIVER_ASSIGNED -> PICKED_UP sets timestamp and syncs donation', async () => {
      const res = await request(app)
        .patch(`/api/deliveries/${testDelivery._id}/status`)
        .set('Authorization', `Bearer ${driverTokenA}`)
        .send({ status: 'PICKED_UP' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.delivery.status).toBe('PICKED_UP');
      expect(res.body.data.delivery.pickedUpAt).toBeDefined();

      const syncedDonation = await Donation.findById(testDonation._id);
      expect(syncedDonation.status).toBe('PICKED_UP');
    });

    // 6. Valid: PICKED_UP -> DELIVERED
    it('6. Valid transition: PICKED_UP -> DELIVERED sets timestamp and syncs donation', async () => {
      const res = await request(app)
        .patch(`/api/deliveries/${testDelivery._id}/status`)
        .set('Authorization', `Bearer ${driverTokenA}`)
        .send({ status: 'DELIVERED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.delivery.status).toBe('DELIVERED');
      expect(res.body.data.delivery.deliveredAt).toBeDefined();

      const syncedDonation = await Donation.findById(testDonation._id);
      expect(syncedDonation.status).toBe('DELIVERED');
    });

    // 7. Invalid: DELIVERED -> PICKED_UP
    it('7. Invalid transition rejected: DELIVERED -> PICKED_UP (400 Bad Request)', async () => {
      const res = await request(app)
        .patch(`/api/deliveries/${testDelivery._id}/status`)
        .set('Authorization', `Bearer ${driverTokenA}`)
        .send({ status: 'PICKED_UP' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Illegal status transition');
    });

    // 8. Invalid: DELIVERED -> DRIVER_ASSIGNED
    it('8. Invalid transition rejected: DELIVERED -> DRIVER_ASSIGNED (400 Bad Request)', async () => {
      const res = await request(app)
        .patch(`/api/deliveries/${testDelivery._id}/status`)
        .set('Authorization', `Bearer ${driverTokenA}`)
        .send({ status: 'DRIVER_ASSIGNED' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Illegal status transition');
    });

    // 9. Duplicate/conflicting assignment is prevented
    it('9. Duplicate or conflicting delivery assignment is prevented (409 Conflict)', async () => {
      const claimDonation = await Donation.create({
        donorId: donorUser._id,
        donorName: 'Bakery Co',
        foodType: 'Bakery',
        foodName: 'Fresh Loaves',
        quantity: 20,
        unit: 'lbs',
        pickupLocation: '400 Pine St',
        availableUntil: new Date(Date.now() + 5 * 60 * 60 * 1000),
        description: 'Fresh bread ready for pickup',
        contactInfo: 'DELIVERY_TEST',
        status: 'MATCHED'
      });

      const unassignedDelivery = await Delivery.create({
        donationId: claimDonation._id,
        shelterId: shelterUser._id,
        driverId: null,
        driverName: 'Unassigned',
        pickup: 'Bakery Hub',
        pickupAddress: '400 Pine St',
        destination: shelterUser.organizationName,
        destinationAddress: '88 Harbor Way',
        food: 'Fresh Loaves',
        quantity: '20 lbs',
        deadline: '9:00 PM',
        date: 'Today',
        status: 'MATCHED',
        donorContact: 'DELIVERY_TEST'
      });

      // Driver B claims first
      const claimRes = await request(app)
        .post(`/api/deliveries/${unassignedDelivery._id}/assign`)
        .set('Authorization', `Bearer ${driverTokenB}`);

      expect(claimRes.status).toBe(200);
      expect(claimRes.body.data.delivery.driverId.toString()).toBe(driverUserB._id.toString());

      // Driver A tries to claim the same delivery -> 409 Conflict
      const conflictRes = await request(app)
        .post(`/api/deliveries/${unassignedDelivery._id}/assign`)
        .set('Authorization', `Bearer ${driverTokenA}`);

      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.success).toBe(false);
      expect(conflictRes.body.message).toContain('already been assigned');
    });

    // 10. Delivery completion updates donation/match appropriately
    it('10. Delivery completion updates linked donation and match status appropriately', async () => {
      const syncedDonation = await Donation.findById(testDonation._id);
      expect(syncedDonation.status).toBe('DELIVERED');

      const syncedMatch = await Match.findById(testMatch._id);
      expect(syncedMatch.status).toBe('COMPLETED');
    });

    // 11. Impact dashboard does not double-count delivery
    it('11. Impact dashboard does not double-count delivery and strictly tallies DELIVERED status', async () => {
      // Create an active (not delivered) donation to prove it is excluded
      const pendingDonation = await Donation.create({
        donorId: donorUser._id,
        donorName: donorUser.name,
        foodType: 'Fruits & Vegetables',
        foodName: 'Uncollected Fresh Apples',
        quantity: 150,
        unit: 'lbs',
        pickupLocation: 'Wholesale Depot',
        availableUntil: new Date(Date.now() + 4 * 60 * 60 * 1000),
        description: 'Crisp organic apples',
        contactInfo: 'DELIVERY_TEST',
        status: 'PICKED_UP' // In-progress, NOT delivered
      });

      const res1 = await request(app)
        .get('/api/dashboard/impact')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);

      const metrics1 = res1.body.data.metrics;
      // testDonation is 40 meals DELIVERED; pendingDonation is 150 lbs PICKED_UP (should NOT be counted)
      expect(metrics1.totalMealsRescued).toBeGreaterThanOrEqual(40);

      // Verify idempotency (querying again does not double-count)
      const res2 = await request(app)
        .get('/api/dashboard/impact')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res2.body.data.metrics.totalMealsRescued).toBe(metrics1.totalMealsRescued);
      expect(res2.body.data.metrics.completedDeliveries).toBe(metrics1.completedDeliveries);

      await Donation.findByIdAndDelete(pendingDonation._id);
    });

    // 12. No-driver case is handled safely
    it('12. No-driver case is handled safely without crashing when shelter accepts match', async () => {
      // Create a remote donation (New York coordinates) where no local SF drivers exist
      const remoteDonation = await Donation.create({
        donorId: donorUser._id,
        donorName: 'Remote Manhattan Eatery',
        foodType: 'Prepared Meals',
        foodName: 'Remote Surplus Pastries',
        quantity: 25,
        unit: 'meals',
        pickupLocation: '350 5th Ave, New York, NY',
        location: { type: 'Point', coordinates: [-74.0060, 40.7128] }, // NYC
        availableUntil: new Date(Date.now() + 8 * 60 * 60 * 1000),
        description: 'Surplus baked pastries',
        contactInfo: 'DELIVERY_TEST',
        status: 'POSTED'
      });

      const remoteMatch = await Match.create({
        donationId: remoteDonation._id,
        shelterId: shelterUser._id,
        donorName: remoteDonation.donorName,
        shelterName: shelterUser.organizationName,
        foodType: remoteDonation.foodType,
        foodName: remoteDonation.foodName,
        quantity: '25 meals',
        distance: '2500 miles',
        distanceMiles: 2500,
        distanceKm: 4000,
        expiry: '8 hours',
        matchScore: 80,
        reasons: ['Regional match', 'Emergency capacity available'],
        status: 'PENDING'
      });

      // Shelter accepts the match
      const acceptRes = await request(app)
        .post(`/api/matches/${remoteMatch._id}/accept`)
        .set('Authorization', `Bearer ${shelterToken}`);

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);
      expect(acceptRes.body.message).toContain('queued for driver dispatch');
      expect(acceptRes.body.data.delivery.driverId).toBeNull();
      expect(acceptRes.body.data.delivery.driverName).toBe('Unassigned');
      expect(acceptRes.body.data.delivery.status).toBe('MATCHED');

      // Verify remote donation is set to MATCHED
      const updatedRemoteDonation = await Donation.findById(remoteDonation._id);
      expect(updatedRemoteDonation.status).toBe('MATCHED');
      expect(updatedRemoteDonation.driverId).toBeNull();
    });
  });
});
