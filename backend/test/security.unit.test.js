import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('unauthenticated security checks without a database', () => {
  it('rejects public ADMIN registration before any database write', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Untrusted Applicant', email: 'applicant@example.invalid',
      password: 'longenoughpass', role: 'ADMIN'
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Invalid role/);
  });

  it('does not claim healthy when MongoDB is disconnected', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(503);
    expect(response.body.services.database).toBe('disconnected');
  });

  it('denies unauthenticated impact reports', async () => {
    const response = await request(app).get('/api/dashboard/impact');
    expect(response.status).toBe(401);
  });
});
