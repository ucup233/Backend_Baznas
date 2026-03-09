import request from 'supertest';
import express from 'express';
import muzakkiRoute from '../../src/routes/muzakkiRoute.js';
import muzakkiService from '../../src/services/muzakkiService.js';
import jwt from 'jsonwebtoken';

jest.mock('../../src/services/muzakkiService.js');

const JWT_SECRET = 'test_secret_muzakki_routes';

const makeToken = (role = 'superadmin') => {
  return jwt.sign(
    { jti: 'test-jti', id: 1, role, nama: 'Test User', username: 'testuser' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const app = express();
app.use(express.json());
app.use('/api/muzakki', muzakkiRoute);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, message: err.message });
});

describe('Muzakki Routes Integration Test', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    jest.clearAllMocks();
  });

  // ─── Authentication & Authorization ─────────────────────────────────

  describe('Authentication & Authorization', () => {
    test('tanpa token → 401', async () => {
      const res = await request(app).get('/api/muzakki');
      expect(res.statusCode).toBe(401);
    });

    test('role pelayanan → tidak bisa akses (403)', async () => {
      const res = await request(app)
        .get('/api/muzakki')
        .set('Authorization', `Bearer ${makeToken('pelayanan')}`);
      expect(res.statusCode).toBe(403);
    });

    test('role keuangan → bisa GET list', async () => {
      muzakkiService.getAll.mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 0 });
      const res = await request(app)
        .get('/api/muzakki')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`);
      expect(res.statusCode).toBe(200);
    });

    test('role keuangan → tidak bisa DELETE (403)', async () => {
      const res = await request(app)
        .delete('/api/muzakki/1')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`);
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── GET /api/muzakki ──────────────────────────────────────────────

  describe('GET /api/muzakki', () => {
    test('list berhasil → 200', async () => {
      muzakkiService.getAll.mockResolvedValue({
        data: [{ id: 1, nama: 'Budi' }], total: 1, page: 1, totalPages: 1
      });

      const res = await request(app)
        .get('/api/muzakki')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  // ─── GET /api/muzakki/:id ──────────────────────────────────────────

  describe('GET /api/muzakki/:id', () => {
    test('ditemukan → 200', async () => {
      muzakkiService.getById.mockResolvedValue({ id: 1, nama: 'Budi' });

      const res = await request(app)
        .get('/api/muzakki/1')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.nama).toBe('Budi');
    });

    test('ID bukan angka → 400', async () => {
      const res = await request(app)
        .get('/api/muzakki/abc')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.statusCode).toBe(400);
    });

    test('tidak ditemukan → 404', async () => {
      muzakkiService.getById.mockRejectedValue(
        Object.assign(new Error('Muzakki tidak ditemukan.'), { status: 404 })
      );

      const res = await request(app)
        .get('/api/muzakki/999')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.statusCode).toBe(404);
    });
  });

  // ─── POST /api/muzakki ────────────────────────────────────────────

  describe('POST /api/muzakki', () => {
    const validBody = {
      npwz: 'NPWZ001', 
      nama: 'Budi', 
      kelurahan_id: 1,
      kecamatan_id: 1, 
      jenis_muzakki_id: 1,
      jenis_upz_id: 1
    };

    test('body valid → 201', async () => {
      muzakkiService.create.mockResolvedValue({ id: 1, ...validBody });

      const res = await request(app)
        .post('/api/muzakki')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`)
        .send(validBody);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('body kosong → 400', async () => {
      const res = await request(app)
        .post('/api/muzakki')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── PUT /api/muzakki/:id/status ──────────────────────────────────

  describe('PUT /api/muzakki/:id/status', () => {
    test('status valid → 200', async () => {
      muzakkiService.updateStatus.mockResolvedValue({ id: 1, status: 'inactive' });

      const res = await request(app)
        .put('/api/muzakki/1/status')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`)
        .send({ status: 'inactive' });

      expect(res.statusCode).toBe(200);
    });

    test('status tidak valid → 400', async () => {
      const res = await request(app)
        .put('/api/muzakki/1/status')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`)
        .send({ status: 'blacklist' }); // muzakki hanya punya active/inactive

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── DELETE /api/muzakki/:id ──────────────────────────────────────

  describe('DELETE /api/muzakki/:id', () => {
    test('superadmin → berhasil hapus → 200', async () => {
      muzakkiService.destroy.mockResolvedValue();

      const res = await request(app)
        .delete('/api/muzakki/1')
        .set('Authorization', `Bearer ${makeToken('superadmin')}`);

      expect(res.statusCode).toBe(200);
    });

    test('ada penerimaan terkait → 400', async () => {
      muzakkiService.destroy.mockRejectedValue(
        Object.assign(new Error('Tidak bisa menghapus muzakki yang memiliki 3 data penerimaan.'), { status: 400 })
      );

      const res = await request(app)
        .delete('/api/muzakki/1')
        .set('Authorization', `Bearer ${makeToken('superadmin')}`);

      expect(res.statusCode).toBe(400);
    });
  });
});
