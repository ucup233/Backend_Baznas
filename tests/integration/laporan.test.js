import request from 'supertest';
import express from 'express';
import laporanRoute from '../../src/routes/laporanRoute.js';
import laporanService from '../../src/services/laporanService.js';
import jwt from 'jsonwebtoken';

jest.mock('../../src/services/laporanService.js');

const JWT_SECRET = 'test_secret_laporan';
const makeToken = (role = 'superadmin') => {
  return jwt.sign({ jti: 'test-jti', id: 1, role }, JWT_SECRET, { expiresIn: '1h' });
};

const app = express();
app.use(express.json());
app.use('/api/laporan', laporanRoute);

describe('Laporan Routes Integration Test', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  test('GET /api/laporan/arus-kas → 200', async () => {
    laporanService.getArusKas.mockResolvedValue({ periode: 'Februari 2026' });

    const res = await request(app)
      .get('/api/laporan/arus-kas')
      .set('Authorization', `Bearer ${makeToken('keuangan')}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.periode).toBe('Februari 2026');
  });

  test('GET /api/laporan/penerimaan/export → 200 & trigger excel', async () => {
    laporanService.getRawDataForExport.mockResolvedValue([]);
    
    const res = await request(app)
      .get('/api/laporan/penerimaan/export')
      .set('Authorization', `Bearer ${makeToken('superadmin')}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml');
  });

  test('GET /api/laporan/arus-kas/export → 200 & trigger PDF', async () => {
    laporanService.getArusKas.mockResolvedValue({ periode: 'Februari 2026', arus_kas_masuk: { total_zakat: 0 }, arus_kas_keluar: { total_distribusi: 0 } });
    
    const res = await request(app)
      .get('/api/laporan/arus-kas/export')
      .set('Authorization', `Bearer ${makeToken('keuangan')}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });

  test('role pelayanan → tidak bisa akses Arus Kas (403)', async () => {
    const res = await request(app)
      .get('/api/laporan/arus-kas')
      .set('Authorization', `Bearer ${makeToken('pelayanan')}`);
    
    expect(res.statusCode).toBe(403);
  });
});
