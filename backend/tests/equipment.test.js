const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

describe('Equipment Endpoints', () => {
  afterAll(async () => {
    await db.destroy();
  });

  let workerToken, adminToken;
  let siteId, itemId;

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
    adminToken = resAdmin.body.token;

    const site = await db('sites').where({ code: 'DXB-001' }).first();
    siteId = site.id;
  });

  it('should fail creating item as worker', async () => {
    const res = await request(app)
      .post('/api/v1/equipment/items')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        name: 'New Drill',
        category_id: 2,
        item_type: 'asset',
        unit: 'piece'
      });
    expect(res.statusCode).toBe(403);
  });

  it('should create item as company_admin', async () => {
    const res = await request(app)
      .post('/api/v1/equipment/items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Drill',
        category_id: 2,
        item_type: 'asset',
        unit: 'piece'
      });
    expect(res.statusCode).toBe(201);
    itemId = res.body.id;
  });

  it('should restock item via transaction', async () => {
    const res = await request(app)
      .post('/api/v1/equipment/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        equipment_item_id: itemId,
        to_site_id: siteId,
        transaction_type: 'restock',
        quantity: 10
      });
    expect(res.statusCode).toBe(201);
  });

  it('should fail issue below zero', async () => {
    const res = await request(app)
      .post('/api/v1/equipment/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        equipment_item_id: itemId,
        from_site_id: siteId,
        transaction_type: 'issue',
        quantity: 100 // only 10 available
      });
    expect(res.statusCode).toBe(400);
  });

  it('should get low-stock alerts', async () => {
    const res = await request(app)
      .get('/api/v1/equipment/alerts/low-stock')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
