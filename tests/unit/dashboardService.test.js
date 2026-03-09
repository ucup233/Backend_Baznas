import dashboardService from '../../src/services/dashboardService.js';
import Penerimaan from '../../src/models/penerimaanModel.js';
import Distribusi from '../../src/models/distribusiModel.js';
import db from '../../src/config/database.js';

jest.mock('../../src/models/penerimaanModel.js', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../src/models/distribusiModel.js', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../src/config/database.js', () => ({
  fn: jest.fn(),
  col: jest.fn(),
  literal: jest.fn(),
}));

describe('dashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardInfo()', () => {
    test('berhasil mengagregasi data ringkasan', async () => {
      // Mock Penerimaan Stats
      Penerimaan.findAll
        .mockResolvedValueOnce([
          { jenis_zis: 'Zakat', get: () => 1000000 },
          { jenis_zis: 'Infak Terikat', get: () => 500000 },
        ]) // Mock ringkasan penerimaan
        .mockResolvedValueOnce([]) // Mock grafik penerimaan
        .mockResolvedValueOnce([]) // Mock breakdown ZIS
        .mockResolvedValueOnce([]) // Mock breakdown UPZ
        .mockResolvedValueOnce([]); // Mock breakdown Channel

      // Mock Distribusi Stats
      Distribusi.findAll
        .mockResolvedValueOnce([{ get: () => 400000 }]) // Mock ringkasan distribusi
        .mockResolvedValueOnce([]) // Mock grafik distribusi
        .mockResolvedValueOnce([]) // Mock breakdown Program
        .mockResolvedValueOnce([]); // Mock breakdown Asnaf

      const result = await dashboardService.getDashboardInfo({ tahun: 2026 });

      expect(result.ringkasan.total_pemasukan).toBe(1500000);
      expect(result.ringkasan.total_zakat).toBe(1000000);
      expect(result.ringkasan.total_dana_amil).toBe(125000); // 12.5% of 1M
      expect(result.ringkasan.total_pengeluaran).toBe(400000);
      expect(result.ringkasan.saldo_bersih).toBe(1500000 - 125000 - 400000);
    });
  });
});
