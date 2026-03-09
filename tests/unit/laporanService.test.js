import laporanService from '../../src/services/laporanService.js';
import db from '../../src/config/database.js';
import Penerimaan from '../../src/models/penerimaanModel.js';
import Distribusi from '../../src/models/distribusiModel.js';

// Mock models manually before they are imported by laporanService
jest.mock('../../src/models/muzakkiModel.js', () => ({
  __esModule: true,
  default: { define: jest.fn(), hasMany: jest.fn(), belongsTo: jest.fn() }
}));
jest.mock('../../src/models/mustahiqModel.js', () => ({
  __esModule: true,
  default: { define: jest.fn(), hasMany: jest.fn(), belongsTo: jest.fn() }
}));
jest.mock('../../src/models/penerimaanModel.js', () => ({
  __esModule: true,
  default: { define: jest.fn(), findAll: jest.fn() }
}));
jest.mock('../../src/models/distribusiModel.js', () => ({
  __esModule: true,
  default: { define: jest.fn(), findAll: jest.fn() }
}));

jest.mock('../../src/config/database.js', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    fn: jest.fn(),
    col: jest.fn(),
    define: jest.fn(),
    QueryTypes: { SELECT: 'SELECT' }
  }
}));

describe('laporanService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getArusKas()', () => {
    test('berhasil menghitung arus kas dengan saldo awal', async () => {
      // Mock Saldo Awal Query
      db.query.mockResolvedValueOnce([{ total_masuk: 2000000, total_keluar: 500000 }]);
      
      // Mock Penerimaan findAll
      Penerimaan.findAll.mockResolvedValueOnce([
        { jenis_zis: 'Zakat', via: 'Bank', get: () => 1000000 }
      ]);

      // Mock Distribusi findAll
      Distribusi.findAll.mockResolvedValueOnce([
        { nama_program: 'Batam Cerdas', asnaf: 'Fakir', get: () => 300000 }
      ]);

      const result = await laporanService.getArusKas({ tahun: 2026, bulan: 'Februari' });

      expect(result.periode).toBe('Februari 2026');
      expect(result.saldo_awal).toBeGreaterThan(0);
      expect(result.arus_kas_masuk.total_masuk).toBe(1000000);
      expect(result.arus_kas_keluar.total_keluar).toBe(300000);
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('getNeraca()', () => {
    test('berhasil menghitung neraca aktiva pasiva', async () => {
      db.query.mockResolvedValueOnce([{ 
        total_masuk: 10000000, 
        total_keluar: 2000000, 
        total_zakat_in: 5000000 
      }]);

      const result = await laporanService.getNeraca({ tahun: 2026, bulan: 'Desember' });

      expect(result.aktiva.total_aktiva).toBe(8000000);
      expect(result.pasiva.dana_amil).toBe(5000000 * 0.125);
    });
  });
});
