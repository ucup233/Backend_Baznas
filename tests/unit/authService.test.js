import authService from '../../src/services/authService.js';
import User from '../../src/models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock modul eksternal agar tidak butuh koneksi DB saat unit test
jest.mock('../../src/models/userModel.js');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('authService.login()', () => {
  const mockUser = {
    id: 1,
    username: 'superadmin',
    password: 'hashed_password',
    nama: 'Super Admin',
    role: 'superadmin'
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_EXPIRES_IN = '1d';
    jest.clearAllMocks();
  });

  test('berhasil login → return token dan data user', async () => {
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mocked.jwt.token');

    const result = await authService.login({ username: 'superadmin', password: 'password123' });

    expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'superadmin' } });
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
    expect(result).toEqual({
      token: 'mocked.jwt.token',
      user: { id: 1, nama: 'Super Admin', role: 'superadmin' }
    });
  });

  test('username tidak ditemukan → throw error 401 dengan pesan generik', async () => {
    User.findOne.mockResolvedValue(null);

    await expect(
      authService.login({ username: 'tidakada', password: 'apapun' })
    ).rejects.toMatchObject({
      message: 'Username atau password salah.',
      status: 401
    });

    // Pastikan bcrypt tidak dipanggil (short-circuit)
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  test('password salah → throw error 401 dengan pesan generik', async () => {
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.login({ username: 'superadmin', password: 'passwordsalah' })
    ).rejects.toMatchObject({
      message: 'Username atau password salah.',
      status: 401
    });
  });
});
