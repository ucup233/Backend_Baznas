import distribusiService from '../../src/services/distribusiService.js';
import Distribusi from '../../src/models/distribusiModel.js';
import Mustahiq from '../../src/models/mustahiqModel.js';
import db from '../../src/config/database.js';
import { 
  NamaProgram, 
  SubProgram, 
  ProgramKegiatan 
} from '../../src/models/ref/index.js';

jest.mock('../../src/models/distribusiModel.js', () => ({
  findAndCountAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  findAll: jest.fn(),
}));

jest.mock('../../src/models/mustahiqModel.js', () => ({
  findByPk: jest.fn(),
}));

jest.mock('../../src/models/userModel.js', () => ({
  findByPk: jest.fn(),
}));

jest.mock('../../src/config/database.js', () => ({
  transaction: jest.fn(),
  query: jest.fn(),
  fn: jest.fn(),
  col: jest.fn(),
  literal: jest.fn(),
}));

jest.mock('../../src/models/ref/index.js', () => ({
  Kecamatan: {},
  Kelurahan: {},
  Asnaf: {},
  NamaProgram: { attributes: jest.fn() },
  SubProgram: { attributes: jest.fn() },
  ProgramKegiatan: { attributes: jest.fn() },
  FrekuensiBantuan: {},
  ViaDistribusi: {},
  KategoriMustahiq: {},
  Infak: {},
  JenisZisDistribusi: {}
}));

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn()
};

describe('distribusiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.transaction.mockResolvedValue(mockTransaction);
  });

  describe('getAll()', () => {
    test('berhasil mengambil list distribusi', async () => {
      Distribusi.findAndCountAll.mockResolvedValue({ count: 1, rows: [{ id: 1 }] });
      const result = await distribusiService.getAll({ page: 1, limit: 10 });
      expect(result.rows).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(Distribusi.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        include: expect.any(Array)
      }));
    });
  });

  describe('getById()', () => {
    test('data ditemukan → return data', async () => {
      const mockData = { id: 1, nama_mustahik: 'Mustahiq A' };
      Distribusi.findByPk.mockResolvedValue(mockData);
      const result = await distribusiService.getById(1);
      expect(result).toEqual(mockData);
      expect(Distribusi.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({
        include: expect.any(Array)
      }));
    });

    test('data tidak ditemukan → throw 404', async () => {
      Distribusi.findByPk.mockResolvedValue(null);
      await expect(distribusiService.getById(999)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('create()', () => {
    const payload = { mustahiq_id: 1, tanggal: '2026-02-23', jumlah: 1000000, sub_program_id: 1 };
    const mockMustahiq = { id: 1, nama: 'Mustahiq A', nrm: 'NRM-1' };

    test('berhasil membuat distribusi with relational IDs and reload', async () => {
      Mustahiq.findByPk.mockResolvedValue(mockMustahiq);
      const mockDistribusi = { 
        id: 1, ...payload, 
        reload: jest.fn().mockResolvedValue(true) 
      };
      Distribusi.create.mockResolvedValue(mockDistribusi);

      const result = await distribusiService.create(payload, 1);

      expect(db.transaction).toHaveBeenCalled();
      expect(Mustahiq.findByPk).toHaveBeenCalledWith(1);
      expect(Distribusi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...payload,
          tanggal: null, // Since payload doesn't have status, it defaults to null/menunggu logic in service
          created_by: 1
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(mockDistribusi.reload).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    test('mustahiq tidak ditemukan → throw 404', async () => {
      Mustahiq.findByPk.mockResolvedValue(null);
      await expect(distribusiService.create(payload, 1)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('Rekap Functions', () => {
    test('rekapHarian memanggil db.query dengan benar', async () => {
       db.query.mockResolvedValue([[]]); 
       await distribusiService.rekapHarian({ tanggal: '2026-02-23' });
       expect(db.query).toHaveBeenCalledWith(
         expect.stringContaining('SELECT'),
         expect.objectContaining({ replacements: { tanggal: '2026-02-23' } })
       );
    });
  });
});

