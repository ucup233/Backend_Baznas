import request from 'supertest';
import express from 'express';
import mustahiqRoute from '../../src/routes/mustahiqRoute.js';
import mustahiqService from '../../src/services/mustahiqService.js';
import jwt from 'jsonwebtoken';

// Mock service agar tidak butuh DB
jest.mock('../../src/services/mustahiqService.js');

// Setup JWT secret untuk test
const JWT_SECRET = 'test_secret_mustahiq_routes';

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
app.use('/api/mustahiq', mustahiqRoute);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, message: err.message });
});

describe('Mustahiq Routes Integration Test', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    jest.clearAllMocks();
  });

  // ─── Authentication ─────────────────────────────────────────────────────

  describe('Authentication & Authorization', () => {
    test('tanpa token → 401', async () => {
      const res = await request(app).get('/api/mustahiq');
      expect(res.statusCode).toBe(401);
    });

    test('role keuangan → bisa GET list', async () => {
      mustahiqService.getAll.mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 0 });
      const res = await request(app)
        .get('/api/mustahiq')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`);
      expect(res.statusCode).toBe(200);
    });

    test('role keuangan → tidak bisa POST (403)', async () => {
      const res = await request(app)
        .post('/api/mustahiq')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`)
        .send({ nama: 'Test' });
      expect(res.statusCode).toBe(403);
    });

    test('role pelayanan → tidak bisa DELETE (403)', async () => {
      const res = await request(app)
        .delete('/api/mustahiq/1')
        .set('Authorization', `Bearer ${makeToken('pelayanan')}`);
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── GET /api/mustahiq ─────────────────────────────────────────────────

  describe('GET /api/mustahiq', () => {
    test('list berhasil → 200', async () => {
      mustahiqService.getAll.mockResolvedValue({
        data: [{ id: 1, nama: 'Ahmad' }], total: 1, page: 1, totalPages: 1
      });

      const res = await request(app)
        .get('/api/mustahiq')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  // ─── GET /api/mustahiq/:id ─────────────────────────────────────────────

  describe('GET /api/mustahiq/:id', () => {
    test('ditemukan → 200', async () => {
      mustahiqService.getById.mockResolvedValue({ id: 1, nama: 'Ahmad' });

      const res = await request(app)
        .get('/api/mustahiq/1')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.nama).toBe('Ahmad');
    });

    test('ID bukan angka → 400', async () => {
      const res = await request(app)
        .get('/api/mustahiq/abc')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.statusCode).toBe(400);
    });

    test('tidak ditemukan → 404', async () => {
      mustahiqService.getById.mockRejectedValue(
        Object.assign(new Error('Mustahiq tidak ditemukan.'), { status: 404 })
      );

      const res = await request(app)
        .get('/api/mustahiq/999')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.statusCode).toBe(404);
    });
  });

  // ─── POST /api/mustahiq ────────────────────────────────────────────────

  describe('POST /api/mustahiq', () => {
    const validBody = {
      nrm: 'NRM001', 
      nama: 'Ahmad', 
      kelurahan_id: 1,
      kecamatan_id: 1, 
      asnaf_id: 1,
      kategori_mustahiq_id: 1
    };

    test('body valid → 201', async () => {
      mustahiqService.create.mockResolvedValue({ id: 1, ...validBody, no_reg_bpp: 'BPP202602001' });

      const res = await request(app)
        .post('/api/mustahiq')
        .set('Authorization', `Bearer ${makeToken('pelayanan')}`)
        .send(validBody);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('body kosong → 400 (validasi Zod)', async () => {
      const res = await request(app)
        .post('/api/mustahiq')
        .set('Authorization', `Bearer ${makeToken('pelayanan')}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });

    test('NRM duplikat → 409', async () => {
      mustahiqService.create.mockRejectedValue(
        Object.assign(new Error('NRM sudah digunakan.'), { status: 409 })
      );

      const res = await request(app)
        .post('/api/mustahiq')
        .set('Authorization', `Bearer ${makeToken('pelayanan')}`)
        .send(validBody);

      expect(res.statusCode).toBe(409);
    });
  });

  // ─── PUT /api/mustahiq/:id/status ──────────────────────────────────────

  describe('PUT /api/mustahiq/:id/status', () => {
    test('status valid → 200', async () => {
      mustahiqService.updateStatus.mockResolvedValue({ id: 1, status: 'blacklist' });

      const res = await request(app)
        .put('/api/mustahiq/1/status')
        .set('Authorization', `Bearer ${makeToken('pelayanan')}`)
        .send({ status: 'blacklist' });

      expect(res.statusCode).toBe(200);
    });

    test('status tidak valid → 400', async () => {
      const res = await request(app)
        .put('/api/mustahiq/1/status')
        .set('Authorization', `Bearer ${makeToken('pelayanan')}`)
        .send({ status: 'invalid_status' });

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── DELETE /api/mustahiq/:id ──────────────────────────────────────────

  describe('DELETE /api/mustahiq/:id', () => {
    test('superadmin → berhasil hapus → 200', async () => {
      mustahiqService.destroy.mockResolvedValue();

      const res = await request(app)
        .delete('/api/mustahiq/1')
        .set('Authorization', `Bearer ${makeToken('superadmin')}`);

      expect(res.statusCode).toBe(200);
    });

    test('ada distribusi terkait → 400', async () => {
      mustahiqService.destroy.mockRejectedValue(
        Object.assign(new Error('Tidak bisa menghapus mustahiq yang memiliki 5 data distribusi.'), { status: 400 })
      );

      const res = await request(app)
        .delete('/api/mustahiq/1')
        .set('Authorization', `Bearer ${makeToken('superadmin')}`);

      expect(res.statusCode).toBe(400);
    });
  });
});
