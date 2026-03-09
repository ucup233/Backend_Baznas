import request from 'supertest';
import express from 'express';
import dashboardRoute from '../../src/routes/dashboardRoute.js';
import dashboardService from '../../src/services/dashboardService.js';
import jwt from 'jsonwebtoken';

jest.mock('../../src/services/dashboardService.js');

const JWT_SECRET = 'test_secret_dashboard';
const makeToken = (role = 'superadmin') => {
  return jwt.sign({ jti: 'test-jti', id: 1, role }, JWT_SECRET, { expiresIn: '1h' });
};

const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoute);

describe('Dashboard Routes Integration Test', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  test('GET /api/dashboard → 200 & return data lengkap', async () => {
    dashboardService.getDashboardInfo.mockResolvedValue({
      ringkasan: { total_pemasukan: 100 },
      grafik_penerimaan_bulanan: []
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${makeToken('keuangan')}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ringkasan.total_pemasukan).toBe(100);
  });

  test('role user biasa (jika ada) → 403', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${makeToken('user')}`); // Role 'user' tidak ada di whitelist
    
    expect(res.statusCode).toBe(403);
  });
});
