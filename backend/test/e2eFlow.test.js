import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Donation } from '../src/models/Donation.js';
import { Match } from '../src/models/Match.js';
import { Delivery } from '../src/models/Delivery.js';
import { FoodRequest } from '../src/models/FoodRequest.js';

describe('RescueRoute Complete End-to-End Production Verification Flow', () => {
  let donorToken, shelterToken, driverToken, adminToken;
  let donorUser, shelterUser, driverUser, adminUser;
  let createdDonationId, matchedId, createdDeliveryId;

  beforeAll(async () => {
    await connectDB();

    // Clean test accounts
    await Promise.all([
      User.deleteMany({ email: /@e2eprodtest\.com$/ }),
      Donation.deleteMany({ contactInfo: /E2E_PROD/ }),
      Match.deleteMany({}),
      Delivery.deleteMany({ donorContact: /E2E_PROD/ }),
      FoodRequest.deleteMany({ contactEmail: /@e2eprodtest\.com$/ })
    ]);

    const passwordHash = await User.hashPassword('password123');

    donorUser = await User.create({
      name: 'Organic Harvest Bistro',
      email: 'donor@e2eprodtest.com',
      passwordHash,
      role: 'DONOR',
      organizationName: 'Organic Harvest Bistro',
      phone: '(555) 123-4567',
      address: '100 Market St, San Francisco, CA',
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] }
    });

    shelterUser = await User.create({
      name: 'Central Mission Shelter',
      email: 'shelter@e2eprodtest.com',
      passwordHash,
      role: 'SHELTER',
      organizationName: 'Central Mission Shelter',
      phone: '(555) 765-4321',
      address: '250 Mission St, San Francisco, CA',
      capacity: { current: 20, max: 100 },
      foodPreferences: ['Prepared Meals', 'Bakery', 'Fruits & Vegetables', 'Dairy'],
      preferredRadiusMiles: 15,
      isAvailable: true,
      location: { type: 'Point', coordinates: [-122.4150, 37.7780] }
    });

    // Mark other background drivers as unavailable for the duration of this e2e test
    await User.updateMany(
      { role: 'DRIVER' },
      { $set: { isAvailable: false } }
    );

    driverUser = await User.create({
      name: 'Dave Courier',
      email: 'driver@e2eprodtest.com',
      passwordHash,
      role: 'DRIVER',
      phone: '(555) 987-6543',
      isAvailable: true,
      driverDetails: { activePickups: 0, completedDeliveries: 0 },
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] }
    });

    adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@e2eprodtest.com',
      passwordHash,
      role: 'ADMIN'
    });
  });

  afterAll(async () => {
    // Restore driver availability
    await User.updateMany(
      { role: 'DRIVER' },
      { $set: { isAvailable: true } }
    );

    await Promise.all([
      User.deleteMany({ email: /@e2eprodtest\.com$/ }),
      Donation.deleteMany({ contactInfo: /E2E_PROD/ }),
      Match.deleteMany({}),
      Delivery.deleteMany({ donorContact: /E2E_PROD/ }),
      FoodRequest.deleteMany({ contactEmail: /@e2eprodtest\.com$/ })
    ]);
    await disconnectDB();
  });

  it('Step 1: Real Authentication for Donor, Shelter, Driver, and Admin', async () => {
    const donorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'donor@e2eprodtest.com', password: 'password123' });
    expect(donorLogin.status).toBe(200);
    expect(donorLogin.body.data.token).toBeDefined();
    donorToken = donorLogin.body.data.token;

    const shelterLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'shelter@e2eprodtest.com', password: 'password123' });
    expect(shelterLogin.status).toBe(200);
    shelterToken = shelterLogin.body.data.token;

    const driverLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'driver@e2eprodtest.com', password: 'password123' });
    expect(driverLogin.status).toBe(200);
    driverToken = driverLogin.body.data.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@e2eprodtest.com', password: 'password123' });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.data.token;
  });

  it('Step 2: AI-Assisted Donation Parsing (Server-Side Endpoint)', async () => {
    const parseRes = await request(app)
      .post('/api/ai/parse-donation')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ text: 'We have 35 trays of freshly baked vegetable lasagna ready for pickup until 9 PM.' });

    expect([200, 503]).toContain(parseRes.status);
    if (parseRes.status === 200) {
      expect(parseRes.body.success).toBe(true);
      expect(parseRes.body.data.quantity).toBe(35);
    } else {
      expect(parseRes.body.success).toBe(false);
      expect(parseRes.body.message || parseRes.body.error).toBeDefined();
    }
  });

  it('Step 3: Donor Creates Donation with Dietary Classification (Vegetarian)', async () => {
    const createRes = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        foodType: 'Prepared Meals',
        dietaryType: 'Vegetarian',
        foodName: 'Vegetable Lasagna & Herb Focaccia',
        quantity: 35,
        unit: 'meals',
        pickupLocation: '100 Market St, Back Kitchen Dock',
        availableUntil: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
        description: 'Warm vegetarian lasagna trays packaged in thermal food carriers.',
        contactInfo: 'Marcus V. (555) 123-4567 E2E_PROD'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.donation.dietaryType).toBe('Vegetarian');
    expect(createRes.body.data.donation.status).toBe('POSTED');

    createdDonationId = createRes.body.data.donation._id;
  });

  it('Step 4: Shelter Views Matches and Accepts Algorithmic Match', async () => {
    const matchesRes = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${shelterToken}`);

    expect(matchesRes.status).toBe(200);
    const matches = matchesRes.body.data.matches;
    expect(Array.isArray(matches)).toBe(true);
    expect(matches.length).toBeGreaterThan(0);

    const targetMatch = matches.find(m =>
      m.donationId?._id?.toString() === createdDonationId.toString() || m.donationId === createdDonationId
    ) || matches[0];

    matchedId = targetMatch._id;

    // Shelter accepts match
    const acceptRes = await request(app)
      .post(`/api/matches/${matchedId}/accept`)
      .set('Authorization', `Bearer ${shelterToken}`);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.success).toBe(true);
    expect(acceptRes.body.data.delivery).toBeDefined();

    createdDeliveryId = acceptRes.body.data.delivery._id;
  });

  it('Step 5: Driver Claims Delivery Route', async () => {
    const claimRes = await request(app)
      .post(`/api/deliveries/${createdDeliveryId}/assign`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(claimRes.status).toBe(200);
    expect(claimRes.body.success).toBe(true);
    expect(claimRes.body.data.delivery.status).toBe('DRIVER_ASSIGNED');
    expect(claimRes.body.data.delivery.driverName).toBe('Dave Courier');
  });

  it('Step 6: Driver Picks Up and Marks Delivered', async () => {
    // Picked Up
    const pickupRes = await request(app)
      .patch(`/api/deliveries/${createdDeliveryId}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'PICKED_UP' });

    expect(pickupRes.status).toBe(200);
    expect(pickupRes.body.data.delivery.status).toBe('PICKED_UP');

    // Delivered
    const deliverRes = await request(app)
      .patch(`/api/deliveries/${createdDeliveryId}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'DELIVERED' });

    expect(deliverRes.status).toBe(200);
    expect(deliverRes.body.data.delivery.status).toBe('DELIVERED');
  });

  it('Step 7: Public Submits Food Request & Admin Updates Status', async () => {
    // Public unauthenticated request
    const pubReqRes = await request(app)
      .post('/api/requests')
      .send({
        recipientName: 'Mission Community Center',
        organizationName: 'Mission Outreach',
        contactPhone: '(555) 777-8888',
        contactEmail: 'outreach@e2eprodtest.com',
        deliveryAddress: '2588 Mission Street, San Francisco, CA',
        latitude: 37.7550,
        longitude: -122.4190,
        foodCategory: 'Prepared Meals',
        quantityNeeded: 30,
        unit: 'meals',
        urgency: 'HIGH',
        dietaryRestrictions: 'Vegetarian'
      });

    expect(pubReqRes.status).toBe(201);
    const reqId = pubReqRes.body.data._id;

    // Admin approves request
    const approveRes = await request(app)
      .patch(`/api/requests/${reqId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('APPROVED');
  });

  it('Step 8: Impact Dashboard Reflects Real Verified Metrics', async () => {
    const impactRes = await request(app).get('/api/dashboard/impact');

    expect(impactRes.status).toBe(200);
    expect(impactRes.body.success).toBe(true);
    expect(impactRes.body.data.metrics.completedDeliveries).toBeGreaterThanOrEqual(1);
    expect(impactRes.body.data.metrics.totalMealsRescued).toBeGreaterThanOrEqual(30);
    expect(impactRes.body.data.metrics.co2eAvoidedKg).toBeGreaterThan(0);
    expect(Array.isArray(impactRes.body.data.networkMarkers)).toBe(true);
  });
});
