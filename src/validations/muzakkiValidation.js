import { z } from 'zod';

// --- Shared Enums ---
const statusEnum = z.enum(['active', 'inactive']);

// --- ID param ---
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID harus berupa angka positif.').transform(Number)
});

const emptyToNull = (v) => v === '' ? null : v;

// --- Create Muzakki ---
export const createMuzakkiSchema = z.object({
  npwz: z.string().min(1, 'NPWZ wajib diisi.').max(15, 'NPWZ terlalu panjang.').trim(),
  nama: z.string().min(1, 'Nama wajib diisi.').max(50, 'Nama terlalu panjang.').trim(),
  nik: z.preprocess(emptyToNull, z.string().trim().max(16, 'NIK maksimal 16 karakter.').nullable().optional()),
  no_hp: z.preprocess(emptyToNull, z.string().max(14, 'Nomor HP terlalu panjang.').trim().nullable().optional()),
  jenis_muzakki_id: z.number().int().positive().optional().default(1),
  jenis_upz_id: z.number().int().positive().nullable().optional(),
  alamat: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  kelurahan_id: z.number().int().positive(),
  kecamatan_id: z.number().int().positive(),
  keterangan: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  npwp: z.preprocess(emptyToNull, z.string().trim().max(20, 'NPWP maksimal 20 karakter.').nullable().optional()),
  jenis_kelamin: z.preprocess(emptyToNull, z.enum(['Laki-laki', 'Perempuan']).nullable().optional()),
  registered_date: z.preprocess(emptyToNull, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD').nullable().optional()),
  tgl_lahir: z.preprocess(emptyToNull, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD').nullable().optional())
});

// --- Update Muzakki ---
export const updateMuzakkiSchema = z.object({
  npwz: z.string().min(1).max(15).trim().optional(),
  nama: z.string().min(1).max(50).trim().optional(),
  nik: z.string().trim().max(16, 'NIK maksimal 16 karakter.').optional(),
  no_hp: z.string().max(14).trim().optional(),
  jenis_muzakki_id: z.number().int().positive().optional(),
  jenis_upz_id: z.number().int().positive().optional(),
  alamat: z.string().optional(),
  kelurahan_id: z.number().int().positive().optional(),
  kecamatan_id: z.number().int().positive().optional(),
  keterangan: z.string().optional(),
  npwp: z.string().max(20).trim().optional(),
  jenis_kelamin: z.preprocess(emptyToNull, z.enum(['Laki-laki', 'Perempuan']).nullable().optional()),
  registered_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tgl_lahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Minimal satu field harus diisi untuk update.' }
);

// --- Update Status ---
export const updateStatusSchema = z.object({
  status: statusEnum
});

// --- Query Params (GET list) ---
export const queryMuzakkiSchema = z.object({
  q: z.string().max(100).optional(),
  jenis_muzakki_id: z.string().optional(),
  jenis_upz_id: z.string().optional(),
  status: statusEnum.optional(),
  kelurahan_id: z.string().optional(),
  kecamatan_id: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

// --- Query Params (GET riwayat) ---
export const queryRiwayatSchema = z.object({
  tahun: z.string().regex(/^\d{4}$/, 'Tahun harus 4 digit.').transform(Number).optional(),
  bulan: z.string().max(20).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

// --- Query Params (Export) ---
export const queryExportSchema = z.object({
  jenis_muzakki_id: z.string().optional(),
  jenis_upz_id: z.string().optional(),
  status: statusEnum.optional()
});
