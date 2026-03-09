import mustahiqService from '../../src/services/mustahiqService.js';
import Mustahiq from '../../src/models/mustahiqModel.js';
import Distribusi from '../../src/models/distribusiModel.js';
import db from '../../src/config/database.js';
import { 
  Kecamatan, 
  Kelurahan, 
  Asnaf, 
  KategoriMustahiq 
} from '../../src/models/ref/index.js';

jest.mock('../../src/models/mustahiqModel.js', () => ({
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  findAndCountAll: jest.fn(),
  count: jest.fn(),
  findAll: jest.fn(),
}));

jest.mock('../../src/models/distribusiModel.js', () => ({
  count: jest.fn(),
  findAndCountAll: jest.fn(),
}));

jest.mock('../../src/config/database.js', () => ({
  transaction: jest.fn(),
  Sequelize: {
    Transaction: {
      ISOLATION_LEVELS: { SERIALIZABLE: 'SERIALIZABLE' }
    }
  }
}));

jest.mock('../../src/models/ref/index.js', () => ({
  Kecamatan: { attributes: jest.fn() },
  Kelurahan: { attributes: jest.fn() },
  Asnaf: { attributes: jest.fn() },
  KategoriMustahiq: { attributes: jest.fn() }
}));

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn()
};

describe('mustahiqService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.transaction.mockResolvedValue(mockTransaction);
  });

  // ─── getById ───────────────────────────────────────────────────────────────

  describe('getById()', () => {
    test('mustahiq ditemukan → return data', async () => {
      const mockData = { id: 1, nama: 'Ahmad', nrm: 'NRM001' };
      Mustahiq.findByPk.mockResolvedValue(mockData);

      const result = await mustahiqService.getById(1);
      expect(Mustahiq.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({
        include: expect.any(Array)
      }));
      expect(result).toEqual(mockData);
    });

    test('mustahiq tidak ditemukan → throw 404', async () => {
      Mustahiq.findByPk.mockResolvedValue(null);

      await expect(mustahiqService.getById(999)).rejects.toMatchObject({
        message: 'Mustahiq tidak ditemukan.',
        status: 404
      });
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const payload = {
      nrm: 'NRM001', nama: 'Ahmad', kelurahan_id: 1,
      kecamatan_id: 1, asnaf_id: 1, registered_date: '2026-01-01'
    };

    test('berhasil membuat mustahiq → auto-generate no_reg_bpp', async () => {
      Mustahiq.findOne.mockResolvedValue(null); 
      Mustahiq.create.mockResolvedValue({ id: 1, no_reg_bpp: 'BPP202602001', ...payload });

      const result = await mustahiqService.create(payload, 1);

      expect(db.transaction).toHaveBeenCalled();
      expect(Mustahiq.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...payload,
          no_reg_bpp: expect.stringMatching(/^BPP\d{6}\d{3}$/)
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toHaveProperty('no_reg_bpp');
    });

    test('NRM sudah digunakan → throw 409', async () => {
      Mustahiq.findOne.mockResolvedValueOnce({ id: 5, nrm: 'NRM001' }); 

      await expect(mustahiqService.create(payload, 1)).rejects.toMatchObject({
        message: 'NRM sudah digunakan.',
        status: 409
      });
    });
  });

  // ─── updateStatus ─────────────────────────────────────────────────────────

  describe('updateStatus()', () => {
    test('berhasil ubah status', async () => {
      const mockInstance = { id: 1, status: 'active', update: jest.fn().mockResolvedValue(true) };
      Mustahiq.findByPk.mockResolvedValue(mockInstance);

      await mustahiqService.updateStatus(1, 'blacklist', 1);
      expect(db.transaction).toHaveBeenCalled();
      expect(mockInstance.update).toHaveBeenCalledWith(
        { status: 'blacklist' },
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  // ─── destroy ───────────────────────────────────────────────────────────────

  describe('destroy()', () => {
    test('berhasil hapus', async () => {
      const mockInstance = { id: 1, destroy: jest.fn().mockResolvedValue(true) };
      Mustahiq.findByPk.mockResolvedValue(mockInstance);
      Distribusi.count.mockResolvedValue(0);

      await expect(mustahiqService.destroy(1, 1)).resolves.toBeUndefined();
      expect(db.transaction).toHaveBeenCalled();
      expect(mockInstance.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  // ─── getRiwayat ────────────────────────────────────────────────────────────

  describe('getRiwayat()', () => {
    test('berhasil ambil riwayat distribusi', async () => {
      const mockMustahiq = {
        id: 1, nama: 'Ahmad',
        total_penerimaan_count: 3, total_penerimaan_amount: 1500000,
        last_received_date: '2026-01-15'
      };
      Mustahiq.findByPk.mockResolvedValue(mockMustahiq);
      Distribusi.findAndCountAll.mockResolvedValue({ rows: [{ id: 10 }], count: 1 });

      const result = await mustahiqService.getRiwayat(1, { page: 1, limit: 10 });

      expect(result.mustahiq).toEqual(mockMustahiq);
      expect(result.total_penerimaan_count).toBe(3);
      expect(result.riwayat.data).toHaveLength(1);
    });
  });
});

