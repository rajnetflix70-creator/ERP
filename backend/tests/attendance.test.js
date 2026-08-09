const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

describe('Attendance Endpoints', () => {
  afterAll(async () => {
    await db.destroy();
  });

  let token, adminToken, siteId, workerId;

  beforeAll(async () => {
    const resWorker = await request(app).post('/api/v1/auth/login').send({
      email: 'worker@sitetrack.ae',
      password: 'Admin@1234'
    });
    token = resWorker.body.token;

    const resAdmin = await request(app).post('/api/v1/auth/login').send({
      email: 'super_admin@sitetrack.ae',
      password: 'Admin@1234'
    });
    adminToken = resAdmin.body.token;

    const site = await db('sites').where({ code: 'DXB-001' }).first();
    siteId = site.id;

    const worker = await db('users').where({ email: 'worker@sitetrack.ae' }).first();
    workerId = worker.id;
  });

  it('should perform bulk attendance update as admin/supervisor', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await request(app)
      .post('/api/v1/attendance/bulk-update')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        records: [
          {
            user_id: workerId,
            site_id: siteId,
            attendance_date: today,
            status: 'present',
            remarks: 'On-site work'
          }
        ]
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.inserted + res.body.updated).toBeGreaterThan(0);
  });

  it('should get me attendance records', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
