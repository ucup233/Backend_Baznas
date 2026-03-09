import muzakkiService from '../../src/services/muzakkiService.js';
import Muzakki from '../../src/models/muzakkiModel.js';
import Penerimaan from '../../src/models/penerimaanModel.js';
import db from '../../src/config/database.js';
import { 
  Kecamatan, 
  Kelurahan, 
  JenisMuzakki, 
  JenisUpz 
} from '../../src/models/ref/index.js';

jest.mock('../../src/models/muzakkiModel.js', () => ({
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  findAndCountAll: jest.fn(),
  count: jest.fn(),
  findAll: jest.fn(),
}));

jest.mock('../../src/models/penerimaanModel.js', () => ({
  count: jest.fn(),
  findAndCountAll: jest.fn(),
}));

jest.mock('../../src/config/database.js', () => ({
  transaction: jest.fn(),
}));

jest.mock('../../src/models/ref/index.js', () => ({
  Kecamatan: { attributes: jest.fn() },
  Kelurahan: { attributes: jest.fn() },
  JenisMuzakki: { attributes: jest.fn() },
  JenisUpz: { attributes: jest.fn() }
}));

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn()
};

describe('muzakkiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.transaction.mockResolvedValue(mockTransaction);
  });

  // ─── getById ───────────────────────────────────────────────────────────────

  describe('getById()', () => {
    test('muzakki ditemukan → return data', async () => {
      const mockData = { id: 1, nama: 'Budi', npwz: 'NPWZ202602001' };
      Muzakki.findByPk.mockResolvedValue(mockData);

      const result = await muzakkiService.getById(1);
      expect(Muzakki.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({
        include: expect.any(Array)
      }));
      expect(result).toEqual(mockData);
    });

    test('muzakki tidak ditemukan → throw 404', async () => {
      Muzakki.findByPk.mockResolvedValue(null);

      await expect(muzakkiService.getById(999)).rejects.toMatchObject({
        message: 'Muzakki tidak ditemukan.',
        status: 404
      });
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const payload = {
      npwz: 'NPWZ001', nama: 'Budi', kelurahan_id: 1,
      kecamatan_id: 1, jenis_muzakki_id: 1
    };

    test('berhasil membuat muzakki with relational IDs', async () => {
      Muzakki.findOne.mockResolvedValue(null); 
      Muzakki.create.mockResolvedValue({ id: 1, ...payload });

      const result = await muzakkiService.create(payload, 1);

      expect(db.transaction).toHaveBeenCalled();
      expect(Muzakki.create).toHaveBeenCalledWith(
        expect.objectContaining(payload),
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    test('NPWZ sudah digunakan → throw 409', async () => {
      Muzakki.findOne.mockResolvedValueOnce({ id: 5, npwz: 'NPWZ001' });

      await expect(muzakkiService.create(payload, 1)).rejects.toMatchObject({
        message: 'NPWZ sudah digunakan.',
        status: 409
      });
    });

    test('NIK sudah digunakan → throw 409', async () => {
      const payloadWithNik = { ...payload, nik: '1234567890123456' };
      Muzakki.findOne
        .mockResolvedValueOnce(null)  
        .mockResolvedValueOnce({ id: 3, nik: '1234567890123456' }); 

      await expect(muzakkiService.create(payloadWithNik, 1)).rejects.toMatchObject({
        message: 'NIK sudah digunakan.',
        status: 409
      });
    });
  });

  // ─── updateStatus ─────────────────────────────────────────────────────────

  describe('updateStatus()', () => {
    test('berhasil ubah status', async () => {
      const mockInstance = { id: 1, status: 'active', update: jest.fn().mockResolvedValue(true) };
      Muzakki.findByPk.mockResolvedValue(mockInstance);

      await muzakkiService.updateStatus(1, 'inactive', 1);
      expect(db.transaction).toHaveBeenCalled();
      expect(mockInstance.update).toHaveBeenCalledWith(
        { status: 'inactive' },
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  // ─── destroy ───────────────────────────────────────────────────────────────

  describe('destroy()', () => {
    test('berhasil hapus', async () => {
      const mockInstance = { id: 1, destroy: jest.fn().mockResolvedValue(true) };
      Muzakki.findByPk.mockResolvedValue(mockInstance);
      Penerimaan.count.mockResolvedValue(0);

      await expect(muzakkiService.destroy(1, 1)).resolves.toBeUndefined();
      expect(db.transaction).toHaveBeenCalled();
      expect(mockInstance.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  // ─── getRiwayat ────────────────────────────────────────────────────────────

  describe('getRiwayat()', () => {
    test('berhasil ambil riwayat penerimaan', async () => {
      const mockMuzakki = {
        id: 1, nama: 'Budi',
        total_setor_count: 5, total_setor_amount: 5000000,
        last_setor_date: '2026-01-20'
      };
      Muzakki.findByPk.mockResolvedValue(mockMuzakki);
      Penerimaan.findAndCountAll.mockResolvedValue({ rows: [{ id: 10 }], count: 1 });

      const result = await muzakkiService.getRiwayat(1, { page: 1, limit: 10 });

      expect(result.muzakki).toEqual(mockMuzakki);
      expect(result.total_setor_count).toBe(5);
      expect(result.riwayat.data).toHaveLength(1);
    });
  });
});

