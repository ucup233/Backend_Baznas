import request from 'supertest';
import express from 'express';
import penerimaanRoute from '../../src/routes/penerimaanRoute.js';
import penerimaanService from '../../src/services/penerimaanService.js';
import jwt from 'jsonwebtoken';

jest.mock('../../src/services/penerimaanService.js');

const JWT_SECRET = 'test_secret_penerimaan_routes';

const makeToken = (role = 'superadmin') => {
  return jwt.sign(
    { jti: 'test-jti', id: 1, role, nama: 'Test User', username: 'testuser' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const app = express();
app.use(express.json());
app.use('/api/penerimaan', penerimaanRoute);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, message: err.message });
});

describe('Penerimaan Routes Integration Test', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    jest.clearAllMocks();
  });

  // ─── Authentication & Authorization ─────────────────────────────────

  describe('Authentication & Authorization', () => {
    test('tanpa token → 401', async () => {
      const res = await request(app).get('/api/penerimaan');
      expect(res.statusCode).toBe(401);
    });

    test('role pelayanan → tidak bisa akses GET (403)', async () => {
      const res = await request(app)
        .get('/api/penerimaan')
        .set('Authorization', `Bearer ${makeToken('pelayanan')}`);
      expect(res.statusCode).toBe(403);
    });

    test('role keuangan → bisa GET list', async () => {
      penerimaanService.getAll.mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 0 });
      const res = await request(app)
        .get('/api/penerimaan')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`);
      expect(res.statusCode).toBe(200);
    });

    test('role keuangan → tidak bisa POST (403)', async () => {
      const res = await request(app)
        .post('/api/penerimaan')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`)
        .send({ muzakki_id: 1, tanggal: '2026-01-01', via: 'Cash', zis: 'Zakat', jenis_zis: 'Zakat', jumlah: 100000, persentase_amil: '12.50%' });
      expect(res.statusCode).toBe(403);
    });

    test('role keuangan → tidak bisa DELETE (403)', async () => {
      const res = await request(app)
        .delete('/api/penerimaan/1')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`);
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── GET /api/penerimaan ──────────────────────────────────────────

  describe('GET /api/penerimaan', () => {
    test('list berhasil → 200', async () => {
      penerimaanService.getAll.mockResolvedValue({
        data: [{ id: 1, jumlah: 500000 }], total: 1, page: 1, totalPages: 1
      });

      const res = await request(app)
        .get('/api/penerimaan')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  // ─── GET /api/penerimaan/:id ──────────────────────────────────────

  describe('GET /api/penerimaan/:id', () => {
    test('ditemukan → 200', async () => {
      penerimaanService.getById.mockResolvedValue({ id: 1, jumlah: 500000, dana_amil: 62500, dana_bersih: 437500 });

      const res = await request(app)
        .get('/api/penerimaan/1')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.dana_amil).toBe(62500);
    });

    test('ID bukan angka → 400', async () => {
      const res = await request(app)
        .get('/api/penerimaan/abc')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── POST /api/penerimaan ────────────────────────────────────────

  describe('POST /api/penerimaan', () => {
    const validBody = {
      muzakki_id: 1,
      tanggal: '2026-02-20',
      via_id: 1,
      zis_id: 1,
      jenis_zis_id: 1,
      jumlah: 1000000,
      persentase_amil_id: 1
    };

    test('body valid → 201', async () => {
      penerimaanService.create.mockResolvedValue({ id: 1, ...validBody, dana_amil: 125000, dana_bersih: 875000 });

      const res = await request(app)
        .post('/api/penerimaan')
        .set('Authorization', `Bearer ${makeToken('superadmin')}`)
        .send(validBody);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('body kosong → 400', async () => {
      const res = await request(app)
        .post('/api/penerimaan')
        .set('Authorization', `Bearer ${makeToken('superadmin')}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });

    test('muzakki inactive → 400', async () => {
      penerimaanService.create.mockRejectedValue(
        Object.assign(new Error('Muzakki tidak aktif, transaksi ditolak.'), { status: 400 })
      );

      const res = await request(app)
        .post('/api/penerimaan')
        .set('Authorization', `Bearer ${makeToken('superadmin')}`)
        .send(validBody);

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── DELETE /api/penerimaan/:id ──────────────────────────────────

  describe('DELETE /api/penerimaan/:id', () => {
    test('superadmin → berhasil hapus → 200', async () => {
      penerimaanService.destroy.mockResolvedValue();

      const res = await request(app)
        .delete('/api/penerimaan/1')
        .set('Authorization', `Bearer ${makeToken('superadmin')}`);

      expect(res.statusCode).toBe(200);
    });
  });

  // ─── Rekap routes ─────────────────────────────────────────────────

  describe('GET /api/penerimaan/rekap/harian', () => {
    test('berhasil → 200', async () => {
      penerimaanService.rekapHarian.mockResolvedValue({
        tanggal: '2026-02-20', ringkasan: {}, detail: []
      });

      const res = await request(app)
        .get('/api/penerimaan/rekap/harian?tanggal=2026-02-20')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.tanggal).toBe('2026-02-20');
    });
  });

  describe('GET /api/penerimaan/rekap/bulanan', () => {
    test('berhasil → 200', async () => {
      penerimaanService.rekapBulanan.mockResolvedValue({
        bulan: 'Februari', tahun: 2026, ringkasan: {}, detail: []
      });

      const res = await request(app)
        .get('/api/penerimaan/rekap/bulanan?bulan=Februari&tahun=2026')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/penerimaan/rekap/tahunan', () => {
    test('berhasil → 200', async () => {
      penerimaanService.rekapTahunan.mockResolvedValue({
        tahun: 2026, ringkasan: {}, detail: []
      });

      const res = await request(app)
        .get('/api/penerimaan/rekap/tahunan?tahun=2026')
        .set('Authorization', `Bearer ${makeToken('keuangan')}`);

      expect(res.statusCode).toBe(200);
    });
  });
});
