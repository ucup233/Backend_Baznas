import { Op, Sequelize } from 'sequelize';
import Muzakki from '../models/muzakkiModel.js';
import Penerimaan from '../models/penerimaanModel.js';
import db from '../config/database.js';
import AppError from '../utils/AppError.js';
import {
  Kecamatan,
  Kelurahan,
  JenisMuzakki,
  JenisUpz
} from '../models/ref/index.js';

// --- GET /api/muzakki (list + filter + search + pagination) ---
const getAll = async (query) => {
  const { q, jenis_muzakki_id, jenis_upz_id, status, kelurahan_id, kecamatan_id, page = 1, limit = 10 } = query;
  const offset = (page - 1) * limit;

  const where = {};
  if (jenis_muzakki_id) where.jenis_muzakki_id = jenis_muzakki_id;
  if (jenis_upz_id) where.jenis_upz_id = jenis_upz_id;
  if (status) where.status = status;
  if (kelurahan_id) where.kelurahan_id = kelurahan_id;
  if (kecamatan_id) where.kecamatan_id = kecamatan_id;

  if (q) {
    where[Op.or] = [
      { nama: { [Op.like]: `%${q}%` } },
      { nik: { [Op.like]: `%${q}%` } },
      { npwz: { [Op.like]: `%${q}%` } }
    ];
  }

  const { rows, count } = await Muzakki.findAndCountAll({
    where,
    limit: Number(limit),
    offset: Number(offset),
    order: [['created_at', 'DESC']],
    include: [
      { model: Kecamatan, attributes: ['id', 'nama'] },
      { model: Kelurahan, attributes: ['id', 'nama'] },
      { model: JenisMuzakki, attributes: ['id', 'nama'] },
      { model: JenisUpz, attributes: ['id', 'nama'] }
    ]
  });

  return {
    data: rows,
    total: count,
    page: Number(page),
    totalPages: Math.ceil(count / limit)
  };
};

// --- GET /api/muzakki/:id ---
const getById = async (id) => {
  const muzakki = await Muzakki.findByPk(id, {
    include: [
      { model: Kecamatan, attributes: ['id', 'nama'] },
      { model: Kelurahan, attributes: ['id', 'nama'] },
      { model: JenisMuzakki, attributes: ['id', 'nama'] },
      { model: JenisUpz, attributes: ['id', 'nama'] }
    ]
  });
  if (!muzakki) throw new AppError('Muzakki tidak ditemukan.', 404);

  // Calculate statistics
  const stats = await Penerimaan.findOne({
    where: { muzakki_id: id },
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_setor_count'],
      [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'total_setor_amount']
    ],
    raw: true
  });

  const result = muzakki.toJSON();
  result.total_setor_count = parseInt(stats?.total_setor_count || 0);
  result.total_setor_amount = parseFloat(stats?.total_setor_amount || 0);

  return result;
};

// --- GET /api/muzakki/:id/riwayat ---
const getRiwayat = async (id, query) => {
  const { tahun, bulan, page = 1, limit = 10 } = query;
  const offset = (page - 1) * limit;

  const muzakki = await Muzakki.findByPk(id);
  if (!muzakki) throw Object.assign(new Error('Muzakki tidak ditemukan.'), { status: 404 });

  const wherePenerimaan = { muzakki_id: id };
  if (tahun) wherePenerimaan.tahun = tahun;
  if (bulan) wherePenerimaan.bulan = bulan;

  const { rows, count } = await Penerimaan.findAndCountAll({
    where: wherePenerimaan,
    limit: Number(limit),
    offset: Number(offset),
    order: [['tanggal', 'DESC']]
  });

  return {
    muzakki,
    total_setor_count: muzakki.total_setor_count,
    total_setor_amount: muzakki.total_setor_amount,
    last_setor_date: muzakki.last_setor_date,
    riwayat: {
      data: rows,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / limit)
    }
  };
};

// --- POST /api/muzakki ---
const create = async (body, userId) => {
  // Cek duplikat NPWZ
  const existingNpwz = await Muzakki.findOne({ where: { npwz: body.npwz } });
  if (existingNpwz) throw new AppError('NPWZ sudah digunakan.', 409);

  // Cek duplikat NIK (jika diisi)
  if (body.nik) {
    const existingNik = await Muzakki.findOne({ where: { nik: body.nik } });
    if (existingNik) throw new AppError('NIK sudah digunakan.', 409);
  }

  const t = await db.transaction();
  try {
    const muzakki = await Muzakki.create({
      ...body,
      registered_by: userId
    }, { transaction: t, userId });

    await t.commit();
    return muzakki;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// --- PUT /api/muzakki/:id ---
const update = async (id, updateData, userId) => {
  const muzakki = await Muzakki.findByPk(id);
  if (!muzakki) throw new AppError('Muzakki tidak ditemukan.', 404);

  // Cek duplikat NPWZ jika berubah
  if (updateData.npwz && updateData.npwz !== muzakki.npwz) {
    const conflict = await Muzakki.findOne({ where: { npwz: updateData.npwz } });
    if (conflict) throw new AppError('NPWZ sudah digunakan.', 409);
  }

  // Cek duplikat NIK jika berubah
  if (updateData.nik && updateData.nik !== muzakki.nik) {
    const conflict = await Muzakki.findOne({ where: { nik: updateData.nik } });
    if (conflict) throw new AppError('NIK sudah digunakan.', 409);
  }

  const t = await db.transaction();
  try {
    await muzakki.update(updateData, { transaction: t, userId });
    await t.commit();

    await muzakki.reload();
    return muzakki;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// --- PUT /api/muzakki/:id/status ---
const updateStatus = async (id, status, userId) => {
  const muzakki = await Muzakki.findByPk(id);
  if (!muzakki) throw new AppError('Muzakki tidak ditemukan.', 404);

  const t = await db.transaction();
  try {
    await muzakki.update({ status }, { transaction: t, userId });
    await t.commit();
    return muzakki;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// --- DELETE /api/muzakki/:id ---
const destroy = async (id, userId) => {
  const muzakki = await Muzakki.findByPk(id);
  if (!muzakki) throw new AppError('Muzakki tidak ditemukan.', 404);

  // Cek apakah punya penerimaan terkait
  const penerimaanCount = await Penerimaan.count({ where: { muzakki_id: id } });
  if (penerimaanCount > 0) {
    throw new AppError(`Tidak bisa menghapus muzakki yang memiliki ${penerimaanCount} data penerimaan.`, 400);
  }

  const t = await db.transaction();
  try {
    await muzakki.destroy({ transaction: t, userId });
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// --- GET /api/laporan/muzakki/export ---
const MAX_EXPORT_ROWS = 10000;

const getExportData = async (query) => {
  const { jenis_muzakki_id, jenis_upz_id, status } = query;
  const where = {};
  if (jenis_muzakki_id) where.jenis_muzakki_id = jenis_muzakki_id;
  if (jenis_upz_id) where.jenis_upz_id = jenis_upz_id;
  if (status) where.status = status;

  const totalAvailable = await Muzakki.count({ where });

  const rows = await Muzakki.findAll({
    where,
    order: [['nama', 'ASC']],
    limit: MAX_EXPORT_ROWS,
    include: [
      { model: Kecamatan, attributes: ['nama'] },
      { model: Kelurahan, attributes: ['nama'] },
      { model: JenisMuzakki, attributes: ['nama'] },
      { model: JenisUpz, attributes: ['nama'] }
    ]
  });

  return {
    rows,
    totalAvailable,
    exported: rows.length,
    isTruncated: totalAvailable > MAX_EXPORT_ROWS
  };
};

export default {
  getAll,
  getById,
  getRiwayat,
  create,
  update,
  updateStatus,
  destroy,
  getExportData
};

