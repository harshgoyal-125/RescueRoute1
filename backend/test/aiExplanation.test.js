import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Donation } from '../src/models/Donation.js';
import { Match } from '../src/models/Match.js';
import { generateToken } from '../src/services/authService.js';
import * as geminiService from '../src/services/geminiService.js';

describe('TASK 06 - AI Match Explanation Test Suite', () => {
  let donorUserA, donorTokenA;
  let donorUserB, donorTokenB;
  let shelterUserA, shelterTokenA;
  let shelterUserB, shelterTokenB;
  let adminUser, adminToken;

  let testDonation;
  let testMatch;

  beforeAll(async () => {
    await connectDB();

    await Promise.all([
      User.deleteMany({ email: /@aiexplain\.com$/ }),
      Donation.deleteMany({ contactInfo: 'AI_EXPLAIN_TEST' }),
      Match.deleteMany({ foodName: 'Vegetable Biryani Trays' })
    ]);

    const passwordHash = await User.hashPassword('password123');

    // Donor A
    donorUserA = await User.create({
      name: 'Curry Kingdom',
      email: 'donorA@aiexplain.com',
      passwordHash,
      role: 'DONOR',
      organizationName: 'Curry Kingdom',
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] }
    });
    donorTokenA = generateToken(donorUserA);

    // Donor B (for IDOR tests)
    donorUserB = await User.create({
      name: 'Green Leaf Cafe',
      email: 'donorB@aiexplain.com',
      passwordHash,
      role: 'DONOR',
      organizationName: 'Green Leaf Cafe',
      location: { type: 'Point', coordinates: [-122.4190, 37.7740] }
    });
    donorTokenB = generateToken(donorUserB);

    // Shelter A
    shelterUserA = await User.create({
      name: 'Hope Shelter',
      email: 'shelterA@aiexplain.com',
      passwordHash,
      role: 'SHELTER',
      organizationName: 'Hope Shelter',
      capacity: { current: 20, max: 80 },
      location: { type: 'Point', coordinates: [-122.4150, 37.7780] }
    });
    shelterTokenA = generateToken(shelterUserA);

    // Shelter B (for IDOR tests)
    shelterUserB = await User.create({
      name: 'Harbor Light Shelter',
      email: 'shelterB@aiexplain.com',
      passwordHash,
      role: 'SHELTER',
      organizationName: 'Harbor Light Shelter',
      capacity: { current: 10, max: 50 },
      location: { type: 'Point', coordinates: [-122.4100, 37.7720] }
    });
    shelterTokenB = generateToken(shelterUserB);

    // Admin
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@aiexplain.com',
      passwordHash,
      role: 'ADMIN'
    });
    adminToken = generateToken(adminUser);

    // Authoritative Donation
    testDonation = await Donation.create({
      donorId: donorUserA._id,
      donorName: donorUserA.organizationName,
      foodType: 'Prepared Meals',
      foodName: 'Vegetable Biryani Trays',
      quantity: 40,
      unit: 'meals',
      pickupLocation: '300 Mission St, Dock 2',
      availableUntil: new Date(Date.now() + 5 * 60 * 60 * 1000),
      description: 'Hot vegetable biryani, temperature controlled.',
      contactInfo: 'AI_EXPLAIN_TEST',
      status: 'MATCHED'
    });

    // Authoritative Match (Deterministic Score = 91)
    testMatch = await Match.create({
      donationId: testDonation._id,
      shelterId: shelterUserA._id,
      donorName: donorUserA.organizationName,
      shelterName: shelterUserA.organizationName,
      foodType: testDonation.foodType,
      foodName: testDonation.foodName,
      quantity: '40 meals',
      distance: '3.2 km',
      distanceMiles: 2.0,
      distanceKm: 3.2,
      expiry: '5 hours',
      matchScore: 91,
      scoreBreakdown: {
        distanceScore: 90,
        capacityScore: 100,
        foodScore: 100,
        urgencyScore: 85,
        needScore: 100
      },
      capacityCompatibility: 'Sufficient Capacity (40 of 60 available)',
      foodCompatibility: 'Direct Match (Prepared Meals)',
      urgency: 'High Need',
      reasons: [
        'Hope Shelter is within 3.2 km',
        'Has available capacity for 40 meals',
        'Dietary preference matches Prepared Meals',
        'High urgent community need'
      ],
      status: 'PENDING'
    });
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ email: /@aiexplain\.com$/ }),
      Donation.deleteMany({ contactInfo: 'AI_EXPLAIN_TEST' }),
      Match.deleteMany({ foodName: 'Vegetable Biryani Trays' })
    ]);
    await disconnectDB();
  });

  describe('Step 17 Verification: Backend Scenarios 1 to 15', () => {
    // 1. Valid match can generate an explanation
    it('1. Valid match generates structured AI explanation', async () => {
      const mockAiOutput = {
        summary: 'Hope Shelter is an exceptional match for this donation because it is located only 3.2 km away, has ample capacity for 40 meals, and has a high urgent community need.',
        reasons: [
          '3.2 km straight-line pickup distance',
          'Ample shelter capacity for 40 meals',
          'Compatible dietary category: Prepared Meals',
          'High current shelter need'
        ],
        isFallback: false
      };

      const spy = vi.spyOn(geminiService, 'generateMatchExplanation').mockResolvedValueOnce(mockAiOutput);

      const res = await request(app)
        .post('/api/ai/explain-match')
        .set('Authorization', `Bearer ${shelterTokenA}`)
        .send({ matchId: testMatch._id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toContain('Hope Shelter is an exceptional match');
      expect(res.body.data.reasons.length).toBeGreaterThanOrEqual(3);

      spy.mockRestore();
    });

    // 2. Missing matchId returns 400
    it('2. Missing matchId returns 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/ai/explain-match')
        .set('Authorization', `Bearer ${shelterTokenA}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('matchId is required');
    });

    // 3. Invalid matchId returns 400
    it('3. Invalid matchId format returns 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/ai/explain-match')
        .set('Authorization', `Bearer ${shelterTokenA}`)
        .send({ matchId: 'invalid-non-object-id' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid matchId format');
    });

    // 4. Nonexistent match returns appropriate error (404)
    it('4. Nonexistent match returns 404 Not Found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post('/api/ai/explain-match')
        .set('Authorization', `Bearer ${shelterTokenA}`)
        .send({ matchId: fakeId });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Match recommendation not found');
    });

    // 5. Unauthorized user cannot access the endpoint (401)
    it('5. Unauthenticated user cannot access the endpoint (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/ai/explain-match')
        .send({ matchId: testMatch._id });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    // 6. User cannot access another user's private match (403 IDOR)
    it('6a. Another shelter cannot access private match records (403 IDOR Forbidden)', async () => {
      const res = await request(app)
        .post('/api/ai/explain-match')
        .set('Authorization', `Bearer ${shelterTokenB}`) // Shelter B attempting to access Shelter A's match
        .send({ matchId: testMatch._id });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('6b. Another donor cannot access unrelated match records (403 IDOR Forbidden)', async () => {
      const res = await request(app)
        .post('/api/ai/explain-match')
        .set('Authorization', `Bearer ${donorTokenB}`) // Donor B attempting to access Donor A's match
        .send({ matchId: testMatch._id });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    // 7. Backend obtains authoritative match data instead of trusting client score
    it('7. Backend obtains authoritative match data instead of trusting client-supplied score/reasons', async () => {
      let capturedPayload = null;
      const spy = vi.spyOn(geminiService, 'generateMatchExplanation').mockImplementation(async (payload) => {
        capturedPayload = payload;
        return { summary: 'Authoritative explanation', reasons: ['Verified authoritative data'] };
      });

      // Client sends forged score of 10 and bogus reasons in request body
      await request(app)
        .post('/api/ai/explain-match')
        .set('Authorization', `Bearer ${donorTokenA}`)
        .send({
          matchId: testMatch._id,
          matchScore: 10, // Client attempts to override score
          reasons: ['Client forged reason']
        });

      expect(capturedPayload).toBeDefined();
      // Must reflect authoritative score (91) from database, NOT client's 10
      expect(capturedPayload.match.matchScore).toBe(91);
      expect(capturedPayload.match.reasons).toEqual(expect.arrayContaining(['Hope Shelter is within 3.2 km']));

      spy.mockRestore();
    });

    // 8. Gemini receives deterministic match information
    it('8. Gemini receives complete deterministic match facts and breakdown', async () => {
      let receivedData = null;
      const spy = vi.spyOn(geminiService, 'generateMatchExplanation').mockImplementation(async (payload) => {
        receivedData = payload;
        return { summary: 'Deterministic data received', reasons: [] };
      });

      await request(app)
        .post('/api/ai/explain-match')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ matchId: testMatch._id });

      expect(receivedData.donation.foodName).toBe('Vegetable Biryani Trays');
      expect(receivedData.shelter.name).toBe('Hope Shelter');
      expect(receivedData.match.distanceKm).toBe(3.2);
      expect(receivedData.match.matchScore).toBe(91);
      expect(receivedData.match.scoreBreakdown.capacity).toBe(100);

      spy.mockRestore();
    });

    // 9. Gemini malformed JSON is handled safely
    it('9. Gemini malformed JSON is handled safely by returning deterministic fallback', async () => {
      const mockBadClient = {
        generateContent: vi.fn().mockResolvedValue('MALFORMED NOT JSON { broken }}}')
      };

      const explanation = await geminiService.generateMatchExplanation(
        {
          shelter: { name: 'Hope Shelter' },
          donation: { foodName: 'Vegetable Biryani' },
          match: { matchScore: 91, distanceKm: 3.2, reasons: ['Close distance', 'High need'] }
        },
        { apiKey: 'test-key', aiClient: mockBadClient }
      );

      expect(explanation).toBeDefined();
      expect(explanation.isFallback).toBe(true);
      expect(explanation.summary).toContain('Hope Shelter was selected');
      expect(explanation.reasons.length).toBeGreaterThanOrEqual(2);
    });

    // 10. Gemini timeout/provider failure is handled safely
    it('10. Gemini timeout or provider failure is handled safely by returning deterministic fallback', async () => {
      const mockFailingClient = {
        generateContent: vi.fn().mockRejectedValue(new Error('Network timeout calling Gemini API'))
      };

      const explanation = await geminiService.generateMatchExplanation(
        {
          shelter: { name: 'Hope Shelter' },
          donation: { foodName: 'Vegetable Biryani' },
          match: { matchScore: 91, distanceKm: 3.2, reasons: ['Good distance'] }
        },
        { apiKey: 'test-key', aiClient: mockFailingClient }
      );

      expect(explanation).toBeDefined();
      expect(explanation.isFallback).toBe(true);
      expect(explanation.summary).toContain('Hope Shelter was selected');
    });

    // 11. AI output validation works
    it('11. AI output validation sanitizes long summaries, reasons, and bounds counts', () => {
      const overLongOutput = {
        summary: 'S'.repeat(600), // Exceeds 500 chars
        reasons: [
          'R1 '.repeat(80), // Exceeds 200 chars
          'Reason 2',
          'Reason 3',
          'Reason 4',
          'Reason 5',
          'Reason 6',
          'Reason 7' // Exceeds max 6 items
        ]
      };

      const validated = geminiService.validateMatchExplanationOutput(overLongOutput, {
        shelter: { name: 'Hope Shelter' },
        match: { matchScore: 91 }
      });

      expect(validated.summary.length).toBeLessThanOrEqual(500);
      expect(validated.summary.endsWith('...')).toBe(true);
      expect(validated.reasons.length).toBeLessThanOrEqual(6);
      expect(validated.reasons[0].length).toBeLessThanOrEqual(200);
    });

    // 12. Fallback deterministic explanation works when Gemini fails or key missing
    it('12. Fallback deterministic explanation works when Gemini key is missing', async () => {
      const matchContext = {
        shelter: { name: 'Hope Shelter' },
        donation: { foodName: 'Vegetable Biryani' },
        match: {
          matchScore: 91,
          distanceKm: 3.2,
          reasons: ['Within preferred distance', 'Sufficient capacity']
        }
      };

      const fallback = await geminiService.generateMatchExplanation(matchContext, { apiKey: '' });
      expect(fallback.isFallback).toBe(true);
      expect(fallback.summary).toContain('Hope Shelter was selected with a compatibility score of 91/100');
      expect(fallback.reasons).toEqual(expect.arrayContaining(['Within preferred distance']));
    });

    // 13, 14, 15 & Step 19 Security Immutability Test
    it('13, 14, 15 & Step 19: Explaining a match NEVER modifies database match score, breakdown, or status', async () => {
      const matchBefore = await Match.findById(testMatch._id).lean();
      expect(matchBefore.matchScore).toBe(91);
      expect(matchBefore.status).toBe('PENDING');

      // Call explain-match endpoint
      const res = await request(app)
        .post('/api/ai/explain-match')
        .set('Authorization', `Bearer ${shelterTokenA}`)
        .send({ matchId: testMatch._id });

      expect(res.status).toBe(200);

      // Verify database record is completely unchanged
      const matchAfter = await Match.findById(testMatch._id).lean();
      expect(matchAfter.matchScore).toBe(91); // Score unchanged
      expect(matchAfter.status).toBe('PENDING'); // Status unchanged
      expect(matchAfter.shelterId.toString()).toBe(shelterUserA._id.toString()); // Shelter unchanged
      expect(matchAfter.scoreBreakdown).toEqual(matchBefore.scoreBreakdown); // Breakdown unchanged
      expect(matchAfter.reasons).toEqual(matchBefore.reasons); // Deterministic reasons unchanged
    });
  });
});
