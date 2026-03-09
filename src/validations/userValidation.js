import { z } from 'zod';
import { idParamSchema } from './shared.js';

// Shared Enums
const roleEnum = z.enum(['superadmin', 'pelayanan', 'pendistribusian', 'keuangan', 'penerimaan']);

// --- Auth Validations ---
export const loginUserSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi.').max(15, 'Username terlalu panjang.').trim(),
  password: z.string().min(1, 'Password wajib diisi.').max(100, 'Password terlalu panjang.')
});

// --- User Management Validations ---
export const createUserSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter.').max(15, 'Username maksimal 15 karakter.').trim(),
  password: z.string().min(8, 'Password minimal 8 karakter.').max(100, 'Password terlalu panjang.'),
  nama: z.string().min(1, 'Nama wajib diisi.').max(50, 'Nama terlalu panjang.').trim(),
  role: roleEnum
});

export const updateUserSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter.').max(15).trim().optional(),
  nama: z.string().min(1, 'Nama tidak boleh kosong.').max(50).trim().optional(),
  role: roleEnum.optional(),
  password: z.string().min(8, 'Password minimal 8 karakter.').max(100).optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Minimal satu field harus diisi untuk update.' }
);

export const queryUserSchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page harus berupa angka.').transform(Number).optional(),
  limit: z.string().regex(/^\d+$/, 'Limit harus berupa angka.').transform(Number).optional(),
  role: roleEnum.optional(),
  search: z.string().max(100, 'Keyword pencarian terlalu panjang.').optional()
});

// idParamSchema di-import dari shared.js
export { idParamSchema };
