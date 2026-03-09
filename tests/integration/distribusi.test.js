import request from 'supertest';
import express from 'express';
import distribusiRoute from '../../src/routes/distribusiRoute.js';
import distribusiService from '../../src/services/distribusiService.js';
import jwt from 'jsonwebtoken';

// Mock service agar tidak butuh DB
jest.mock('../../src/services/distribusiService.js');

// Setup JWT secret untuk test
const JWT_SECRET = 'test_secret_distribusi_routes';

// Helper: buat token valid
const makeToken = (role = 'superadmin') => {
  return jwt.sign(
    { jti: 'test-jti', id: 1, role, nama: 'Test User', username: 'testuser' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Mini-app untuk testing
const app = express();
app.use(express.json());
app.use('/api/distribusi', distribusiRoute);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, message: err.message });
});

describe('Distribusi Routes Integration Test', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    jest.clearAllMocks();
  });

  // ─── Authentication & Authorization ─────────────────────────────────────

  describe('Authentication & Authorization', () => {
    test('tanpa token → 401', async () => {
      const res = await request(app).get('/api/distribusi');
      expect(res.statusCode).toBe(401);
    });

    test('role pendistribusian → bisa GET list', async () => {
      distribusiService.getAll.mockResolvedValue({ rows: [], total: 0, page: 1, totalPages: 0 });
      const res = await request(app)
        .get('/api/distribusi')
        .set('Authorization', `Bearer ${makeToken('pendistribusian')}`);
      expect(res.statusCode).toBe(200);
    });

    test('role keuangan → tidak bisa POST (403)', async () => {
      const res = await request(app)
        .post('/api/distribusi')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`)
        .send({ mustahiq_id: 1, jumlah: 1000, tanggal: '2026-02-23' });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── GET /api/distribusi ───────────────────────────────────────────────

  describe('GET /api/distribusi', () => {
    test('berhasil ambil list → 200', async () => {
      distribusiService.getAll.mockResolvedValue({
        rows: [{ id: 1, nama_mustahik: 'Ahmad' }], total: 1, page: 1, totalPages: 1
      });

      const res = await request(app)
        .get('/api/distribusi')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.rows).toHaveLength(1);
    });
  });

  // ─── Rekap Endpoints ───────────────────────────────────────────────────

  describe('Rekap Routes', () => {
    test('GET /rekap/harian → 200', async () => {
      distribusiService.rekapHarian.mockResolvedValue([]);
      const res = await request(app)
        .get('/api/distribusi/rekap/harian')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`);
      expect(res.statusCode).toBe(200);
    });

    test('GET /rekap/bulanan → 200', async () => {
      distribusiService.rekapBulanan.mockResolvedValue([]);
      const res = await request(app)
        .get('/api/distribusi/rekap/bulanan')
        .set('Authorization', `Bearer ${makeToken('pendistribusian')}`);
      expect(res.statusCode).toBe(200);
    });
  });

  // ─── POST /api/distribusi ──────────────────────────────────────────────

  describe('POST /api/distribusi', () => {
    const validBody = {
      mustahiq_id: 1,
      tanggal: '2026-02-23',
      jumlah: 500000,
      nama_program_id: 1,
      sub_program_id: 1
    };

    test('body valid & superadmin → 201', async () => {
      distribusiService.create.mockResolvedValue({ id: 10, ...validBody });

      const res = await request(app)
        .post('/api/distribusi')
        .set('Authorization', `Bearer ${makeToken('superadmin')}`)
        .send(validBody);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(10);
    });

    test('body tidak valid (jumlah negatif) → 400', async () => {
      const res = await request(app)
        .post('/api/distribusi')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ ...validBody, jumlah: -100 });
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── PDF Export ────────────────────────────────────────────────────────

  describe('GET /api/distribusi/:id/cetak', () => {
    test('berhasil generate PDF → 200 & content-type pdf', async () => {
      // Mock getById karena controller memanggil service.getById
      distribusiService.getById.mockResolvedValue({
        id: 1,
        no_reg_bpp: 'BPP001',
        nama_mustahik: 'Ahmad',
        tanggal: '2026-02-23',
        jumlah: 500000
      });

      const res = await request(app)
        .get('/api/distribusi/1/cetak')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });
  });
});
