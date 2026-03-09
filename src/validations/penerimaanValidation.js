import { z } from 'zod';
import { idParamSchema } from './shared.js';

// idParamSchema di-import dari shared.js
export { idParamSchema };

// --- Create Penerimaan ---
export const createPenerimaanSchema = z.object({
  muzakki_id: z.number().int().positive('muzakki_id harus angka positif.'),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD.'),
  via_id: z.number().int().positive(),
  metode_bayar_id: z.number().int().positive().optional(),
  no_rekening: z.string().max(50).optional(),
  zis_id: z.number().int().positive(),
  jenis_zis_id: z.number().int().positive(),
  jumlah: z.number().positive('Jumlah harus lebih dari 0.'),
  persentase_amil_id: z.number().int().positive(),
  keterangan: z.string().optional(),
  rekomendasi_upz: z.string().optional()
});

// --- Update Penerimaan ---
export const updatePenerimaanSchema = z.object({
  muzakki_id: z.number().int().positive().optional(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD.').optional(),
  via_id: z.number().int().positive().optional(),
  metode_bayar_id: z.number().int().positive().optional(),
  no_rekening: z.string().max(50).optional(),
  zis_id: z.number().int().positive().optional(),
  jenis_zis_id: z.number().int().positive().optional(),
  jumlah: z.number().positive('Jumlah harus lebih dari 0.').optional(),
  persentase_amil_id: z.number().int().positive().optional(),
  keterangan: z.string().optional(),
  rekomendasi_upz: z.string().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Minimal satu field harus diisi untuk update.' }
);

// --- Query Params (GET list) ---
export const queryPenerimaanSchema = z.object({
  q: z.string().max(100).optional(),
  muzakki_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  bulan: z.string().max(20).optional(),
  tahun: z.string().regex(/^\d{4}$/).transform(Number).optional(),
  via_id: z.string().optional(),
  metode_bayar_id: z.string().optional(),
  zis_id: z.string().optional(),
  jenis_zis_id: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

// --- Query Params (Rekap Harian) ---
export const queryRekapHarianSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

// --- Query Params (Rekap Bulanan) ---
export const queryRekapBulananSchema = z.object({
  bulan: z.string().max(20).optional(),
  tahun: z.string().regex(/^\d{4}$/).transform(Number).optional()
});

// --- Query Params (Rekap Tahunan) ---
export const queryRekapTahunanSchema = z.object({
  tahun: z.string().regex(/^\d{4}$/).transform(Number).optional()
});
