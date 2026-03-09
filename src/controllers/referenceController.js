/**
 * referenceController.js — Generic controller untuk semua tabel referensi.
 *
 * Tidak ada hardcode nama tabel di sini.
 * Semua model/config dibaca dari req.refConfig yang diinject oleh refMiddleware.
 */
import AppError from '../utils/AppError.js';

// ─── GET /api/ref/:resource ─────────────────────────────────────────────────
// Ambil semua data. Mendukung filter berdasarkan allowedFilters di registry.
export const getAll = async (req, res, next) => {
  try {
    const { model, include = [], allowedFilters = [], label } = req.refConfig;

    // Build WHERE clause hanya dari filter yang diizinkan
    const where = { is_active: 1 };
    for (const field of allowedFilters) {
      if (req.query[field] !== undefined && req.query[field] !== '') {
        // Query params are always strings; parseInt so Sequelize gets the correct integer type
        const parsed = parseInt(req.query[field], 10);
        where[field] = isNaN(parsed) ? req.query[field] : parsed;
      }
    }

    const data = await model.findAll({
      where,
      include,
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      resource: req.params.resource,
      total: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/ref/:resource/:id ─────────────────────────────────────────────
export const getById = async (req, res, next) => {
  try {
    const { model, include = [], label } = req.refConfig;
    const item = await model.findByPk(req.params.id, { include });
    if (!item) throw new AppError(`${label} dengan ID ${req.params.id} tidak ditemukan.`, 404);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/ref/:resource ─────────────────────────────────────────────────
export const create = async (req, res, next) => {
  try {
    const { model, label } = req.refConfig;
    const newItem = await model.create(req.body);
    res.status(201).json({
      success: true,
      message: `${label} berhasil ditambahkan.`,
      data: newItem
    });
  } catch (error) {
    // Handle unique constraint dari database (duplikat nama)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError(`Data sudah ada dan tidak boleh duplikat.`, 409));
    }
    next(error);
  }
};

// ─── PUT /api/ref/:resource/:id ──────────────────────────────────────────────
export const update = async (req, res, next) => {
  try {
    const { model, label } = req.refConfig;
    const item = await model.findByPk(req.params.id);
    if (!item) throw new AppError(`${label} dengan ID ${req.params.id} tidak ditemukan.`, 404);

    await item.update(req.body);
    res.json({
      success: true,
      message: `${label} berhasil diperbarui.`,
      data: item
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError(`Data sudah ada dan tidak boleh duplikat.`, 409));
    }
    next(error);
  }
};

// ─── DELETE /api/ref/:resource/:id ───────────────────────────────────────────
// Soft-delete: set is_active = 0, bukan hapus permanen
export const softDelete = async (req, res, next) => {
  try {
    const { model, label } = req.refConfig;
    const item = await model.findByPk(req.params.id);
    if (!item) throw new AppError(`${label} dengan ID ${req.params.id} tidak ditemukan.`, 404);

    await item.update({ is_active: 0 });
    res.json({
      success: true,
      message: `${label} berhasil dinonaktifkan.`
    });
  } catch (error) {
    next(error);
  }
};
