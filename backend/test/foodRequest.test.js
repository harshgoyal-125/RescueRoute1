import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { FoodRequest } from '../src/models/FoodRequest.js';
import { generateToken } from '../src/services/authService.js';

describe('Public Food Request & Admin Management API Test Suite', () => {
  let donorUser, donorToken;
  let shelterUser, shelterToken;
  let adminUser, adminToken;
  let driverUser, driverToken;
  let createdRequestId;

  beforeAll(async () => {
    await connectDB();

    await Promise.all([
      User.deleteMany({ email: /@foodreqtest\.com$/ }),
      FoodRequest.deleteMany({ contactEmail: /@foodreqtest\.com$/ })
    ]);

    const passwordHash = await User.hashPassword('password123');

    donorUser = await User.create({
      name: 'Donor User',
      email: 'donor@foodreqtest.com',
      passwordHash,
      role: 'DONOR'
    });
    donorToken = generateToken(donorUser);

    shelterUser = await User.create({
      name: 'Shelter Coordinator',
      email: 'shelter@foodreqtest.com',
      passwordHash,
      role: 'SHELTER'
    });
    shelterToken = generateToken(shelterUser);

    adminUser = await User.create({
      name: 'Admin Coordinator',
      email: 'admin@foodreqtest.com',
      passwordHash,
      role: 'ADMIN'
    });
    adminToken = generateToken(adminUser);

    driverUser = await User.create({
      name: 'Volunteer Driver',
      email: 'driver@foodreqtest.com',
      passwordHash,
      role: 'DRIVER'
    });
    driverToken = generateToken(driverUser);
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ email: /@foodreqtest\.com$/ }),
      FoodRequest.deleteMany({ contactEmail: /@foodreqtest\.com$/ })
    ]);
    await disconnectDB();
  });

  it('1. Public can submit a food request without authentication', async () => {
    const res = await request(app)
      .post('/api/requests')
      .send({
        recipientName: 'Community Kitchen Team',
        organizationName: 'Community Outreach',
        contactPhone: '(555) 333-4444',
        contactEmail: 'outreach@foodreqtest.com',
        deliveryAddress: '100 Main St, San Francisco, CA',
        latitude: 37.7800,
        longitude: -122.4100,
        foodCategory: 'Prepared Meals',
        quantityNeeded: 40,
        unit: 'meals',
        urgency: 'HIGH',
        notes: 'Urgent evening meal needed for youth program.'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recipientName).toBe('Community Kitchen Team');
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.location.coordinates).toEqual([-122.4100, 37.7800]);

    createdRequestId = res.body.data._id;
  });

  it('2. Rejects request with missing required fields', async () => {
    const res = await request(app)
      .post('/api/requests')
      .send({
        recipientName: 'Incomplete Request'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('3. Unauthenticated user cannot view food requests', async () => {
    const res = await request(app).get('/api/requests');
    expect(res.status).toBe(401);
  });

  it('4. Non-authorized role (DRIVER) cannot list food requests', async () => {
    const res = await request(app)
      .get('/api/requests')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(403);
  });

  it('5. Shelter can view food requests list', async () => {
    const res = await request(app)
      .get('/api/requests')
      .set('Authorization', `Bearer ${shelterToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('6. Admin can view food requests list', async () => {
    const res = await request(app)
      .get('/api/requests')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('7. Shelter cannot update food request status', async () => {
    const res = await request(app)
      .patch(`/api/requests/${createdRequestId}/status`)
      .set('Authorization', `Bearer ${shelterToken}`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(403);
  });

  it('8. Admin can approve a food request', async () => {
    const res = await request(app)
      .patch(`/api/requests/${createdRequestId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');
  });

  it('9. Rejects update with invalid status string', async () => {
    const res = await request(app)
      .patch(`/api/requests/${createdRequestId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'INVALID_STATUS' });

    expect(res.status).toBe(400);
  });
});
