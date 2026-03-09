import Mustahiq from '../models/mustahiqModel.js';
import Distribusi from '../models/distribusiModel.js';
import { Op } from 'sequelize';
import db from '../config/database.js';
import AppError from '../utils/AppError.js';
import {
  Kecamatan,
  Kelurahan,
  Asnaf,
  KategoriMustahiq
} from '../models/ref/index.js';


const generateNrm = async (transaction) => {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `BPP${yearMonth}`;

  const lastRecord = await Mustahiq.findOne({
    where: { nrm: { [Op.like]: `${prefix}%` } },
    order: [['nrm', 'DESC']],
    lock: transaction.LOCK.UPDATE,
    transaction
  });

  let sequence = 1;
  if (lastRecord) {
    const lastSeq = parseInt(lastRecord.nrm.slice(prefix.length), 10);
    if (!isNaN(lastSeq)) sequence = lastSeq + 1;
  }

  return `${prefix}${String(sequence).padStart(3, '0')}`;
};

// --- GET /api/mustahiq (list + filter + search + pagination) ---
const getAll = async (query) => {
  const { q, asnaf_id, kategori_mustahiq_id, status, kelurahan_id, kecamatan_id, start_date, end_date, page = 1, limit = 10 } = query;
  const offset = (page - 1) * limit;

  const where = {};
  if (asnaf_id) where.asnaf_id = asnaf_id;
  if (kategori_mustahiq_id) where.kategori_mustahiq_id = kategori_mustahiq_id;
  if (status) where.status = status;
  if (kelurahan_id) where.kelurahan_id = kelurahan_id;
  if (kecamatan_id) where.kecamatan_id = kecamatan_id;

  if (q) {
    where[Op.or] = [
      { nama: { [Op.like]: `%${q}%` } },
      { nik: { [Op.like]: `%${q}%` } },
      { nrm: { [Op.like]: `%${q}%` } }
    ];
  }

  if (start_date && end_date) {
    where[Op.and] = [
      ...(where[Op.and] || []),
      db.Sequelize.literal(`COALESCE(mustahiq.registered_date, DATE(mustahiq.created_at)) BETWEEN '${start_date}' AND '${end_date}'`)
    ];
  } else if (start_date) {
    where[Op.and] = [
      ...(where[Op.and] || []),
      db.Sequelize.literal(`COALESCE(mustahiq.registered_date, DATE(mustahiq.created_at)) >= '${start_date}'`)
    ];
  } else if (end_date) {
    where[Op.and] = [
      ...(where[Op.and] || []),
      db.Sequelize.literal(`COALESCE(mustahiq.registered_date, DATE(mustahiq.created_at)) <= '${end_date}'`)
    ];
  }

  const { rows, count } = await Mustahiq.findAndCountAll({
    where,
    limit: Number(limit),
    offset: Number(offset),
    order: [['created_at', 'DESC']],
    include: [
      { model: Kecamatan, attributes: ['id', 'nama'] },
      { model: Kelurahan, attributes: ['id', 'nama'] },
      { model: Asnaf, attributes: ['id', 'nama'] },
      { model: KategoriMustahiq, attributes: ['id', 'nama'] }
    ]
  });

  return {
    data: rows,
    total: count,
    page: Number(page),
    totalPages: Math.ceil(count / limit)
  };
};

// --- GET /api/mustahiq/:id ---
const getById = async (id) => {
  const mustahiq = await Mustahiq.findByPk(id, {
    include: [
      { model: Kecamatan, attributes: ['id', 'nama'] },
      { model: Kelurahan, attributes: ['id', 'nama'] },
      { model: Asnaf, attributes: ['id', 'nama'] },
      { model: KategoriMustahiq, attributes: ['id', 'nama'] }
    ]
  });
  if (!mustahiq) throw new AppError('Mustahiq tidak ditemukan.', 404);

  // Calculate statistics (only sum amounts with status = diterima)
  const stats = await Distribusi.findOne({
    where: {
      mustahiq_id: id,
      status: 'diterima'
    },
    attributes: [
      [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'total_penerimaan_count'],
      [db.Sequelize.fn('SUM', db.Sequelize.col('jumlah')), 'total_penerimaan_amount']
    ],
    raw: true
  });

  const result = mustahiq.toJSON();
  result.total_penerimaan_count = parseInt(stats?.total_penerimaan_count || 0);
  result.total_penerimaan_amount = parseFloat(stats?.total_penerimaan_amount || 0);

  return result;
};

// --- GET /api/mustahiq/:id/riwayat ---
const getRiwayat = async (id, query) => {
  const { tahun, bulan, page = 1, limit = 10 } = query;
  const offset = (page - 1) * limit;

  const mustahiq = await Mustahiq.findByPk(id);
  if (!mustahiq) throw new AppError('Mustahiq tidak ditemukan.', 404);

  const whereDistribusi = { mustahiq_id: id };
  if (tahun) whereDistribusi.tahun = tahun;
  if (bulan) whereDistribusi.bulan = bulan;

  const { rows, count } = await Distribusi.findAndCountAll({
    where: whereDistribusi,
    limit: Number(limit),
    offset: Number(offset),
    order: [['tanggal', 'DESC']]
  });

  return {
    mustahiq,
    total_penerimaan_count: mustahiq.total_penerimaan_count,
    total_penerimaan_amount: mustahiq.total_penerimaan_amount,
    last_received_date: mustahiq.last_received_date,
    riwayat: {
      data: rows,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / limit)
    }
  };
};

// --- POST /api/mustahiq ---
const create = async (body, userId) => {
  const t = await db.transaction({
    isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
  });
  try {
    if (!body.nrm) {
      throw new AppError('NRM wajib diisi.', 400);
    }

    const existingNrm = await Mustahiq.findOne({ where: { nrm: body.nrm }, transaction: t });
    if (existingNrm) throw new AppError('NRM sudah digunakan.', 409);

    if (body.nik) {
      const existingNik = await Mustahiq.findOne({ where: { nik: body.nik }, transaction: t });
      if (existingNik) throw new AppError('NIK sudah digunakan.', 409);
    }

    const mustahiq = await Mustahiq.create({
      ...body,
      registered_by: userId
    }, { transaction: t, userId });

    await t.commit();
    return mustahiq;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// --- PUT /api/mustahiq/:id ---
const update = async (id, updateData, userId) => {
  const mustahiq = await Mustahiq.findByPk(id);
  if (!mustahiq) throw new AppError('Mustahiq tidak ditemukan.', 404);

  if (updateData.nrm && updateData.nrm !== mustahiq.nrm) {
    const conflict = await Mustahiq.findOne({ where: { nrm: updateData.nrm } });
    if (conflict) throw new AppError('NRM sudah digunakan.', 409);
  }
  if (updateData.nik && updateData.nik !== mustahiq.nik) {
    const conflict = await Mustahiq.findOne({ where: { nik: updateData.nik } });
    if (conflict) throw new AppError('NIK sudah digunakan.', 409);
  }

  const t = await db.transaction();
  try {
    await mustahiq.update(updateData, { transaction: t, userId });
    await t.commit();

    await mustahiq.reload();
    return mustahiq;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// --- PUT /api/mustahiq/:id/status ---
const updateStatus = async (id, status, userId) => {
  const mustahiq = await Mustahiq.findByPk(id);
  if (!mustahiq) throw new AppError('Mustahiq tidak ditemukan.', 404);

  const t = await db.transaction();
  try {
    await mustahiq.update({ status }, { transaction: t, userId });
    await t.commit();
    return mustahiq;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// --- DELETE /api/mustahiq/:id ---
const destroy = async (id, userId) => {
  const mustahiq = await Mustahiq.findByPk(id);
  if (!mustahiq) throw new AppError('Mustahiq tidak ditemukan.', 404);

  const distribusiCount = await Distribusi.count({ where: { mustahiq_id: id } });
  if (distribusiCount > 0) {
    throw new AppError(`Tidak bisa menghapus mustahiq yang memiliki ${distribusiCount} data distribusi.`, 400);
  }

  const t = await db.transaction();
  try {
    await mustahiq.destroy({ transaction: t, userId });
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// --- GET /api/laporan/mustahiq/export ---
const MAX_EXPORT_ROWS = 10000;

const getExportData = async (query) => {
  const { asnaf_id, status, kecamatan_id } = query;
  const where = {};
  if (asnaf_id) where.asnaf_id = asnaf_id;
  if (status) where.status = status;
  if (kecamatan_id) where.kecamatan_id = kecamatan_id;

  const totalAvailable = await Mustahiq.count({ where });

  const rows = await Mustahiq.findAll({
    where,
    order: [['nama', 'ASC']],
    limit: MAX_EXPORT_ROWS,
    include: [
      { model: Kecamatan, attributes: ['nama'] },
      { model: Kelurahan, attributes: ['nama'] },
      { model: Asnaf, attributes: ['nama'] },
      { model: KategoriMustahiq, attributes: ['nama'] }
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

