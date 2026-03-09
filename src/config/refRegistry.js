import { z } from 'zod';
import * as models from '../models/ref/index.js';

// ─── Reusable schema building blocks ────────────────────────────────────────
const nama = z.string({ required_error: 'Nama wajib diisi.' }).min(1, 'Nama tidak boleh kosong.').max(100, 'Nama terlalu panjang.').trim();
const fkId = (label) => z.number({ required_error: `${label} wajib diisi.`, invalid_type_error: `${label} harus berupa angka.` }).int().positive(`${label} tidak valid.`);
const namaOnly = { create: z.object({ nama }), update: z.object({ nama: nama.optional() }) };

export const refRegistry = {
  // ─── Wilayah ────────────────────────────────────────────────────────────
  'kecamatan': {
    model: models.Kecamatan,
    label: 'Kecamatan',
    readOnly: false,
    createSchema: z.object({ nama }),
    updateSchema: z.object({ nama: nama.optional() }),
  },
  'kelurahan': {
    model: models.Kelurahan,
    label: 'Kelurahan',
    readOnly: false,
    include: [{ model: models.Kecamatan, attributes: ['id', 'nama'] }],
    allowedFilters: ['kecamatan_id'],
    createSchema: z.object({ nama, kecamatan_id: fkId('Kecamatan ID') }),
    updateSchema: z.object({ nama: nama.optional(), kecamatan_id: fkId('Kecamatan ID').optional() }),
  },

  // ─── Muzakki ────────────────────────────────────────────────────────────
  'jenis-muzakki': {
    model: models.JenisMuzakki,
    label: 'Jenis Muzakki',
    readOnly: false,
    createSchema: namaOnly.create,
    updateSchema: namaOnly.update,
  },
  'jenis-upz': {
    model: models.JenisUpz,
    label: 'Jenis UPZ',
    readOnly: false,
    createSchema: namaOnly.create,
    updateSchema: namaOnly.update,
  },

  // ─── Penerimaan ─────────────────────────────────────────────────────────
  'zis': {
    model: models.Zis,
    label: 'ZIS',
    readOnly: false,
    createSchema: namaOnly.create,
    updateSchema: namaOnly.update,
  },
  'jenis-zis': {
    model: models.JenisZis,
    label: 'Jenis ZIS',
    readOnly: false,
    include: [{ model: models.Zis, as: 'zis', attributes: ['id', 'nama'] }],
    allowedFilters: ['zis_id'],
    createSchema: z.object({ nama, zis_id: fkId('ZIS ID') }),
    updateSchema: z.object({ nama: nama.optional(), zis_id: fkId('ZIS ID').optional() }),
  },
  'via-penerimaan': {
    model: models.ViaPenerimaan,
    label: 'Via Penerimaan',
    readOnly: false,
    createSchema: namaOnly.create,
    updateSchema: namaOnly.update,
  },
  'metode-bayar': {
    model: models.MetodeBayar,
    label: 'Metode Bayar',
    readOnly: false,
    include: [{ model: models.ViaPenerimaan, attributes: ['id', 'nama'] }],
    allowedFilters: ['via_penerimaan_id'],
    createSchema: z.object({ nama, via_penerimaan_id: fkId('Via Penerimaan ID') }),
    updateSchema: z.object({ nama: nama.optional(), via_penerimaan_id: fkId('Via Penerimaan ID').optional() }),
  },
  'persentase-amil': {
    model: models.PersentaseAmil,
    label: 'Persentase Amil',
    readOnly: false,
    createSchema: z.object({
      label: z.string({ required_error: 'Label wajib diisi.' }).min(1).max(10).trim(),
      nilai: z.number({ required_error: 'Nilai wajib diisi.', invalid_type_error: 'Nilai harus angka.' }).positive()
    }),
    updateSchema: z.object({
      label: z.string().min(1).max(10).trim().optional(),
      nilai: z.number().positive().optional()
    }),
  },

  // ─── Mustahiq ───────────────────────────────────────────────────────────
  'asnaf': {
    model: models.Asnaf,
    label: 'Asnaf',
    readOnly: false,
    createSchema: namaOnly.create,
    updateSchema: namaOnly.update,
  },
  'kategori-mustahiq': {
    model: models.KategoriMustahiq,
    label: 'Kategori Mustahiq',
    readOnly: false,
    createSchema: namaOnly.create,
    updateSchema: namaOnly.update,
  },

  // ─── Distribusi ─────────────────────────────────────────────────────────
  'nama-program': {
    model: models.NamaProgram,
    label: 'Nama Program',
    readOnly: false,
    createSchema: namaOnly.create,
    updateSchema: namaOnly.update,
  },
  'sub-program': {
    model: models.SubProgram,
    label: 'Sub Program',
    readOnly: false,
    include: [{ model: models.NamaProgram, attributes: ['id', 'nama'] }],
    allowedFilters: ['nama_program_id'],
    createSchema: z.object({ nama, nama_program_id: fkId('Nama Program ID') }),
    updateSchema: z.object({ nama: nama.optional(), nama_program_id: fkId('Nama Program ID').optional() }),
  },
  'program-kegiatan': {
    model: models.ProgramKegiatan,
    label: 'Program Kegiatan',
    readOnly: false,
    include: [{ model: models.SubProgram, attributes: ['id', 'nama'] }],
    allowedFilters: ['sub_program_id'],
    createSchema: z.object({ nama, sub_program_id: fkId('Sub Program ID') }),
    updateSchema: z.object({ nama: nama.optional(), sub_program_id: fkId('Sub Program ID').optional() }),
  },
  'nama-entitas': {
    model: models.NamaEntitas,
    label: 'Nama Entitas',
    readOnly: false,
    createSchema: namaOnly.create,
    updateSchema: namaOnly.update,
  },
  'frekuensi-bantuan': {
    model: models.FrekuensiBantuan,
    label: 'Frekuensi Bantuan',
    readOnly: false,
    createSchema: namaOnly.create,
    updateSchema: namaOnly.update,
  },
  'infak': {
    model: models.Infak,
    label: 'Infak',
    readOnly: false,
    createSchema: namaOnly.create,
    updateSchema: namaOnly.update,
  },
  'jenis-zis-distribusi': {
    model: models.JenisZisDistribusi,
    label: 'Jenis ZIS Distribusi',
    readOnly: false,
    createSchema: namaOnly.create,
    updateSchema: namaOnly.update,
  },
};
