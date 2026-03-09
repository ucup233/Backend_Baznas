import request from 'supertest';
import express from 'express';
import authRoute from '../../src/routes/authRoute.js';
import authService from '../../src/services/authService.js';

// Mock authService agar test tidak butuh koneksi DB nyata
jest.mock('../../src/services/authService.js');

// Buat mini-app khusus untuk testing (tanpa koneksi DB)
const app = express();
app.use(express.json());
app.use('/api/auth', authRoute);
// Simple error handler untuk test
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, message: err.message });
});

describe('Auth Routes Integration Test', () => {
  const validToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJpZCI6MSwicm9sZSI6InN1cGVyYWRtaW4iLCJuYW1hIjoiQWRtaW4iLCJ1c2VybmFtZSI6InN1cGVyYWRtaW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.' +
    'signature'; // Token palsu — akan di-mock

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret_key_yang_panjang_cukup';
  });

  // ─── POST /api/auth/login ──────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    test('login valid → 200 + token', async () => {
      authService.login.mockResolvedValue({
        token: 'jwt_token_here',
        user: { id: 1, nama: 'Admin', role: 'superadmin' }
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'superadmin', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    test('body kosong / tidak valid → 400 (validasi Zod)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({}); // Tidak ada username/password

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('username terlalu panjang → 400 (validasi Zod)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'a'.repeat(20), password: 'pass' });

      expect(res.statusCode).toBe(400);
    });

    test('kredensial salah → 401', async () => {
      authService.login.mockRejectedValue(
        Object.assign(new Error('Username atau password salah.'), { status: 401 })
      );

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'salah', password: 'salah123' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Username atau password salah.');
    });
  });

  // ─── GET /api/auth/me ─────────────────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    test('tanpa Authorization header → 401', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Access token diperlukan.');
    });

    test('token format salah → 403', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token.tidak.valid');

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('Token tidak valid.');
    });
  });

  // ─── POST /api/auth/logout ────────────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    test('tanpa token → 401', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.statusCode).toBe(401);
    });
  });
});
