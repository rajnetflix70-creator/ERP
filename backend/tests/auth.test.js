const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

describe('Auth Endpoints', () => {
  afterAll(async () => {
    await db.destroy();
  });

  let token;

  it('should register a new user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      full_name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should not register with duplicate email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      full_name: 'Test User 2',
      email: 'testuser@example.com',
      password: 'password123'
    });
    expect(res.statusCode).toBe(409);
  });

  it('should fail on missing password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      full_name: 'Test User',
      email: 'missingpw@example.com'
    });
    expect(res.statusCode).toBe(400);
  });

  it('should login', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'testuser@example.com',
      password: 'password123'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('should fail login with wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'testuser@example.com',
      password: 'wrongpassword'
    });
    expect(res.statusCode).toBe(401);
  });

  it('should get me with token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty('email', 'testuser@example.com');
  });

  it('should fail get me without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('should request OTP', async () => {
    const res = await request(app).post('/api/v1/auth/otp/request').send({
      mobile_number: '+971501234567'
    });
    expect(res.statusCode).toBe(200);
  });

  it('should fail OTP verification with wrong code', async () => {
    const res = await request(app).post('/api/v1/auth/otp/verify').send({
      mobile_number: '+971501234567',
      code: '000000'
    });
    expect(res.statusCode).toBe(401);
  });
});
