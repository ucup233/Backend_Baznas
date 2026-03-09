import userService from '../../src/services/userService.js';
import User from '../../src/models/userModel.js';
import bcrypt from 'bcrypt';

jest.mock('../../src/models/userModel.js');
jest.mock('bcrypt');

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── createUser ────────────────────────────────────────────────────────────

  describe('createUser()', () => {
    const payload = { username: 'budi', password: 'P@ssword1', nama: 'Budi', role: 'pelayanan' };

    test('berhasil membuat user baru → return data tanpa password', async () => {
      User.findOne.mockResolvedValue(null); // Tidak ada konflik
      bcrypt.hash.mockResolvedValue('hashed_pw');
      User.create.mockResolvedValue({ id: 5, username: 'budi', nama: 'Budi', role: 'pelayanan' });

      const result = await userService.createUser(payload);

      expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'budi' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('P@ssword1', 12);
      expect(result).toEqual({ id: 5, username: 'budi', nama: 'Budi', role: 'pelayanan' });
    });

    test('username sudah digunakan → throw error 409', async () => {
      User.findOne.mockResolvedValue({ id: 1, username: 'budi' }); // Ada konflik

      await expect(userService.createUser(payload)).rejects.toMatchObject({
        message: 'Username sudah digunakan.',
        status: 409
      });

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  // ─── getUserById ───────────────────────────────────────────────────────────

  describe('getUserById()', () => {
    test('user ditemukan → return data user', async () => {
      const mockUser = { id: 1, username: 'budi', nama: 'Budi', role: 'pelayanan' };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await userService.getUserById(1);
      expect(result).toEqual(mockUser);
    });

    test('user tidak ditemukan → throw error 404', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(userService.getUserById(999)).rejects.toMatchObject({
        message: 'User tidak ditemukan.',
        status: 404
      });
    });
  });

  // ─── updateUser ────────────────────────────────────────────────────────────

  describe('updateUser()', () => {
    test('update username ke username yang sudah dipakai orang lain → throw error 409', async () => {
      const existingUser = {
        id: 1,
        username: 'lama',
        nama: 'Lama',
        role: 'pelayanan',
        update: jest.fn()
      };
      const conflictUser = { id: 2, username: 'baru' };

      User.findByPk.mockResolvedValue(existingUser);
      User.findOne.mockResolvedValue(conflictUser); // Username 'baru' sudah ada di user lain

      await expect(
        userService.updateUser(1, { username: 'baru' })
      ).rejects.toMatchObject({
        message: 'Username sudah digunakan.',
        status: 409
      });

      expect(existingUser.update).not.toHaveBeenCalled();
    });

    test('user tidak ditemukan → throw error 404', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(userService.updateUser(999, { nama: 'Apapun' })).rejects.toMatchObject({
        message: 'User tidak ditemukan.',
        status: 404
      });
    });
  });

  // ─── deleteUser ────────────────────────────────────────────────────────────

  describe('deleteUser()', () => {
    test('user tidak ditemukan → throw error 404', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(userService.deleteUser(999)).rejects.toMatchObject({
        message: 'User tidak ditemukan.',
        status: 404
      });
    });

    test('berhasil menghapus user', async () => {
      const mockUser = { id: 1, destroy: jest.fn().mockResolvedValue(true) };
      User.findByPk.mockResolvedValue(mockUser);

      await expect(userService.deleteUser(1)).resolves.toBeUndefined();
      expect(mockUser.destroy).toHaveBeenCalledTimes(1);
    });
  });
});
