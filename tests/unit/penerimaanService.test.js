import penerimaanService from '../../src/services/penerimaanService.js';
import Penerimaan from '../../src/models/penerimaanModel.js';
import Muzakki from '../../src/models/muzakkiModel.js';
import db from '../../src/config/database.js';
import { 
  ViaPenerimaan, 
  Zis, 
  JenisZis, 
  PersentaseAmil 
} from '../../src/models/ref/index.js';

jest.mock('../../src/models/penerimaanModel.js', () => ({
  findByPk: jest.fn(),
  findAndCountAll: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn()
}));

jest.mock('../../src/models/muzakkiModel.js', () => ({
  findByPk: jest.fn(),
  findOne: jest.fn()
}));

jest.mock('../../src/models/userModel.js', () => ({
  findByPk: jest.fn(),
}));

jest.mock('../../src/config/database.js', () => ({
  query: jest.fn(),
  transaction: jest.fn()
}));

jest.mock('../../src/models/ref/index.js', () => ({
  ViaPenerimaan: { attributes: jest.fn() },
  MetodeBayar: { attributes: jest.fn() },
  Zis: { attributes: jest.fn() },
  JenisZis: { attributes: jest.fn() },
  PersentaseAmil: { 
    attributes: jest.fn(),
    findByPk: jest.fn()
  },
  JenisMuzakki: { attributes: jest.fn() },
  JenisUpz: { attributes: jest.fn() }
}));

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn()
};

describe('penerimaanService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.transaction.mockResolvedValue(mockTransaction);
  });

  // ─── getById ───────────────────────────────────────────────────────────────

  describe('getById()', () => {
    test('penerimaan ditemukan → return data', async () => {
      const mock = { id: 1, jumlah: 500000 };
      Penerimaan.findByPk.mockResolvedValue(mock);

      const result = await penerimaanService.getById(1);
      expect(result).toEqual(mock);
      expect(Penerimaan.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({
        include: expect.any(Array)
      }));
    });

    test('penerimaan tidak ditemukan → throw 404', async () => {
      Penerimaan.findByPk.mockResolvedValue(null);

      await expect(penerimaanService.getById(999)).rejects.toMatchObject({
        message: 'Data penerimaan tidak ditemukan.',
        status: 404
      });
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const payload = {
      muzakki_id: 1,
      tanggal: '2026-02-20',
      via_id: 1,
      zis_id: 1,
      jenis_zis_id: 1,
      jumlah: 1000000,
      persentase_amil_id: 1
    };

    test('berhasil create with automated amil calculation (12.5%)', async () => {
      Muzakki.findByPk.mockResolvedValue({ id: 1, status: 'active' });
      const createdMock = {
        id: 1, ...payload,
        dana_amil: 125000,
        reload: jest.fn().mockResolvedValue(true)
      };
      Penerimaan.create.mockResolvedValue(createdMock);

      const result = await penerimaanService.create(payload, 1);

      expect(db.transaction).toHaveBeenCalled();
      expect(Penerimaan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...payload,
          dana_amil: 125000,
          created_by: 1
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    test('muzakki tidak ditemukan → throw 404', async () => {
      Muzakki.findByPk.mockResolvedValue(null);
      await expect(penerimaanService.create(payload, 1)).rejects.toMatchObject({ status: 404 });
    });

    test('muzakki inactive → throw 400', async () => {
      Muzakki.findByPk.mockResolvedValue({ id: 1, status: 'inactive' });
      await expect(penerimaanService.create(payload, 1)).rejects.toMatchObject({ status: 400 });
    });
  });

  // ─── update ────────────────────────────────────────────────────────────────

  describe('update()', () => {
    test('update jumlah → recalculate amil (12.5%)', async () => {
      const existing = {
        id: 1, muzakki_id: 1, jumlah: 1000000,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn()
      };
      Penerimaan.findByPk.mockResolvedValue(existing);

      await penerimaanService.update(1, { jumlah: 2000000 }, 1);

      expect(db.transaction).toHaveBeenCalled();
      expect(existing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          jumlah: 2000000,
          dana_amil: 250000
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
    });
  });

  // ─── destroy ───────────────────────────────────────────────────────────────

  describe('destroy()', () => {
    test('berhasil hapus + transaction', async () => {
      const mock = { id: 1, destroy: jest.fn().mockResolvedValue(true) };
      Penerimaan.findByPk.mockResolvedValue(mock);

      await expect(penerimaanService.destroy(1, 1)).resolves.toBeUndefined();
      expect(db.transaction).toHaveBeenCalled();
      expect(mock.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ transaction: mockTransaction })
      );
    });
  });

  // ─── rekap ─────────────────────────────────────────────────────────────────

  describe('rekapHarian()', () => {
    test('return rekap harian via db.query', async () => {
      db.query
        .mockResolvedValueOnce([[{ zis: 'Zakat', jenis_zis: 'Zakat', jumlah_transaksi: 5 }]])
        .mockResolvedValueOnce([[{ total_transaksi: 5, grand_total: 5000000 }]]);

      const result = await penerimaanService.rekapHarian({ tanggal: '2026-02-20' });

      expect(result.tanggal).toBe('2026-02-20');
      expect(result.ringkasan).toBeDefined();
      expect(result.detail).toHaveLength(1);
    });
  });
});

