import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Donation } from '../src/models/Donation.js';
import { Match } from '../src/models/Match.js';
import { Delivery } from '../src/models/Delivery.js';

describe('RescueRoute Backend API Test Suite', () => {
  let donorToken;
  let shelterToken;
  let driverToken;
  let anotherDonorToken;
  let createdDonationId;
  let createdMatchId;
  let createdDeliveryId;
  let shelterUserId;

  beforeAll(async () => {
    // Connect to test database
    await connectDB('mongodb://localhost:27017/rescueroute_test');
    await Promise.all([
      User.deleteMany({}),
      Donation.deleteMany({}),
      Match.deleteMany({}),
      Delivery.deleteMany({})
    ]);

    // Create test accounts
    // 1. Donor
    const donorRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Bistro',
        email: 'donor@test.com',
        password: 'password123',
        role: 'DONOR'
      });
    donorToken = donorRes.body.data.token;

    // 2. Shelter
    const shelterRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Hope Shelter',
        email: 'shelter@test.com',
        password: 'password123',
        role: 'SHELTER',
        capacity: { current: 50, max: 100 }
      });
    shelterToken = shelterRes.body.data.token;
    shelterUserId = shelterRes.body.data.user._id;

    // 3. Driver
    const driverRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Driver',
        email: 'driver@test.com',
        password: 'password123',
        role: 'DRIVER'
      });
    driverToken = driverRes.body.data.token;

    // 4. Another Donor (for IDOR checks)
    const otherDonorRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Other Bistro',
        email: 'otherdonor@test.com',
        password: 'password123',
        role: 'DONOR'
      });
    anotherDonorToken = otherDonorRes.body.data.token;
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({}),
      Donation.deleteMany({}),
      Match.deleteMany({}),
      Delivery.deleteMany({})
    ]);
    await disconnectDB();
  });

  // 1. Health Check
  describe('Health Check API', () => {
    it('GET /api/health returns 200 with online status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.services.api).toBe('online');
      expect(res.body.services.database).toBe('connected');
    });
  });

  // 2. Authentication & Authorization
  describe('Authentication & Authorization', () => {
    it('POST /api/auth/login succeeds with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'donor@test.com',
          password: 'password123'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('POST /api/auth/login fails with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'donor@test.com',
          password: 'wrongpassword'
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/register rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Bistro',
          email: 'donor@test.com',
          password: 'password123',
          role: 'DONOR'
        });
      expect(res.status).toBe(409);
    });

    it('GET /api/auth/me returns authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${donorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('donor@test.com');
    });

    it('GET /api/auth/me rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  // 3. Donations Management & Ownership Checks
  describe('Donations API', () => {
    it('POST /api/donations creates donation and generates matches', async () => {
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          foodType: 'Prepared Meals',
          foodName: 'Nutritious Veggie Stew',
          quantity: 40,
          unit: 'meals',
          pickupLocation: '123 Market St',
          availableUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          description: 'Sealed containers at safe holding temp',
          contactInfo: 'Chef Mike (555) 123-4567'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.donation.foodName).toBe('Nutritious Veggie Stew');
      expect(res.body.data.donation.status).toBe('POSTED');
      createdDonationId = res.body.data.donation._id;
    });

    it('POST /api/donations rejects invalid quantity', async () => {
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          foodType: 'Prepared Meals',
          foodName: 'Bad Quantity Soup',
          quantity: -5,
          unit: 'meals',
          pickupLocation: '123 Market St',
          availableUntil: new Date().toISOString(),
          description: 'desc',
          contactInfo: 'contact'
        });

      expect(res.status).toBe(400);
    });

    it('POST /api/donations rejects non-donor role (e.g. driver)', async () => {
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          foodType: 'Prepared Meals',
          foodName: 'Unauthorized Post',
          quantity: 20,
          unit: 'meals',
          pickupLocation: '123 Market St',
          availableUntil: new Date().toISOString(),
          description: 'desc',
          contactInfo: 'contact'
        });

      expect(res.status).toBe(403);
    });

    it('PATCH /api/donations/:id prevents IDOR attack from another donor', async () => {
      const res = await request(app)
        .patch(`/api/donations/${createdDonationId}`)
        .set('Authorization', `Bearer ${anotherDonorToken}`)
        .send({
          status: 'CANCELLED'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('GET /api/donations returns paginated donations', async () => {
      const res = await request(app)
        .get('/api/donations?page=1&limit=10')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.donations)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('GET /api/donations/:id rejects invalid hex ObjectId', async () => {
      const res = await request(app)
        .get('/api/donations/not-a-valid-id')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid ID format');
    });
  });

  // 4. Matches API
  describe('Matches API', () => {
    it('GET /api/matches returns generated match recommendations for shelter', async () => {
      const res = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${shelterToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.matches)).toBe(true);
      expect(res.body.data.matches.length).toBeGreaterThan(0);
      createdMatchId = res.body.data.matches[0]._id;
    });

    it('PATCH /api/matches/:id/accept accepts match and creates delivery', async () => {
      const res = await request(app)
        .patch(`/api/matches/${createdMatchId}/accept`)
        .set('Authorization', `Bearer ${shelterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.delivery).toBeDefined();
      expect(res.body.data.delivery.status).toBe('DRIVER_ASSIGNED');
      createdDeliveryId = res.body.data.delivery._id;
    });
  });

  // 5. Deliveries API & Lifecycle Transitions
  describe('Deliveries API', () => {
    it('GET /api/deliveries retrieves assigned routes for driver', async () => {
      const res = await request(app)
        .get('/api/deliveries')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.deliveries)).toBe(true);
    });

    it('PATCH /api/deliveries/:id/status transitions from DRIVER_ASSIGNED to PICKED_UP', async () => {
      const res = await request(app)
        .patch(`/api/deliveries/${createdDeliveryId}/status`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ status: 'PICKED_UP' });

      expect(res.status).toBe(200);
      expect(res.body.data.delivery.status).toBe('PICKED_UP');
    });

    it('PATCH /api/deliveries/:id/status transitions from PICKED_UP to DELIVERED', async () => {
      const res = await request(app)
        .patch(`/api/deliveries/${createdDeliveryId}/status`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ status: 'DELIVERED' });

      expect(res.status).toBe(200);
      expect(res.body.data.delivery.status).toBe('DELIVERED');
    });

    it('PATCH /api/deliveries/:id/status rejects illegal transition from DELIVERED back to DRIVER_ASSIGNED', async () => {
      const res = await request(app)
        .patch(`/api/deliveries/${createdDeliveryId}/status`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ status: 'DRIVER_ASSIGNED' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Illegal status transition');
    });
  });

  // 6. Shelter Capacity API
  describe('Shelter Capacity API', () => {
    it('PATCH /api/shelters/:id/capacity updates capacity settings', async () => {
      const res = await request(app)
        .patch(`/api/shelters/${shelterUserId}/capacity`)
        .set('Authorization', `Bearer ${shelterToken}`)
        .send({
          currentCapacity: 80,
          maxCapacity: 120,
          preferredRadiusMiles: 12
        });

      expect(res.status).toBe(200);
      expect(res.body.data.shelter.capacity.current).toBe(80);
      expect(res.body.data.shelter.capacity.max).toBe(120);
    });

    it('PATCH /api/shelters/:id/capacity rejects currentCapacity exceeding maxCapacity', async () => {
      const res = await request(app)
        .patch(`/api/shelters/${shelterUserId}/capacity`)
        .set('Authorization', `Bearer ${shelterToken}`)
        .send({
          currentCapacity: 200,
          maxCapacity: 100
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Current capacity cannot exceed maximum capacity');
    });
  });

  // 7. Impact Dashboard API
  describe('Impact Dashboard API', () => {
    it('GET /api/dashboard/impact returns city-wide aggregated metrics', async () => {
      const res = await request(app).get('/api/dashboard/impact');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalMealsRescued).toBeGreaterThan(0);
      expect(res.body.data.metrics.co2eAvoidedKg).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.categoryDistribution)).toBe(true);
      expect(Array.isArray(res.body.data.activityTimeline)).toBe(true);
    });
  });

  // 8. NoSQL Injection & Sanitization
  describe('Security & Injection Protection', () => {
    it('Rejects malicious request with NoSQL query operator $gt in body', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $gt: '' },
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('prohibited');
    });

    it('Returns 404 for undefined endpoints', async () => {
      const res = await request(app).get('/api/undefined-endpoint-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
