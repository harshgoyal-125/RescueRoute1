import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Donation } from '../src/models/Donation.js';
import { generateToken } from '../src/services/authService.js';
import * as geminiService from '../src/services/geminiService.js';

describe('TASK 05 - AI-Powered Free-Text Donation Parsing Test Suite', () => {
  let donorUser, donorToken;
  let shelterUser, shelterToken;
  let adminUser, adminToken;

  beforeAll(async () => {
    await connectDB();

    await Promise.all([
      User.deleteMany({ email: /@aitest\.com$/ }),
      Donation.deleteMany({ contactInfo: 'AI_TEST' })
    ]);

    const passwordHash = await User.hashPassword('password123');

    donorUser = await User.create({
      name: 'Spice Garden Bistro',
      email: 'donor@aitest.com',
      passwordHash,
      role: 'DONOR',
      organizationName: 'Spice Garden Bistro',
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] }
    });
    donorToken = generateToken(donorUser);

    shelterUser = await User.create({
      name: 'Bay Area Shelter',
      email: 'shelter@aitest.com',
      passwordHash,
      role: 'SHELTER',
      organizationName: 'Bay Area Shelter',
      location: { type: 'Point', coordinates: [-122.4150, 37.7780] }
    });
    shelterToken = generateToken(shelterUser);

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@aitest.com',
      passwordHash,
      role: 'ADMIN'
    });
    adminToken = generateToken(adminUser);
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ email: /@aitest\.com$/ }),
      Donation.deleteMany({ contactInfo: 'AI_TEST' })
    ]);
    await disconnectDB();
  });

  describe('Step 15 Verification: 12 Backend Scenarios', () => {
    // 1. Valid donation text returns structured fields
    it('1. Valid donation text returns structured fields', async () => {
      const mockParsed = {
        foodType: 'Vegetable Biryani',
        quantity: 40,
        quantityUnit: 'meals',
        availableUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        description: 'Around 40 leftover vegetable biryani meals available until 9 PM today.',
        confidence: 0.95
      };

      const spy = vi.spyOn(geminiService, 'parseDonationText').mockResolvedValueOnce(mockParsed);

      const res = await request(app)
        .post('/api/ai/parse-donation')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ text: 'We have around 40 leftover vegetable biryani meals available until 9 PM today.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.foodType).toBe('Vegetable Biryani');
      expect(res.body.data.quantity).toBe(40);
      expect(res.body.data.quantityUnit).toBe('meals');
      expect(res.body.data.availableUntil).toBeDefined();
      expect(res.body.data.description).toContain('vegetable biryani');

      spy.mockRestore();
    });

    // 2. Missing text returns 400
    it('2. Missing text returns 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/ai/parse-donation')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Text input is required');
    });

    // 3. Empty text returns 400
    it('3. Empty text returns 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/ai/parse-donation')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ text: '    ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Text input cannot be empty');
    });

    // 4. Text over maximum length is rejected (400)
    it('4. Text over maximum length (2000 chars) is rejected with 400', async () => {
      const longText = 'A'.repeat(2001);
      const res = await request(app)
        .post('/api/ai/parse-donation')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ text: longText });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('exceeds maximum length');
    });

    // 5. Gemini malformed JSON is handled safely
    it('5. Gemini malformed JSON is handled safely (422)', async () => {
      const parseError = new Error('Unable to parse donation details. Please enter the information manually.');
      parseError.statusCode = 422;
      parseError.code = 'GEMINI_MALFORMED_OUTPUT';

      const spy = vi.spyOn(geminiService, 'parseDonationText').mockRejectedValueOnce(parseError);

      const res = await request(app)
        .post('/api/ai/parse-donation')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ text: 'Some text causing malformed json response' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unable to parse donation details');

      spy.mockRestore();
    });

    // 6. Gemini timeout/provider failure is handled safely
    it('6. Gemini timeout/provider failure is handled safely (503)', async () => {
      const providerError = new Error('AI parsing unavailable. You can enter the donation details manually.');
      providerError.statusCode = 503;
      providerError.code = 'GEMINI_PROVIDER_ERROR';

      const spy = vi.spyOn(geminiService, 'parseDonationText').mockRejectedValueOnce(providerError);

      const res = await request(app)
        .post('/api/ai/parse-donation')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ text: 'Donation during provider outage' });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('AI parsing unavailable');

      spy.mockRestore();
    });

    // 7. Missing GEMINI_API_KEY is handled safely
    it('7. Missing GEMINI_API_KEY is handled safely', async () => {
      await expect(geminiService.parseDonationText('Sample text', { apiKey: '' })).rejects.toThrow(
        /AI parsing service is currently not configured/
      );
    });

    // 8. Unauthorized user cannot call AI parser
    it('8a. Unauthenticated user cannot call AI parser (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/ai/parse-donation')
        .send({ text: 'Donation text without token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('8b. Non-donor/non-admin user role cannot call AI parser (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/ai/parse-donation')
        .set('Authorization', `Bearer ${shelterToken}`) // SHELTER role
        .send({ text: 'Shelter attempting to parse donation' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    // 9. AI output is validated before being returned
    it('9. AI output is validated and sanitized properly', () => {
      const rawOutput = {
        foodType: '  Artisan Sourdough Loaves  ',
        quantity: '25.5',
        quantityUnit: 'lbs',
        availableUntil: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        description: 'Fresh baked bread',
        confidence: 0.88
      };

      const sanitized = geminiService.validateAndSanitizeOutput(rawOutput, 'Raw text input');
      expect(sanitized.foodType).toBe('Artisan Sourdough Loaves');
      expect(sanitized.quantity).toBe(25.5);
      expect(sanitized.quantityUnit).toBe('lbs');
      expect(sanitized.availableUntil).toBeDefined();
      expect(sanitized.description).toBe('Fresh baked bread');
      expect(sanitized.confidence).toBe(0.88);
    });

    // 10. Missing quantity remains null rather than being invented
    it('10. Missing quantity remains null rather than being invented', () => {
      const rawOutput = {
        foodType: 'Leftover Food',
        quantity: null,
        quantityUnit: null,
        availableUntil: null,
        description: 'Some food'
      };

      const sanitized = geminiService.validateAndSanitizeOutput(rawOutput, 'We have some leftover food.');
      expect(sanitized.quantity).toBeNull();
      expect(sanitized.quantityUnit).toBeNull();
    });

    // 11. Missing expiry remains null rather than being invented
    it('11. Missing expiry remains null rather than being invented', () => {
      const rawOutput = {
        foodType: 'Apples',
        quantity: 10,
        quantityUnit: 'lbs',
        availableUntil: null,
        description: '10 lbs apples'
      };

      const sanitized = geminiService.validateAndSanitizeOutput(rawOutput, '10 lbs apples');
      expect(sanitized.availableUntil).toBeNull();
    });

    // 12. Existing donation creation still works without AI
    it('12. Existing donation creation still works without AI (manual submission)', async () => {
      const donationPayload = {
        foodType: 'Prepared Meals',
        foodName: 'Handcrafted Sandwich Platter',
        quantity: 30,
        unit: 'meals',
        pickupLocation: '777 Mission St, Kitchen',
        availableUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        description: 'Manual donation submission without AI',
        contactInfo: 'AI_TEST'
      };

      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${donorToken}`)
        .send(donationPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.donation.foodName).toBe('Handcrafted Sandwich Platter');
      expect(res.body.data.donation.status).toBe('POSTED');
    });
  });
});
