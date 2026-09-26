import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Donation } from '../src/models/Donation.js';
import { Match } from '../src/models/Match.js';
import { Delivery } from '../src/models/Delivery.js';
import { generateToken } from '../src/services/authService.js';

describe('TASK 03 - Matching Engine API & Security Test Suite', () => {
  let donorUser, donorToken;
  let otherDonorUser, otherDonorToken;
  let shelterUserA, shelterTokenA;
  let shelterUserB, shelterTokenB;
  let driverUser, driverToken;
  let adminUser, adminToken;

  let activeDonation;
  let expiredDonation;
  let farAwayShelter;

  beforeAll(async () => {
    await connectDB();

    // Clean test collections
    await Promise.all([
      User.deleteMany({ email: /@matchingtest\.com$/ }),
      Donation.deleteMany({ contactInfo: 'MATCH_TEST' }),
      Match.deleteMany({}),
      Delivery.deleteMany({})
    ]);

    const passwordHash = await User.hashPassword('password123');

    // Create Donors
    donorUser = await User.create({
      name: 'Primary Donor Bistro',
      email: 'donor1@matchingtest.com',
      passwordHash,
      role: 'DONOR',
      organizationName: 'Primary Donor Bistro',
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] } // SF City Hall
    });
    donorToken = generateToken(donorUser);

    otherDonorUser = await User.create({
      name: 'Other Donor Cafe',
      email: 'donor2@matchingtest.com',
      passwordHash,
      role: 'DONOR',
      organizationName: 'Other Donor Cafe',
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] }
    });
    otherDonorToken = generateToken(otherDonorUser);

    // Create Shelters
    // Shelter A: Close (0.5 km), accepts Prepared Meals, ample capacity (40 slots)
    shelterUserA = await User.create({
      name: 'Downtown Rescue Mission',
      email: 'shelterA@matchingtest.com',
      passwordHash,
      role: 'SHELTER',
      organizationName: 'Downtown Rescue Mission',
      capacity: { current: 60, max: 100 },
      foodPreferences: ['Prepared Meals', 'Bakery'],
      isAvailable: true,
      location: { type: 'Point', coordinates: [-122.4150, 37.7780] }
    });
    shelterTokenA = generateToken(shelterUserA);

    // Shelter B: 1.5 km away, does NOT accept Prepared Meals (only Bakery/Dairy), 30 slots
    shelterUserB = await User.create({
      name: 'Mission Family Pantry',
      email: 'shelterB@matchingtest.com',
      passwordHash,
      role: 'SHELTER',
      organizationName: 'Mission Family Pantry',
      capacity: { current: 20, max: 50 },
      foodPreferences: ['Bakery', 'Dairy'],
      isAvailable: true,
      location: { type: 'Point', coordinates: [-122.4089, 37.7833] }
    });
    shelterTokenB = generateToken(shelterUserB);

    // Far-away shelter: 100 km away (outside 50 km max radius)
    farAwayShelter = await User.create({
      name: 'Remote Mountain Shelter',
      email: 'remoteshelter@matchingtest.com',
      passwordHash,
      role: 'SHELTER',
      organizationName: 'Remote Mountain Shelter',
      capacity: { current: 10, max: 100 },
      foodPreferences: ['Prepared Meals'],
      isAvailable: true,
      location: { type: 'Point', coordinates: [-121.5000, 38.5000] } // Sacramento area (~100km)
    });

    // Create Admin
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@matchingtest.com',
      passwordHash,
      role: 'ADMIN'
    });
    adminToken = generateToken(adminUser);

    // Create Active Valid Donation
    activeDonation = await Donation.create({
      donorId: donorUser._id,
      donorName: donorUser.name,
      foodType: 'Prepared Meals',
      foodName: 'Nutritious Hot Meal Trays',
      quantity: 25,
      unit: 'meals',
      pickupLocation: '100 Main St, Kitchen Exit',
      availableUntil: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours in future
      description: 'Cooked vegetarian meals ready for immediate pickup',
      contactInfo: 'MATCH_TEST',
      status: 'POSTED',
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] }
    });

    // Create Expired Donation
    expiredDonation = await Donation.create({
      donorId: donorUser._id,
      donorName: donorUser.name,
      foodType: 'Prepared Meals',
      foodName: 'Expired Casserole Trays',
      quantity: 15,
      unit: 'meals',
      pickupLocation: '100 Main St, Kitchen Exit',
      availableUntil: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes in past
      description: 'Expired batch that must be rejected by food safety rules',
      contactInfo: 'MATCH_TEST',
      status: 'POSTED',
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] }
    });
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ email: /@matchingtest\.com$/ }),
      Donation.deleteMany({ contactInfo: 'MATCH_TEST' }),
      Match.deleteMany({}),
      Delivery.deleteMany({})
    ]);
    await disconnectDB();
  });

  describe('1. POST /api/matches/find - Core Matching Endpoint', () => {
    it('returns ranked candidates for a valid donation', async () => {
      const res = await request(app)
        .post('/api/matches/find')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ donationId: activeDonation._id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.donationId).toBe(activeDonation._id.toString());
      expect(Array.isArray(res.body.data.matches)).toBe(true);

      // Shelter A accepts Prepared Meals and is close, so it should be included
      const shelterAMatch = res.body.data.matches.find(
        m => m.shelter._id.toString() === shelterUserA._id.toString()
      );
      expect(shelterAMatch).toBeDefined();
      expect(shelterAMatch.score).toBeGreaterThan(60);
      expect(shelterAMatch.distanceKm).toBeLessThan(2.0);
      expect(shelterAMatch.foodCompatibility).toBe('Direct Dietary Match');
      expect(shelterAMatch.capacityCompatibility).toBe('Sufficient Capacity');
      expect(shelterAMatch.reasons.length).toBeGreaterThanOrEqual(4);

      // Remote shelter (100km away) MUST NOT be included (exceeds 50km radius)
      const remoteMatch = res.body.data.matches.find(
        m => m.shelter._id.toString() === farAwayShelter._id.toString()
      );
      expect(remoteMatch).toBeUndefined();

      // Shelter B does NOT accept Prepared Meals, so it MUST NOT be included
      const shelterBMatch = res.body.data.matches.find(
        m => m.shelter._id.toString() === shelterUserB._id.toString()
      );
      expect(shelterBMatch).toBeUndefined();
    });

    it('rejects expired donations strictly with 400 Bad Request for food safety', async () => {
      const res = await request(app)
        .post('/api/matches/find')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ donationId: expiredDonation._id });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('expired');
    });

    it('returns 400 for invalid/malformed donation ID', async () => {
      const res = await request(app)
        .post('/api/matches/find')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ donationId: 'invalid-non-hex-id' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 for nonexistent donation ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post('/api/matches/find')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ donationId: fakeId });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });

    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/matches/find')
        .send({ donationId: activeDonation._id });

      expect(res.status).toBe(401);
    });
  });

  describe('2. Security & IDOR Verification', () => {
    it('prevents a donor from querying matching for another donor listing (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/matches/find')
        .set('Authorization', `Bearer ${otherDonorToken}`) // Different donor
        .send({ donationId: activeDonation._id });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('blocks NoSQL injection operator in body payload', async () => {
      const res = await request(app)
        .post('/api/matches/find')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ donationId: { $ne: null } });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Match Acceptance & Race Condition Handling', () => {
    let createdMatch;

    beforeAll(async () => {
      // Create a test match document for Shelter A
      createdMatch = await Match.create({
        donationId: activeDonation._id,
        shelterId: shelterUserA._id,
        donorName: donorUser.name,
        shelterName: shelterUserA.name,
        foodType: activeDonation.foodType,
        foodName: activeDonation.foodName,
        quantity: `${activeDonation.quantity} ${activeDonation.unit}`,
        distance: '0.5 km (straight-line)',
        distanceMiles: 0.3,
        distanceKm: 0.5,
        expiry: 'Available for 5 hours',
        matchScore: 92,
        reasons: ['Within 0.5 km', 'Sufficient capacity', 'Direct match'],
        status: 'PENDING'
      });
    });

    it('allows matched shelter to successfully accept donation', async () => {
      const res = await request(app)
        .post(`/api/matches/${createdMatch._id}/accept`)
        .set('Authorization', `Bearer ${shelterTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.match.status).toBe('ACCEPTED');
      expect(res.body.data.delivery).toBeDefined();
      expect(res.body.data.delivery.status).toBe('DRIVER_ASSIGNED');

      // Verify donation in DB was updated to DRIVER_ASSIGNED
      const updatedDonation = await Donation.findById(activeDonation._id);
      expect(updatedDonation.status).toBe('DRIVER_ASSIGNED');
      expect(updatedDonation.matchedShelterId.toString()).toBe(shelterUserA._id.toString());
    });

    it('prevents duplicate acceptance on already accepted match (400)', async () => {
      const res = await request(app)
        .post(`/api/matches/${createdMatch._id}/accept`)
        .set('Authorization', `Bearer ${shelterTokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already been accepted');
    });

    it('prevents an unauthorized shelter from claiming another shelter match (403 Forbidden)', async () => {
      // Create another match targeted to Shelter A
      const freshDonation = await Donation.create({
        donorId: donorUser._id,
        donorName: donorUser.name,
        foodType: 'Bakery',
        foodName: 'Artisan Bread',
        quantity: 10,
        unit: 'lbs',
        pickupLocation: '100 Main St',
        availableUntil: new Date(Date.now() + 8 * 60 * 60 * 1000),
        description: 'Fresh bread',
        contactInfo: 'MATCH_TEST',
        status: 'POSTED'
      });

      const matchForA = await Match.create({
        donationId: freshDonation._id,
        shelterId: shelterUserA._id,
        foodType: 'Bakery',
        foodName: 'Artisan Bread',
        quantity: '10 lbs',
        distance: '0.5 km',
        distanceMiles: 0.3,
        expiry: 'Available',
        matchScore: 88,
        reasons: ['Reason 1'],
        status: 'PENDING'
      });

      // Shelter B attempts to claim Shelter A's match
      const res = await request(app)
        .post(`/api/matches/${matchForA._id}/accept`)
        .set('Authorization', `Bearer ${shelterTokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('handles race conditions: rejects claim if donation was already claimed by another party (409 Conflict)', async () => {
      const contestedDonation = await Donation.create({
        donorId: donorUser._id,
        donorName: donorUser.name,
        foodType: 'Bakery',
        foodName: 'Contested Croissants',
        quantity: 20,
        unit: 'boxes',
        pickupLocation: 'Bakery St',
        availableUntil: new Date(Date.now() + 6 * 60 * 60 * 1000),
        description: 'Warm croissants',
        contactInfo: 'MATCH_TEST',
        status: 'POSTED'
      });

      // Create two competing matches for this single donation
      const match1 = await Match.create({
        donationId: contestedDonation._id,
        shelterId: shelterUserA._id,
        foodType: 'Bakery',
        foodName: 'Contested Croissants',
        quantity: '20 boxes',
        distance: '0.5 km',
        distanceMiles: 0.3,
        expiry: 'Available',
        matchScore: 90,
        reasons: ['R1'],
        status: 'PENDING'
      });

      const match2 = await Match.create({
        donationId: contestedDonation._id,
        shelterId: shelterUserB._id,
        foodType: 'Bakery',
        foodName: 'Contested Croissants',
        quantity: '20 boxes',
        distance: '1.2 km',
        distanceMiles: 0.7,
        expiry: 'Available',
        matchScore: 85,
        reasons: ['R2'],
        status: 'PENDING'
      });

      // Shelter A claims it first
      const res1 = await request(app)
        .post(`/api/matches/${match1._id}/accept`)
        .set('Authorization', `Bearer ${shelterTokenA}`);
      expect(res1.status).toBe(200);

      // Shelter B attempts to claim the exact same donation almost simultaneously
      const res2 = await request(app)
        .post(`/api/matches/${match2._id}/accept`)
        .set('Authorization', `Bearer ${shelterTokenB}`);

      // Expect conflict or rejection because donation is no longer POSTED/MATCHED, or match has been expired
      expect([400, 409]).toContain(res2.status);
      expect(res2.body.success).toBe(false);
      expect(res2.body.message).toMatch(/(already been claimed|no longer available|no longer valid)/i);
    });

    it('rejects acceptance if donation has expired in the interim', async () => {
      const expiredBatch = await Donation.create({
        donorId: donorUser._id,
        donorName: donorUser.name,
        foodType: 'Prepared Meals',
        foodName: 'Cold Stew',
        quantity: 10,
        unit: 'meals',
        pickupLocation: 'St',
        availableUntil: new Date(Date.now() - 5000), // Expired
        description: 'Expired',
        contactInfo: 'MATCH_TEST',
        status: 'POSTED'
      });

      const expiredMatch = await Match.create({
        donationId: expiredBatch._id,
        shelterId: shelterUserA._id,
        foodType: 'Prepared Meals',
        foodName: 'Cold Stew',
        quantity: '10 meals',
        distance: '0.5 km',
        distanceMiles: 0.3,
        expiry: 'Expired',
        matchScore: 70,
        reasons: ['R1'],
        status: 'PENDING'
      });

      const res = await request(app)
        .post(`/api/matches/${expiredMatch._id}/accept`)
        .set('Authorization', `Bearer ${shelterTokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('expired');
    });
  });
});
