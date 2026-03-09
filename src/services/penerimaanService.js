import Penerimaan from '../models/penerimaanModel.js';
import Muzakki from '../models/muzakkiModel.js';
import { Op } from 'sequelize';
import db from '../config/database.js';
import AppError from '../utils/AppError.js';
import {
  ViaPenerimaan,
  MetodeBayar,
  Zis,
  JenisZis,
  PersentaseAmil,
  JenisMuzakki,
  JenisUpz
} from '../models/ref/index.js';
import User from '../models/userModel.js';

// --- GET /api/penerimaan (list + filter + search + pagination) ---
const getAll = async (query) => {
  const {
    q, muzakki_id, tanggal, bulan, tahun,
    startDate, endDate,
    via_id, metode_bayar_id, zis_id, jenis_zis_id,
    jenis_muzakki_id, jenis_muzakki_ids,
    page = 1, limit = 10
  } = query;
  const offset = (page - 1) * limit;

  const where = {};
  if (muzakki_id) where.muzakki_id = muzakki_id;
  if (tanggal) where.tanggal = tanggal;

  if (startDate || endDate) {
    where.tanggal = { ...(where.tanggal || {}) };
    if (startDate) where.tanggal[Op.gte] = startDate;
    if (endDate) where.tanggal[Op.lte] = endDate;
  }

  if (bulan) where.bulan = bulan;
  if (tahun) where.tahun = tahun;
  if (via_id) where.via_id = via_id;
  if (metode_bayar_id) where.metode_bayar_id = metode_bayar_id;
  if (zis_id) where.zis_id = zis_id;
  if (jenis_zis_id) where.jenis_zis_id = jenis_zis_id;
  // Filter by jenis muzakki - group filter (Individu vs Entitas+UPZ)
  if (jenis_muzakki_ids) {
    const ids = String(jenis_muzakki_ids).split(',').map(Number).filter(Boolean);
    if (ids.length > 0) where.jenis_muzakki_id = { [Op.in]: ids };
  } else if (jenis_muzakki_id) {
    where.jenis_muzakki_id = jenis_muzakki_id;
  }

  if (q) {
    where[Op.or] = [
      { nama_muzakki: { [Op.like]: `%${q}%` } },
      { npwz: { [Op.like]: `%${q}%` } },
      { nik_muzakki: { [Op.like]: `%${q}%` } }
    ];
  }

  const [searchResult, total_jumlah, total_dana_bersih, total_dana_amil] = await Promise.all([
    Penerimaan.findAndCountAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [['tanggal', 'DESC'], ['created_at', 'DESC']],
      include: [
        { model: Muzakki, attributes: ['id', 'nama', 'npwz'] },
        { model: ViaPenerimaan, attributes: ['id', 'nama'], as: 'via' },
        { model: MetodeBayar, attributes: ['id', 'nama'], as: 'metode_bayar' },
        { model: Zis, attributes: ['id', 'nama'], as: 'zis' },
        { model: JenisZis, attributes: ['id', 'nama'], as: 'jenis_zis' },
        { model: PersentaseAmil, attributes: ['id', 'label', 'nilai'], as: 'persentase_amil' }
      ]
    }),
    Penerimaan.sum('jumlah', { where }).then(v => v || 0),
    Penerimaan.sum('dana_bersih', { where }).then(v => v || 0),
    Penerimaan.sum('dana_amil', { where }).then(v => v || 0)
  ]);

  const { rows, count } = searchResult;

  return {
    data: rows,
    total: count,
    page: Number(page),
    totalPages: Math.ceil(count / limit),
    total_jumlah,
    total_dana_bersih,
    total_dana_amil
  };
};

// --- GET /api/penerimaan/:id ---
const getById = async (id) => {
  const penerimaan = await Penerimaan.findByPk(id, {
    include: [
      { model: Muzakki },
      { model: ViaPenerimaan, as: 'via' },
      { model: MetodeBayar, as: 'metode_bayar' },
      { model: Zis, as: 'zis' },
      { model: JenisZis, as: 'jenis_zis' },
      { model: PersentaseAmil, as: 'persentase_amil' },
      { model: User, as: 'creator', attributes: ['id', 'nama'] },
      { model: JenisMuzakki, as: 'jenis_muzakki' },
      { model: JenisUpz, as: 'jenis_upz' }
    ]
  });
  if (!penerimaan) throw Object.assign(new Error('Data penerimaan tidak ditemukan.'), { status: 404 });
  return penerimaan;
};

// --- POST /api/penerimaan ---
// Trigger DB (before_penerimaan_insert) handles amil calculation and snapshot data
const create = async (body, userId) => {
  const muzakki = await Muzakki.findByPk(body.muzakki_id);
  if (!muzakki) throw new AppError('Muzakki tidak ditemukan.', 404);
  if (muzakki.status !== 'active') {
    throw new AppError('Muzakki tidak aktif, transaksi ditolak.', 400);
  }

  const t = await db.transaction();
  try {
    const jumlah = parseFloat(body.jumlah);
    const dana_amil = parseFloat((jumlah * 0.125).toFixed(2));

    const penerimaan = await Penerimaan.create({
      ...body,
      dana_amil,
      created_by: userId
    }, { transaction: t, userId });

    await t.commit();

    // Reload triggers (calculations & snapshots)
    await penerimaan.reload({
      include: [
        { model: ViaPenerimaan, as: 'via', attributes: ['nama'] },
        { model: Zis, as: 'zis', attributes: ['nama'] },
        { model: JenisZis, as: 'jenis_zis', attributes: ['nama'] }
      ]
    });
    return penerimaan;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// --- PUT /api/penerimaan/:id ---
const update = async (id, updateData, userId) => {
  const penerimaan = await Penerimaan.findByPk(id);
  if (!penerimaan) throw new AppError('Data penerimaan tidak ditemukan.', 404);

  if (updateData.muzakki_id && updateData.muzakki_id !== penerimaan.muzakki_id) {
    const muzakki = await Muzakki.findByPk(updateData.muzakki_id);
    if (!muzakki) throw new AppError('Muzakki tidak ditemukan.', 404);
    if (muzakki.status !== 'active') {
      throw new AppError('Muzakki tidak aktif, perubahan ditolak.', 400);
    }
  }

  // Application layer handling for amil/bersih calculation if trigger is not enough (optional)
  if (updateData.jumlah) {
    const jumlah = parseFloat(updateData.jumlah);
    updateData.dana_amil = parseFloat((jumlah * 0.125).toFixed(2));
  }

  const t = await db.transaction();
  try {
    await penerimaan.update(updateData, { transaction: t, userId });
    await t.commit();

    await penerimaan.reload();
    return penerimaan;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// --- DELETE /api/penerimaan/:id ---
const destroy = async (id, userId) => {
  const penerimaan = await Penerimaan.findByPk(id);
  if (!penerimaan) throw new AppError('Data penerimaan tidak ditemukan.', 404);

  const t = await db.transaction();
  try {
    await penerimaan.destroy({ transaction: t, userId });
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// --- Reports helper to get labels instead of IDs ---
const rekapHarian = async (query) => {
  const tanggal = query.tanggal || new Date().toISOString().slice(0, 10);

  const [results] = await db.query(`
    SELECT 
      z.nama as zis,
      jz.nama as jenis_zis,
      COUNT(p.id) as jumlah_transaksi,
      SUM(p.jumlah) as total_jumlah,
      SUM(p.dana_amil) as total_dana_amil,
      SUM(p.dana_bersih) as total_dana_bersih
    FROM penerimaan p
    LEFT JOIN ref_zis z ON p.zis_id = z.id
    LEFT JOIN ref_jenis_zis jz ON p.jenis_zis_id = jz.id
    WHERE p.tanggal = :tanggal
    GROUP BY p.zis_id, p.jenis_zis_id
    ORDER BY z.nama, jz.nama
  `, { replacements: { tanggal } });

  const [totals] = await db.query(`
    SELECT 
      COUNT(*) as total_transaksi,
      COALESCE(SUM(jumlah), 0) as grand_total,
      COALESCE(SUM(dana_amil), 0) as total_amil,
      COALESCE(SUM(dana_bersih), 0) as total_bersih
    FROM penerimaan
    WHERE tanggal = :tanggal
  `, { replacements: { tanggal } });

  return {
    tanggal,
    ringkasan: totals[0],
    detail: results
  };
};

const rekapBulanan = async (query) => {
  const now = new Date();
  const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const bulan = query.bulan || bulanNames[now.getMonth()];
  const tahun = query.tahun || now.getFullYear();

  const [results] = await db.query(`
    SELECT 
      z.nama as zis,
      jz.nama as jenis_zis,
      v.nama as via,
      COUNT(p.id) as jumlah_transaksi,
      SUM(p.jumlah) as total_jumlah,
      SUM(p.dana_amil) as total_dana_amil,
      SUM(p.dana_bersih) as total_dana_bersih
    FROM penerimaan p
    LEFT JOIN ref_zis z ON p.zis_id = z.id
    LEFT JOIN ref_jenis_zis jz ON p.jenis_zis_id = jz.id
    LEFT JOIN ref_via_penerimaan v ON p.via_id = v.id
    WHERE p.bulan = :bulan AND p.tahun = :tahun
    GROUP BY p.zis_id, p.jenis_zis_id, p.via_id
    ORDER BY z.nama, jz.nama, v.nama
  `, { replacements: { bulan, tahun } });

  const [totals] = await db.query(`
    SELECT 
      COUNT(*) as total_transaksi,
      COALESCE(SUM(jumlah), 0) as grand_total,
      COALESCE(SUM(dana_amil), 0) as total_amil,
      COALESCE(SUM(dana_bersih), 0) as total_bersih
    FROM penerimaan
    WHERE bulan = :bulan AND tahun = :tahun
  `, { replacements: { bulan, tahun } });

  return {
    bulan,
    tahun,
    ringkasan: totals[0],
    detail: results
  };
};

const rekapTahunan = async (query) => {
  const tahun = query.tahun || new Date().getFullYear();

  const [results] = await db.query(`
    SELECT 
      p.bulan,
      z.nama as zis,
      COUNT(p.id) as jumlah_transaksi,
      SUM(p.jumlah) as total_jumlah,
      SUM(p.dana_amil) as total_dana_amil,
      SUM(p.dana_bersih) as total_dana_bersih
    FROM penerimaan p
    LEFT JOIN ref_zis z ON p.zis_id = z.id
    WHERE p.tahun = :tahun
    GROUP BY p.bulan, p.zis_id
    ORDER BY 
      FIELD(p.bulan, 'Januari','Februari','Maret','April','Mei','Juni',
            'Juli','Agustus','September','Oktober','November','Desember'),
      z.nama
  `, { replacements: { tahun } });

  const [totals] = await db.query(`
    SELECT 
      COUNT(*) as total_transaksi,
      COALESCE(SUM(jumlah), 0) as grand_total,
      COALESCE(SUM(dana_amil), 0) as total_amil,
      COALESCE(SUM(dana_bersih), 0) as total_bersih
    FROM penerimaan
    WHERE tahun = :tahun
  `, { replacements: { tahun } });

  return {
    tahun,
    ringkasan: totals[0],
    detail: results
  };
};

export default {
  getAll,
  getById,
  create,
  update,
  destroy,
  rekapHarian,
  rekapBulanan,
  rekapTahunan
};

