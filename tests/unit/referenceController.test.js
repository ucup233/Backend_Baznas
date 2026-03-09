import * as ctrl from '../../src/controllers/referenceController.js';

const mockModel = () => ({
  findAll:    jest.fn(),
  findByPk:   jest.fn(),
  create:     jest.fn(),
});

const makeReq = (overrides = {}) => ({
  params:    { resource: 'kecamatan', ...overrides.params },
  query:     overrides.query || {},
  body:      overrides.body  || {},
  refConfig: overrides.refConfig || {
    model:          mockModel(),
    label:          'Kecamatan',
    include:        [],
    allowedFilters: [],
  },
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const makeNext = () => jest.fn();

// ────────────────────────────────────────────────────────────────────────────

describe('referenceController', () => {

  // ─── getAll ──────────────────────────────────────────────────────────────

  describe('getAll()', () => {

    test('berhasil mengembalikan semua data', async () => {
      const mockData = [
        { id: 1, nama: 'Batu Aji', is_active: 1 },
        { id: 2, nama: 'Sagulung', is_active: 1 },
      ];
      const req = makeReq();
      req.refConfig.model.findAll.mockResolvedValue(mockData);

      const res  = makeRes();
      const next = makeNext();
      await ctrl.getAll(req, res, next);

      expect(req.refConfig.model.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { is_active: 1 } })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, total: 2, data: mockData })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('filter berdasarkan allowedFilters → WHERE includes filter', async () => {
      const req = makeReq({
        query: { kecamatan_id: '3' },
        refConfig: {
          model:          mockModel(),
          label:          'Kelurahan',
          include:        [],
          allowedFilters: ['kecamatan_id'],
        }
      });
      req.refConfig.model.findAll.mockResolvedValue([]);

      const res  = makeRes();
      const next = makeNext();
      await ctrl.getAll(req, res, next);

      expect(req.refConfig.model.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { is_active: 1, kecamatan_id: '3' }
        })
      );
    });

    test('query param tidak ada di allowedFilters → diabaikan', async () => {
      const req = makeReq({
        query: { nama: 'Coba Inject' },  // 'nama' tidak ada di allowedFilters
        refConfig: {
          model:          mockModel(),
          label:          'Kecamatan',
          include:        [],
          allowedFilters: [], // kosong
        }
      });
      req.refConfig.model.findAll.mockResolvedValue([]);

      const res  = makeRes();
      const next = makeNext();
      await ctrl.getAll(req, res, next);

      // WHERE hanya berisi is_active, 'nama' tidak masuk
      expect(req.refConfig.model.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { is_active: 1 } })
      );
    });

    test('database error → panggil next(error)', async () => {
      const req = makeReq();
      req.refConfig.model.findAll.mockRejectedValue(new Error('DB down'));

      const res  = makeRes();
      const next = makeNext();
      await ctrl.getAll(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ─── getById ─────────────────────────────────────────────────────────────

  describe('getById()', () => {

    test('data ditemukan → return data', async () => {
      const mockItem = { id: 1, nama: 'Batu Aji', is_active: 1 };
      const req = makeReq({ params: { resource: 'kecamatan', id: '1' } });
      req.refConfig.model.findByPk.mockResolvedValue(mockItem);

      const res  = makeRes();
      const next = makeNext();
      await ctrl.getById(req, res, next);

      expect(req.refConfig.model.findByPk).toHaveBeenCalledWith('1', expect.anything());
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockItem })
      );
    });

    test('data tidak ditemukan → next(AppError 404)', async () => {
      const req = makeReq({ params: { resource: 'kecamatan', id: '999' } });
      req.refConfig.model.findByPk.mockResolvedValue(null);

      const res  = makeRes();
      const next = makeNext();
      await ctrl.getById(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ status: 404 })
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create()', () => {

    test('berhasil membuat data baru → return 201', async () => {
      const mockItem = { id: 5, nama: 'Galang Baru', is_active: 1 };
      const req = makeReq({ body: { nama: 'Galang Baru' } });
      req.refConfig.model.create.mockResolvedValue(mockItem);

      const res  = makeRes();
      const next = makeNext();
      await ctrl.create(req, res, next);

      expect(req.refConfig.model.create).toHaveBeenCalledWith({ nama: 'Galang Baru' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockItem })
      );
    });

    test('nama duplikat (UniqueConstraintError) → next(AppError 409)', async () => {
      const req = makeReq({ body: { nama: 'Batu Aji' } }); // sudah ada
      const uniqueError = new Error('Unique constraint');
      uniqueError.name = 'SequelizeUniqueConstraintError';
      req.refConfig.model.create.mockRejectedValue(uniqueError);

      const res  = makeRes();
      const next = makeNext();
      await ctrl.create(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ status: 409 })
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────

  describe('update()', () => {

    test('berhasil update data', async () => {
      const mockItem = {
        id: 1,
        nama: 'Batu Aji Lama',
        update: jest.fn().mockResolvedValue(true),
      };
      const req = makeReq({
        params: { resource: 'kecamatan', id: '1' },
        body:   { nama: 'Batu Aji Updated' },
      });
      req.refConfig.model.findByPk.mockResolvedValue(mockItem);

      const res  = makeRes();
      const next = makeNext();
      await ctrl.update(req, res, next);

      expect(mockItem.update).toHaveBeenCalledWith({ nama: 'Batu Aji Updated' });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    test('data tidak ditemukan → next(AppError 404)', async () => {
      const req = makeReq({ params: { resource: 'kecamatan', id: '999' } });
      req.refConfig.model.findByPk.mockResolvedValue(null);

      const res  = makeRes();
      const next = makeNext();
      await ctrl.update(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ status: 404 })
      );
    });
  });

  // ─── softDelete ──────────────────────────────────────────────────────────

  describe('softDelete()', () => {

    test('berhasil menonaktifkan data (is_active = 0)', async () => {
      const mockItem = {
        id: 1,
        nama: 'Batu Aji',
        update: jest.fn().mockResolvedValue(true),
      };
      const req = makeReq({ params: { resource: 'kecamatan', id: '1' } });
      req.refConfig.model.findByPk.mockResolvedValue(mockItem);

      const res  = makeRes();
      const next = makeNext();
      await ctrl.softDelete(req, res, next);

      // Memastikan soft-delete, bukan destroy()
      expect(mockItem.update).toHaveBeenCalledWith({ is_active: 0 });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    test('data tidak ditemukan → next(AppError 404)', async () => {
      const req = makeReq({ params: { resource: 'kecamatan', id: '999' } });
      req.refConfig.model.findByPk.mockResolvedValue(null);

      const res  = makeRes();
      const next = makeNext();
      await ctrl.softDelete(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ status: 404 })
      );
    });
  });
});
