const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

describe('Sites Endpoints', () => {
  afterAll(async () => {
    await db.destroy();
  });

  let workerToken, superAdminToken;
  let newSiteId;

  beforeAll(async () => {
    const resWorker = await request(app).post('/api/v1/auth/login').send({
      email: 'worker@sitetrack.ae',
      password: 'Admin@1234'
    });
    workerToken = resWorker.body.token;

    const resAdmin = await request(app).post('/api/v1/auth/login').send({
      email: 'super_admin@sitetrack.ae',
      password: 'Admin@1234'
    });
    superAdminToken = resAdmin.body.token;
  });

  it('should fail getting sites unauthenticated', async () => {
    const res = await request(app).get('/api/v1/sites');
    expect(res.statusCode).toBe(401);
  });

  it('should fail posting site as worker', async () => {
    const res = await request(app)
      .post('/api/v1/sites')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        name: 'Test Site',
        code: 'TEST-001',
        emirate: 'Dubai',
        latitude: 25.0,
        longitude: 55.0
      });
    expect(res.statusCode).toBe(403);
  });

  it('should post site as super_admin', async () => {
    const res = await request(app)
      .post('/api/v1/sites')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Test Site',
        code: 'TEST-001',
        emirate: 'Dubai',
        latitude: 25.0,
        longitude: 55.0
      });
    expect(res.statusCode).toBe(201);
    newSiteId = res.body.id;
  });

  it('should get site by id', async () => {
    const res = await request(app)
      .get(`/api/v1/sites/${newSiteId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe('TEST-001');
  });

  it('should assign user to site', async () => {
    const user = await db('users').where({ email: 'worker@sitetrack.ae' }).first();
    const res = await request(app)
      .post(`/api/v1/sites/${newSiteId}/assignments`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        user_id: user.id,
        assigned_from: new Date().toISOString()
      });
    expect(res.statusCode).toBe(201);
  });
});
