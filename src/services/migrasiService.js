import ExcelJS from 'exceljs';
import { z } from 'zod';
import { createMustahiqSchema } from '../validations/mustahiqValidation.js';
import { createMuzakkiSchema } from '../validations/muzakkiValidation.js';
import { createPenerimaanSchema } from '../validations/penerimaanValidation.js';
import { createDistribusiSchema } from '../validations/distribusiValidation.js';
import Mustahiq from '../models/mustahiqModel.js';
import Muzakki from '../models/muzakkiModel.js';
import Penerimaan from '../models/penerimaanModel.js';
import Distribusi from '../models/distribusiModel.js';
import MigrationLog from '../models/migrationLogModel.js';
import db from '../config/database.js';
import { Op } from 'sequelize';
import {
  Kecamatan,
  Kelurahan,
  Asnaf,
  NamaProgram,
  SubProgram,
  ProgramKegiatan,
  NamaEntitas,
  ViaPenerimaan,
  MetodeBayar,
  Zis,
  JenisZis,
  JenisZisDistribusi,
  KategoriMustahiq,
  FrekuensiBantuan,
  JenisMuzakki,
  JenisUpz,
  PersentaseAmil,
  Infak
} from '../models/ref/index.js';

// ============================================================
// HELPER: Levenshtein distance (jarak edit antar 2 string)
// ============================================================
const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
};

// ============================================================
// HELPER: Buat lookup map { namaLowercase -> id } dari tabel ref
// Juga simpan entries untuk keperluan fuzzy search
// ============================================================
const buildLookupMap = async (model, nameField = 'nama') => {
  const rows = await model.findAll({ attributes: ['id', nameField] });
  const map = {};   // exact match map
  const list = [];   // untuk fuzzy search
  for (const row of rows) {
    const key = (row[nameField] || '').toString().toLowerCase().trim();
    map[key] = row.id;
    list.push({ key, id: row.id, original: row[nameField] });

    // Alias: Infaq -> Infak/Sedekah
    if (key === 'infak/sedekah') {
      map['infaq'] = row.id;
      list.push({ key: 'infaq', id: row.id, original: row[nameField] });
    }
  }
  return { map, list };
};

// ============================================================
// HELPER: Cari ID dari lookup map dengan toleransi typo
// 1. Exact match dulu
// 2. Jika tidak ada, coba fuzzy (Levenshtein ≤ MAX_DIST)
// Kembalikan { id, matched, suggestion } 
// ============================================================
const MAX_DIST = 2; // toleransi maksimal 2 karakter berbeda

const fuzzyFind = ({ map, list }, inputRaw) => {
  if (!inputRaw) return { id: null, matched: false, suggestion: null };
  const input = inputRaw.toString().toLowerCase().trim();

  // 1. Exact match
  if (map[input] !== undefined) {
    return { id: map[input], matched: true, suggestion: null };
  }

  // 2. Fuzzy match
  let bestDist = Infinity;
  let bestEntry = null;
  for (const entry of list) {
    const dist = levenshtein(input, entry.key);
    if (dist < bestDist) {
      bestDist = dist;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestDist <= MAX_DIST) {
    return { id: bestEntry.id, matched: true, suggestion: bestEntry.original };
  }

  // Tidak ditemukan — kembalikan daftar opsi valid
  const validOptions = list.map(e => e.original).join(', ');
  return { id: null, matched: false, suggestion: `Nilai valid: ${validOptions}` };
};

// ============================================================
// EXCEL COLUMN CONFIG  (header yang tampil di template Excel)
// ============================================================
const COLUMN_CONFIG = {
  mustahiq: {
    columns: [
      { header: 'NRM', key: 'nrm', width: 20 },
      { header: 'Nama', key: 'nama', width: 30 },
      { header: 'NIK', key: 'nik', width: 20 },
      { header: 'Jenis Kelamin', key: 'jenis_kelamin', width: 18, note: 'Laki-laki atau Perempuan (opsional)' },
      { header: 'Alamat', key: 'alamat', width: 40 },
      { header: 'Kelurahan', key: 'kelurahan', width: 20, note: 'Nama kelurahan' },
      { header: 'Kecamatan', key: 'kecamatan', width: 20, note: 'Nama kecamatan' },
      { header: 'No HP', key: 'no_hp', width: 15 },
      { header: 'Asnaf', key: 'asnaf', width: 15, note: 'Nama asnaf (Fakir, Miskin, dst)' },
      { header: 'Kategori Mustahiq', key: 'kategori_mustahiq', width: 20, note: 'Default: Individu' }
    ],
    schema: createMustahiqSchema,
    model: Mustahiq
  },
  muzakki: {
    columns: [
      { header: 'NPWZ', key: 'npwz', width: 20 },
      { header: 'Nama', key: 'nama', width: 30 },
      { header: 'NIK', key: 'nik', width: 20 },
      { header: 'No HP', key: 'no_hp', width: 15 },
      { header: 'NPWP', key: 'npwp', width: 22, note: 'Opsional. Contoh: 01.234.567.8-901.000' },
      { header: 'Jenis Kelamin', key: 'jenis_kelamin', width: 18, note: 'Laki-laki atau Perempuan (opsional)' },
      { header: 'Alamat', key: 'alamat', width: 40 },
      { header: 'Kelurahan', key: 'kelurahan', width: 20, note: 'Nama kelurahan' },
      { header: 'Kecamatan', key: 'kecamatan', width: 20, note: 'Nama kecamatan' },
      { header: 'Jenis Muzakki', key: 'jenis_muzakki', width: 20, note: 'Nama jenis muzakki' },
      { header: 'Jenis UPZ', key: 'jenis_upz', width: 20, note: 'Nama jenis UPZ (jika UPZ)' }
    ],
    schema: createMuzakkiSchema,
    model: Muzakki
  },
  penerimaan: {
    columns: [
      { header: 'Muzakki ID / NIK', key: 'muzakki_identifier', width: 25, note: 'ID atau NIK Muzakki' },
      { header: 'Tanggal (YYYY-MM-DD)', key: 'tanggal', width: 20 },
      { header: 'Via', key: 'via', width: 20, note: 'Contoh: Transfer, Tunai, Online' },
      { header: 'Metode Bayar', key: 'metode_bayar', width: 20, note: 'Contoh: BNI, BRI, Mandiri' },
      { header: 'No Rekening', key: 'no_rekening', width: 25 },
      { header: 'ZIS', key: 'zis', width: 15, note: 'Contoh: Zakat, Infaq, Sedekah' },
      { header: 'Jenis ZIS', key: 'jenis_zis', width: 20, note: 'Contoh: Zakat Fitrah, Zakat Maal' },
      { header: 'AMIL %', key: 'amil_pct', width: 10, note: 'Pilih: 12.5 atau 20' },
      { header: 'Jumlah', key: 'jumlah', width: 15 },
      { header: 'Keterangan', key: 'keterangan', width: 30 }
    ],
    schema: createPenerimaanSchema,
    model: Penerimaan
  },
  distribusi: {
    columns: [
      { header: 'Mustahiq ID / NIK', key: 'mustahiq_identifier', width: 25, note: 'ID atau NIK Mustahiq' },
      { header: 'Tanggal (YYYY-MM-DD)', key: 'tanggal', width: 20 },
      { header: 'Jumlah', key: 'jumlah', width: 15 },
      { header: 'Program', key: 'nama_program', width: 25, note: 'Nama program (ref_nama_program)' },
      { header: 'Sub Program', key: 'sub_program', width: 25, note: 'Nama sub program' },
      { header: 'Program Kegiatan', key: 'program_kegiatan', width: 25, note: 'Nama kegiatan' },
      { header: 'Nama Entitas', key: 'nama_entitas', width: 25, note: 'Contoh: Individu, BAZNAS KOTA BATAM' },
      { header: 'Kategori Mustahiq', key: 'kategori_mustahiq', width: 20, note: 'Nama kategori mustahiq' },
      { header: 'Jenis ZIS Distribusi', key: 'jenis_zis_distribusi', width: 20, note: 'Nama jenis ZIS distribusi' },
      { header: 'Frekuensi Bantuan', key: 'frekuensi_bantuan', width: 20, note: 'Contoh: Bulanan, Tahunan' },
      { header: 'No Rekening', key: 'no_rekening', width: 25 },
      { header: 'Keterangan', key: 'keterangan', width: 30 }
    ],
    schema: createDistribusiSchema,
    model: Distribusi
  },

  // ── Format Excel lama user (PENERIMAAN ZIS 2026) ──────────────────────────
  // Kolom: TANGGAL | BULAN | NAMA MUZAKKI | MUZAKI | CASH/BANK | JENIS ZIS
  //        | JENIS MUZAKKI | JENIS UPZ | JUMLAH | TUNAI | AMIL % | DANA | ZIS
  penerimaan_excel: {
    columns: [
      { header: 'TANGGAL', key: 'tanggal_raw', width: 20 },
      { header: 'BULAN', key: 'bulan_raw', width: 10 },
      { header: 'NAMA MUZAKKI', key: 'nama_muzakki', width: 35 },
      { header: 'MUZAKI', key: 'via_raw', width: 20 },  // Bank / Cash / Kantor Digital
      { header: 'METODE BAYAR', key: 'metode_bayar', width: 25 },  // nama bank
      { header: 'JENIS ZIS', key: 'jenis_zis', width: 25 },
      { header: 'JENIS MUZAKKI', key: 'jenis_muzakki', width: 20 },
      { header: 'JENIS UPZ', key: 'jenis_upz', width: 20 },
      { header: 'JUMLAH', key: 'jumlah', width: 18 },
      { header: 'AMIL %', key: 'amil_pct', width: 10 },
      { header: 'ZIS', key: 'zis', width: 10 },   // ZAKAT / INFAQ
      { header: 'NO REKENING', key: 'no_rekening', width: 25 },
      { header: 'KETERANGAN', key: 'keterangan', width: 40 }
    ],
    schema: null,   // validasi manual di resolver
    model: Penerimaan
  },

  // ── Format Excel distribusi lama user ────────────────────────────────────
  distribusi_excel: {
    columns: [
      { header: 'Tanggal', key: 'tanggal_raw', width: 20 },
      { header: 'Nama Sub Program', key: 'sub_program', width: 30 },
      { header: 'Kegiatan Program', key: 'program_kegiatan', width: 30 },
      { header: 'Frekuensi Bantuan', key: 'frekuensi_bantuan', width: 20 },
      { header: 'NRM', key: 'nrm', width: 20 },
      { header: 'Nama Mustahik', key: 'nama_mustahik', width: 35 },
      { header: 'NIK', key: 'nik', width: 20 },
      { header: 'Alamat', key: 'alamat', width: 40 },
      { header: 'Kelurahan', key: 'kelurahan', width: 20 },
      { header: 'Kecamatan', key: 'kecamatan', width: 20 },
      { header: 'Jumlah', key: 'jumlah', width: 18 },
      { header: 'Kategori Mustahiq', key: 'kategori_mustahiq', width: 20 },
      { header: 'Nama Program', key: 'nama_program', width: 30 },
      { header: 'Asnaf', key: 'asnaf', width: 15 },
      { header: 'Infak', key: 'infak', width: 15 },
      { header: 'Kuantitas', key: 'kuantitas', width: 12 },
      { header: 'Jenis ZIS Distribusi', key: 'jenis_zis_distribusi', width: 25 },
      { header: 'Nama Entitas', key: 'nama_entitas', width: 25 },
      { header: 'Keterangan', key: 'keterangan', width: 40 },
      { header: 'No HP', key: 'no_hp', width: 15 },
      { header: 'Rekomendasi UPZ', key: 'rekomendasi_upz', width: 30 },
      { header: 'Status', key: 'status', width: 15 }
    ],
    schema: null,   // validasi manual di resolver
    model: Distribusi
  }
};


// ============================================================
// RESOLVER: Konversi data Excel (nama) → data DB (ID)
// Menggunakan fuzzyFind agar toleran terhadap typo
// Kembalikan fungsi resolver(rowData) → { ...resolved, _fuzzyWarnings }
// ============================================================
const buildResolvers = async (jenis) => {
  if (jenis === 'mustahiq') {
    const [kelLookup, kecLookup, asnafLookup, kmLookup] = await Promise.all([
      buildLookupMap(Kelurahan),
      buildLookupMap(Kecamatan),
      buildLookupMap(Asnaf),
      buildLookupMap(KategoriMustahiq)
    ]);
    return async (rowData) => {
      const resolved = { ...rowData };
      const warnings = [];
      const resolve = (lookup, field, idField, label) => {
        if (resolved[field] !== undefined) {
          const r = fuzzyFind(lookup, resolved[field]);
          resolved[idField] = r.id;
          if (r.matched && r.suggestion) warnings.push(`${label}: "${resolved[field]}" → dikoreksi ke "${r.suggestion}"`);
          if (!r.matched && resolved[field]) warnings.push(`${label}: "${resolved[field]}" tidak ditemukan. ${r.suggestion}`);
          delete resolved[field];
        }
      };
      resolve(kelLookup, 'kelurahan', 'kelurahan_id', 'Kelurahan');
      resolve(kecLookup, 'kecamatan', 'kecamatan_id', 'Kecamatan');
      resolve(asnafLookup, 'asnaf', 'asnaf_id', 'Asnaf');
      resolve(kmLookup, 'kategori_mustahiq', 'kategori_mustahiq_id', 'Kategori Mustahiq');

      if (warnings.length) resolved._fuzzyWarnings = warnings;
      return resolved;
    };
  }

  if (jenis === 'muzakki') {
    const [jmLookup, upzLookup, kelLookup, kecLookup] = await Promise.all([
      buildLookupMap(JenisMuzakki),
      buildLookupMap(JenisUpz),
      buildLookupMap(Kelurahan),
      buildLookupMap(Kecamatan)
    ]);
    return async (rowData) => {
      const resolved = { ...rowData };
      const warnings = [];
      const resolve = (lookup, field, idField, label) => {
        if (resolved[field] !== undefined) {
          const r = fuzzyFind(lookup, resolved[field]);
          resolved[idField] = r.id;
          if (r.matched && r.suggestion) warnings.push(`${label}: "${resolved[field]}" → dikoreksi ke "${r.suggestion}"`);
          if (!r.matched && resolved[field]) warnings.push(`${label}: "${resolved[field]}" tidak ditemukan. ${r.suggestion}`);
          delete resolved[field];
        }
      };
      resolve(jmLookup, 'jenis_muzakki', 'jenis_muzakki_id', 'Jenis Muzakki');
      resolve(upzLookup, 'jenis_upz', 'jenis_upz_id', 'Jenis UPZ');
      resolve(kelLookup, 'kelurahan', 'kelurahan_id', 'Kelurahan');
      resolve(kecLookup, 'kecamatan', 'kecamatan_id', 'Kecamatan');

      if (warnings.length) resolved._fuzzyWarnings = warnings;
      return resolved;
    };
  }

  if (jenis === 'penerimaan') {
    const [viaLookup, metodeLookup, zisLookup, jenisZisLookup] = await Promise.all([
      buildLookupMap(ViaPenerimaan),
      buildLookupMap(MetodeBayar),
      buildLookupMap(Zis),
      buildLookupMap(JenisZis)
    ]);
    return async (rowData) => {
      const resolved = { ...rowData };
      const warnings = [];
      const resolve = (lookup, field, idField, label) => {
        if (resolved[field] !== undefined) {
          const r = fuzzyFind(lookup, resolved[field]);
          resolved[idField] = r.id;
          if (r.matched && r.suggestion) warnings.push(`${label}: "${resolved[field]}" → dikoreksi ke "${r.suggestion}"`);
          if (!r.matched && resolved[field]) warnings.push(`${label}: "${resolved[field]}" tidak ditemukan. ${r.suggestion}`);
          delete resolved[field];
        }
      };
      resolve(viaLookup, 'via', 'via_id', 'Via');
      resolve(metodeLookup, 'metode_bayar', 'metode_bayar_id', 'Metode Bayar');
      resolve(zisLookup, 'zis', 'zis_id', 'ZIS');
      resolve(jenisZisLookup, 'jenis_zis', 'jenis_zis_id', 'Jenis ZIS');

      if (resolved.muzakki_identifier !== undefined) {
        if (resolved.muzakki_identifier) {
          const m = await findMuzakkiByIdentifier(resolved.muzakki_identifier, resolved.muzakki_identifier, resolved.muzakki_identifier);
          resolved.muzakki_id = m.id;
          if (m.matched && m.suggestion) warnings.push(`Muzakki: ${m.suggestion}`);
          if (!m.matched) warnings.push(`Muzakki: "${resolved.muzakki_identifier}" tidak ditemukan.`);
        } else {
          resolved.muzakki_id = null;
        }
        delete resolved.muzakki_identifier;
      }

      if (warnings.length) resolved._fuzzyWarnings = warnings;
      return resolved;
    };
  }

  if (jenis === 'distribusi') {
    const [
      npLookup, spLookup, pkLookup, neLookup,
      kmLookup, jzdLookup, fbLookup
    ] = await Promise.all([
      buildLookupMap(NamaProgram),
      buildLookupMap(SubProgram),
      buildLookupMap(ProgramKegiatan),
      buildLookupMap(NamaEntitas),
      buildLookupMap(KategoriMustahiq),
      buildLookupMap(JenisZisDistribusi),
      buildLookupMap(FrekuensiBantuan)
    ]);
    return async (rowData) => {
      const resolved = { ...rowData };
      const warnings = [];
      const resolve = (lookup, field, idField, label) => {
        if (resolved[field] !== undefined) {
          const r = fuzzyFind(lookup, resolved[field]);
          resolved[idField] = r.id;
          if (r.matched && r.suggestion) warnings.push(`${label}: "${resolved[field]}" → dikoreksi ke "${r.suggestion}"`);
          if (!r.matched && resolved[field]) warnings.push(`${label}: "${resolved[field]}" tidak ditemukan. ${r.suggestion}`);
          delete resolved[field];
        }
      };
      resolve(npLookup, 'nama_program', 'nama_program_id', 'Program');
      resolve(spLookup, 'sub_program', 'sub_program_id', 'Sub Program');
      resolve(pkLookup, 'program_kegiatan', 'program_kegiatan_id', 'Program Kegiatan');
      resolve(neLookup, 'nama_entitas', 'nama_entitas_id', 'Nama Entitas');
      resolve(kmLookup, 'kategori_mustahiq', 'kategori_mustahiq_id', 'Kategori Mustahiq');
      resolve(jzdLookup, 'jenis_zis_distribusi', 'jenis_zis_distribusi_id', 'Jenis ZIS');
      resolve(fbLookup, 'frekuensi_bantuan', 'frekuensi_bantuan_id', 'Frekuensi Bantuan');

      if (resolved.mustahiq_identifier !== undefined) {
        if (resolved.mustahiq_identifier) {
          const m = await findMustahiqByIdentifier(resolved.mustahiq_identifier, resolved.mustahiq_identifier, resolved.mustahiq_identifier);
          resolved.mustahiq_id = m.id;
          if (m.matched && m.suggestion) warnings.push(`Mustahiq: ${m.suggestion}`);
          if (!m.matched) warnings.push(`Mustahiq: "${resolved.mustahiq_identifier}" tidak ditemukan.`);
        } else {
          resolved.mustahiq_id = null;
        }
        delete resolved.mustahiq_identifier;
      }

      if (warnings.length) resolved._fuzzyWarnings = warnings;
      return resolved;
    };
  }

  return async (rowData) => rowData;
};

// ============================================================
// HELPERS KHUSUS FORMAT EXCEL LAMA
// ============================================================

/**
 * Konversi tanggal Indonesia "1 Januari 2026" → "2026-01-01"
 * Juga handle format Date object dari ExcelJS dan "YYYY-MM-DD" langsung.
 */
const BULAN_ID = {
  januari: '01', februari: '02', maret: '03', april: '04',
  mei: '05', juni: '06', juli: '07', agustus: '08',
  september: '09', oktober: '10', november: '11', desember: '12'
};

const parseIndonesianDate = (val) => {
  if (!val) return null;
  // Jika sudah object Date (ExcelJS serialize)
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  // Sudah YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // "1 Januari 2026" atau "01 Januari 2026"
  const parts = str.toLowerCase().split(/\s+/);
  if (parts.length === 3) {
    const [day, monthStr, year] = parts;
    const month = BULAN_ID[monthStr];
    if (month) {
      return `${year}-${month}-${String(day).padStart(2, '0')}`;
    }
  }
  return null;
};

/**
 * Cari muzakki_id berdasarkan identifier (NPWZ, NIK, atau Nama).
 */
const findMuzakkiByIdentifier = async (npwzRaw, nikRaw, namaRaw) => {
  const npwz = npwzRaw ? String(npwzRaw).trim() : null;
  const nik = nikRaw ? String(nikRaw).trim() : null;
  const nama = namaRaw ? String(namaRaw).trim() : null;

  if (!npwz && !nik && !nama) return { id: null, matched: false, suggestion: 'Semua identifier muzakki kosong.' };

  // 1. Cek NPWZ (Exact)
  if (npwz) {
    const found = await Muzakki.findOne({ where: { npwz } });
    if (found) return { id: found.id, matched: true, suggestion: null };
  }

  // 2. Cek NIK (Exact)
  if (nik) {
    const found = await Muzakki.findOne({ where: { nik } });
    if (found) return { id: found.id, matched: true, suggestion: null };
  }

  // 3. Cek Nama (Exact atau Fuzzy)
  if (nama) {
    let found = await Muzakki.findOne({ where: db.literal(`LOWER(nama) = LOWER(${db.escape(nama)})`) });
    if (found) return { id: found.id, matched: true, suggestion: null };

    // Fuzzy
    const all = await Muzakki.findAll({ attributes: ['id', 'nama'] });
    const list = all.map(r => ({ id: r.id, key: (r.nama || '').toLowerCase().trim(), original: r.nama }));
    let bestDist = Infinity, bestEntry = null;
    for (const entry of list) {
      const dist = levenshtein(nama.toLowerCase(), entry.key);
      if (dist < bestDist) { bestDist = dist; bestEntry = entry; }
    }
    if (bestEntry && bestDist <= 3) {
      return { id: bestEntry.id, matched: true, suggestion: `"${nama}" → dikoreksi ke "${bestEntry.original}"` };
    }
  }

  return { id: null, matched: false, suggestion: `Muzakki tidak ditemukan di database.` };
};

/**
 * Cari mustahiq_id berdasarkan identifier (NRM, NIK, atau Nama).
 */
const findMustahiqByIdentifier = async (nrmRaw, nikRaw, namaRaw) => {
  const nrm = nrmRaw ? String(nrmRaw).trim() : null;
  const nik = nikRaw ? String(nikRaw).trim() : null;
  const nama = namaRaw ? String(namaRaw).trim() : null;

  if (!nrm && !nik && !nama) return { id: null, matched: false, suggestion: 'Semua identifier mustahiq kosong.' };

  // 1. Cek NRM (Exact)
  if (nrm) {
    const found = await Mustahiq.findOne({ where: { nrm } });
    if (found) return { id: found.id, matched: true, suggestion: null };
  }

  // 2. Cek NIK (Exact)
  if (nik) {
    const found = await Mustahiq.findOne({ where: { nik } });
    if (found) return { id: found.id, matched: true, suggestion: null };
  }

  // 3. Cek Nama (Exact atau Fuzzy)
  if (nama) {
    let found = await Mustahiq.findOne({ where: db.literal(`LOWER(nama) = LOWER(${db.escape(nama)})`) });
    if (found) return { id: found.id, matched: true, suggestion: null };

    // Fuzzy
    const all = await Mustahiq.findAll({ attributes: ['id', 'nama'] });
    const list = all.map(r => ({ id: r.id, key: (r.nama || '').toLowerCase().trim(), original: r.nama }));
    let bestDist = Infinity, bestEntry = null;
    for (const entry of list) {
      const dist = levenshtein(nama.toLowerCase(), entry.key);
      if (dist < bestDist) { bestDist = dist; bestEntry = entry; }
    }
    if (bestEntry && bestDist <= 3) {
      return { id: bestEntry.id, matched: true, suggestion: `"${nama}" → dikoreksi ke "${bestEntry.original}"` };
    }
  }

  return { id: null, matched: false, suggestion: `Mustahiq tidak ditemukan di database.` };
};

/**
 * Cari persentase_amil_id berdasarkan nilai persentase dari Excel (misal 12,5 atau 20).
 * PersentaseAmil.nilai disimpan sebagai DECIMAL(5,4) = 0.1250 untuk 12.5%
 */
const buildPersentaseAmilLookup = async () => {
  const rows = await PersentaseAmil.findAll({ attributes: ['id', 'label', 'nilai'] });
  // Buat map: "12.5" → id, "12,5" → id, "20" → id, dll.
  const map = {};
  for (const row of rows) {
    const val = parseFloat(row.nilai);
    const pct = val * 100; // 0.1250 → 12.5
    const keys = [
      String(pct),                          // "12.5"
      String(pct).replace('.', ','),        // "12,5"
      String(val),                          // "0.125"
      String(val).replace('.', ','),        // "0,125"
      String(Math.round(pct)),              // "13" jika bulat
      (row.label || '').toLowerCase().trim(),
      (row.label || '').toLowerCase().replace('%', '').trim()
    ];
    for (const k of keys) { if (k) map[k] = row.id; }
  }
  return map;
};

const findPersentaseAmilId = (lookupMap, amilPctRaw) => {
  if (!amilPctRaw) return null;
  const key = String(amilPctRaw).replace(/\s/g, '').replace(',', '.');
  // coba exact key bertanda koma
  const keyKoma = String(amilPctRaw).replace(/\s/g, '');
  return lookupMap[key] || lookupMap[keyKoma] || null;
};

// ============================================================
// RESOLVER untuk penerimaan_excel (format Excel lama user)
// ============================================================
const buildResolverPenerimaanExcel = async () => {
  const [viaLookup, metodeLookup, zisLookup, jenisZisLookup, jmLookup, upzLookup, amil_map] = await Promise.all([
    buildLookupMap(ViaPenerimaan),
    buildLookupMap(MetodeBayar),
    buildLookupMap(Zis),
    buildLookupMap(JenisZis),
    buildLookupMap(JenisMuzakki),
    buildLookupMap(JenisUpz),
    buildPersentaseAmilLookup()
  ]);

  return async (rowData) => {
    const resolved = {};
    const warnings = [];

    // 1. Tanggal
    resolved.tanggal = parseIndonesianDate(rowData.tanggal_raw);
    if (!resolved.tanggal) warnings.push(`Tanggal "${rowData.tanggal_raw}" tidak valid.`);

    // 2. Muzakki (cari by nama/identitas)
    const muzRes = await findMuzakkiByIdentifier(null, null, rowData.nama_muzakki);
    resolved.muzakki_id = muzRes.id;

    // 3. Via (kolom MUZAKI: Bank/Cash/Kantor Digital)
    const viaR = fuzzyFind(viaLookup, rowData.via_raw);
    resolved.via_id = viaR.id;
    if (viaR.matched && viaR.suggestion) warnings.push(`Via: "${rowData.via_raw}" → "${viaR.suggestion}"`);
    if (!viaR.matched) warnings.push(`Via: "${rowData.via_raw}" tidak ditemukan. ${viaR.suggestion}`);

    // 4. Metode Bayar (kolom CASH/BANK)
    const mbR = fuzzyFind(metodeLookup, rowData.metode_bayar);
    resolved.metode_bayar_id = mbR.id;  // opsional, tidak error jika null
    if (mbR.matched && mbR.suggestion) warnings.push(`Metode Bayar: "${rowData.metode_bayar}" → "${mbR.suggestion}"`);

    // 5. ZIS (kolom ZIS: ZAKAT/INFAQ)
    const zisR = fuzzyFind(zisLookup, rowData.zis);
    resolved.zis_id = zisR.id;
    if (zisR.matched && zisR.suggestion) warnings.push(`ZIS: "${rowData.zis}" → "${zisR.suggestion}"`);
    if (!zisR.matched) warnings.push(`ZIS: "${rowData.zis}" tidak ditemukan. ${zisR.suggestion}`);

    // 6. Jenis ZIS
    const jzR = fuzzyFind(jenisZisLookup, rowData.jenis_zis);
    resolved.jenis_zis_id = jzR.id;
    if (jzR.matched && jzR.suggestion) warnings.push(`Jenis ZIS: "${rowData.jenis_zis}" → "${jzR.suggestion}"`);
    if (!jzR.matched) warnings.push(`Jenis ZIS: "${rowData.jenis_zis}" tidak ditemukan. ${jzR.suggestion}`);

    // 7. Jumlah
    resolved.jumlah = parseFloat(String(rowData.jumlah || '').replace(/,/g, '')) || null;

    // 8. Persentase Amil
    resolved.persentase_amil_id = findPersentaseAmilId(amil_map, rowData.amil_pct);
    if (!resolved.persentase_amil_id) warnings.push(`Amil %: "${rowData.amil_pct}" tidak cocok dengan data persentase amil.`);

    // 9. Jenis Muzakki (snapshot, opsional)
    const jmR = fuzzyFind(jmLookup, rowData.jenis_muzakki);
    resolved.jenis_muzakki_id = jmR.id || null;

    // 10. Jenis UPZ (snapshot, opsional)
    const upzR = fuzzyFind(upzLookup, rowData.jenis_upz);
    resolved.jenis_upz_id = upzR.id || null;

    // 11. Snapshot nama muzakki
    resolved.nama_muzakki = rowData.nama_muzakki || null;

    // 12. No Rekening & Keterangan
    resolved.no_rekening = rowData.no_rekening || null;
    resolved.keterangan = rowData.keterangan || null;

    if (warnings.length) resolved._fuzzyWarnings = warnings;
    return resolved;
  };
};

// Schema Zod khusus penerimaan_excel (lebih longgar: metode_bayar opsional)
const penerimaanExcelSchema = z.object({
  muzakki_id: z.number().int().positive('Muzakki tidak ditemukan.'),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid.'),
  via_id: z.number().int().positive('Via tidak ditemukan.'),
  metode_bayar_id: z.number().int().positive().nullable().optional(),
  zis_id: z.number().int().positive('ZIS tidak ditemukan.'),
  jenis_zis_id: z.number().int().positive('Jenis ZIS tidak ditemukan.'),
  jumlah: z.number().positive('Jumlah harus > 0.'),
  persentase_amil_id: z.number().int().positive('Persentase amil tidak ditemukan.'),
  jenis_muzakki_id: z.number().int().positive().nullable().optional(),
  jenis_upz_id: z.number().int().positive().nullable().optional(),
  nama_muzakki: z.string().nullable().optional(),
  no_rekening: z.string().nullable().optional(),
  keterangan: z.string().nullable().optional()
});

// ============================================================
// RESOLVER untuk distribusi_excel (format Excel distribusi lama)
// ============================================================
const buildResolverDistribusiExcel = async () => {
  const [npLookup, spLookup, pkLookup, kmLookup, fbLookup, asnafLookup, infakLookup, jzdLookup, neLookup] = await Promise.all([
    buildLookupMap(NamaProgram),
    buildLookupMap(SubProgram),
    buildLookupMap(ProgramKegiatan),
    buildLookupMap(KategoriMustahiq),
    buildLookupMap(FrekuensiBantuan),
    buildLookupMap(Asnaf),
    buildLookupMap(Infak),
    buildLookupMap(JenisZisDistribusi),
    buildLookupMap(NamaEntitas)
  ]);

  return async (rowData) => {
    const resolved = {};
    const warnings = [];

    // 1. Tanggal
    resolved.tanggal = parseIndonesianDate(rowData.tanggal_raw);
    if (!resolved.tanggal) warnings.push(`Tanggal "${rowData.tanggal_raw}" tidak valid.`);

    // 2. Mustahiq by NRM/NIK
    const mRes = await findMustahiqByIdentifier(rowData.nrm, rowData.nik, rowData.nama_mustahik);
    resolved.mustahiq_id = mRes.id;
    if (mRes.suggestion) warnings.push(mRes.matched ? mRes.suggestion : `ERROR: ${mRes.suggestion}`);

    // 3. Jumlah
    resolved.jumlah = parseFloat(String(rowData.jumlah || '').replace(/,/g, '')) || null;

    // 4. Nama Program
    const npR = fuzzyFind(npLookup, rowData.nama_program);
    resolved.nama_program_id = npR.id || null;
    if (npR.matched && npR.suggestion) warnings.push(`Program: "${rowData.nama_program}" → "${npR.suggestion}"`);
    if (!npR.matched && rowData.nama_program) warnings.push(`Program: "${rowData.nama_program}" tidak ditemukan. ${npR.suggestion}`);

    // 5. Sub Program
    const spR = fuzzyFind(spLookup, rowData.sub_program);
    resolved.sub_program_id = spR.id || null;
    if (spR.matched && spR.suggestion) warnings.push(`Sub Program: "${rowData.sub_program}" → "${spR.suggestion}"`);
    if (!spR.matched && rowData.sub_program) warnings.push(`Sub Program: "${rowData.sub_program}" tidak ditemukan. ${spR.suggestion}`);

    // 6. Program Kegiatan
    const pkR = fuzzyFind(pkLookup, rowData.program_kegiatan);
    resolved.program_kegiatan_id = pkR.id || null;
    if (pkR.matched && pkR.suggestion) warnings.push(`Kegiatan: "${rowData.program_kegiatan}" → "${pkR.suggestion}"`);
    if (!pkR.matched && rowData.program_kegiatan) warnings.push(`Kegiatan: "${rowData.program_kegiatan}" tidak ditemukan. ${pkR.suggestion}`);

    // 7. Frekuensi Bantuan
    const fbR = fuzzyFind(fbLookup, rowData.frekuensi_bantuan);
    resolved.frekuensi_bantuan_id = fbR.id || null;
    if (fbR.matched && fbR.suggestion) warnings.push(`Frekuensi: "${rowData.frekuensi_bantuan}" → "${fbR.suggestion}"`);

    // 8. Kategori Mustahiq
    const kmR = fuzzyFind(kmLookup, rowData.kategori_mustahiq);
    resolved.kategori_mustahiq_id = kmR.id || null;
    if (kmR.matched && kmR.suggestion) warnings.push(`Kategori: "${rowData.kategori_mustahiq}" → "${kmR.suggestion}"`);

    // 9. Asnaf (dari kolom 'Asnaf' atau fallback 'asnaf_kode')
    const asnafVal = rowData.asnaf || rowData.asnaf_kode;
    const asnafR = fuzzyFind(asnafLookup, asnafVal);
    resolved.asnaf_id = asnafR.id || null;
    if (asnafR.matched && asnafR.suggestion) warnings.push(`Asnaf: "${asnafVal}" → "${asnafR.suggestion}"`);

    // 10. Infak
    const infakR = fuzzyFind(infakLookup, rowData.infak);
    resolved.infak_id = infakR.id || null;

    // 10a. Jenis ZIS Distribusi
    const jzdR = fuzzyFind(jzdLookup, rowData.jenis_zis_distribusi);
    resolved.jenis_zis_distribusi_id = jzdR.id || null;
    if (jzdR.matched && jzdR.suggestion) warnings.push(`Jenis ZIS Distribusi: "${rowData.jenis_zis_distribusi}" → "${jzdR.suggestion}"`);

    // 10b. Nama Entitas
    const neR = fuzzyFind(neLookup, rowData.nama_entitas);
    resolved.nama_entitas_id = neR.id || null;
    if (neR.matched && neR.suggestion) warnings.push(`Entitas: "${rowData.nama_entitas}" → "${neR.suggestion}"`);

    // 11. Snapshot fields
    const parsedQty = parseInt(rowData.kuantitas) || parseInt(rowData.quantity);
    resolved.quantity = isNaN(parsedQty) ? null : parsedQty;
    resolved.nrm = rowData.nrm ? String(rowData.nrm).trim() : null;
    resolved.nama_mustahik = rowData.nama_mustahik || null;
    resolved.nik = rowData.nik ? String(rowData.nik).trim() : null;
    resolved.alamat = rowData.alamat || null;
    resolved.no_hp = rowData.no_hp ? String(rowData.no_hp).trim() : null;
    resolved.keterangan = rowData.keterangan || null;
    resolved.rekomendasi_upz = rowData.rekomendasi_upz || null;

    // 12. Status
    resolved.status = rowData.status ? String(rowData.status).toLowerCase().trim() : 'diterima';

    if (warnings.length) resolved._fuzzyWarnings = warnings;
    return resolved;
  };
};

// Schema Zod untuk distribusi_excel
const distribusiExcelSchema = z.object({
  mustahiq_id: z.number().int().positive('NRM mustahiq tidak ditemukan.'),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid.').nullable().optional(),
  jumlah: z.number().nonnegative().nullable().optional(),
  nama_program_id: z.number().int().positive().nullable().optional(),
  sub_program_id: z.number().int().positive().nullable().optional(),
  program_kegiatan_id: z.number().int().positive().nullable().optional(),
  frekuensi_bantuan_id: z.number().int().positive().nullable().optional(),
  kategori_mustahiq_id: z.number().int().positive().nullable().optional(),
  asnaf_id: z.number().int().positive().nullable().optional(),
  infak_id: z.number().int().positive().nullable().optional(),
  nrm: z.string().nullable().optional(),
  nama_mustahik: z.string().nullable().optional(),
  nik: z.string().nullable().optional(),
  alamat: z.string().nullable().optional(),
  no_hp: z.string().nullable().optional(),
  keterangan: z.string().nullable().optional(),
  rekomendasi_upz: z.string().nullable().optional(),
  status: z.enum(['menunggu', 'diterima', 'ditolak']).nullable().optional(),
  jenis_zis_distribusi_id: z.number().int().positive().nullable().optional(),
  nama_entitas_id: z.number().int().positive().nullable().optional(),
  quantity: z.number().int().positive().nullable().optional()
});

// ============================================================
// HELPER: Cari sheet yang tepat berdasarkan nama (case-insensitive)
// Priority: untuk penerimaan_excel → "DATA ZIS", distribusi_excel → "DATA DISTRIBUSI"
// Fallback: sheet pertama
// ============================================================
const SHEET_PRIORITY = {
  mustahiq: ['DATA MUSTAHIQ', 'MUSTAHIQ', 'SHEET1'],
  muzakki: ['DATA MUZAKKI', 'MUZAKKI', 'SHEET1'],
  penerimaan: ['DATA PENERIMAAN', 'PENERIMAAN', 'DATA ZIS', 'ZIS', 'SHEET1'],
  distribusi: ['DATA DISTRIBUSI', 'DISTRIBUSI', 'DATA PENYALURAN', 'PENYALURAN', 'SHEET1'],
  penerimaan_excel: ['DATA ZIS', 'ZIS', 'PENERIMAAN', 'DATA PENERIMAAN', 'SHEET1'],
  distribusi_excel: ['DATA DISTRIBUSI', 'DISTRIBUSI', 'DATA PENYALURAN', 'PENYALURAN', 'SHEET1'],
};

const getTargetSheet = (workbook, jenis) => {
  const priorities = SHEET_PRIORITY[jenis] || [];
  // Cari berdasarkan nama (case-insensitive)
  for (const priority of priorities) {
    const found = workbook.worksheets.find(
      (ws) => ws.name.trim().toUpperCase() === priority.toUpperCase()
    );
    if (found) return found;
  }
  // Fallback: sheet pertama yang ada
  return workbook.worksheets[0];
};

// ============================================================
// PREVIEW & IMPORT untuk format custom (async resolver)
// ============================================================
const previewExcelCustom = async (fileBuffer, jenis) => {
  const config = COLUMN_CONFIG[jenis];
  // Pilih resolver
  const resolver = jenis === 'penerimaan_excel'
    ? await buildResolverPenerimaanExcel()
    : await buildResolverDistribusiExcel();
  const schema = jenis === 'penerimaan_excel' ? penerimaanExcelSchema : distribusiExcelSchema;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const sheet = getTargetSheet(workbook, jenis);
  if (!sheet) throw new Error('File Excel tidak memiliki sheet yang dapat dibaca.');

  const results = { total: 0, siap_import: 0, bermasalah: 0, preview_valid: [], preview_invalid: [] };

  // Baca header baris 1 untuk auto-mapping posisi kolom
  const headerRow = sheet.getRow(1);
  const headerMap = {};
  headerRow.eachCell((cell, colNum) => {
    const h = (cell.value || '').toString().trim().toUpperCase();
    headerMap[h] = colNum;
  });

  const getColIdx = (headerRaw) => headerMap[headerRaw.toUpperCase()] || null;

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    // Skip baris kosong
    const firstVal = row.getCell(1).value;
    if (!firstVal) continue;
    // Skip baris petunjuk kuning
    if (typeof firstVal === 'string' && firstVal.startsWith('(')) continue;

    const rowData = {};
    config.columns.forEach((col) => {
      const colIdx = getColIdx(col.header);
      if (colIdx) {
        const cellVal = row.getCell(colIdx).value;
        rowData[col.key] = cellVal !== null && cellVal !== undefined ? cellVal : null;
      } else {
        rowData[col.key] = null;
      }
    });

    const resolved = await resolver(rowData);
    const fuzzyWarnings = resolved._fuzzyWarnings || [];
    delete resolved._fuzzyWarnings;

    const validation = schema.safeParse(resolved);
    results.total++;

    if (validation.success) {
      results.siap_import++;
      if (results.preview_valid.length < 1000) {
        results.preview_valid.push({
          row: rowNumber,
          data: validation.data,
          ...(fuzzyWarnings.length && { koreksi_otomatis: fuzzyWarnings })
        });
      }
    } else {
      results.bermasalah++;
      results.preview_invalid.push({
        row: rowNumber,
        data: rowData,
        errors: validation.error.format(),
        ...(fuzzyWarnings.length && { koreksi_otomatis: fuzzyWarnings })
      });
    }
  }

  return results;
};

const importExcelCustom = async (fileBuffer, jenis, userId) => {
  const config = COLUMN_CONFIG[jenis];
  const resolver = jenis === 'penerimaan_excel'
    ? await buildResolverPenerimaanExcel()
    : await buildResolverDistribusiExcel();
  const schema = jenis === 'penerimaan_excel' ? penerimaanExcelSchema : distribusiExcelSchema;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const sheet = getTargetSheet(workbook, jenis);
  if (!sheet) throw new Error('File Excel tidak memiliki sheet yang dapat dibaca.');

  const t = await db.transaction();

  // Normalisasi jenis agar sesuai dengan ENUM db ('penerimaan', 'distribusi', dll)
  const normalizedJenis = jenis === 'penerimaan_excel' ? 'penerimaan'
    : (jenis === 'distribusi_excel' ? 'distribusi' : jenis);

  const logData = {
    jenis: normalizedJenis,
    filename: 'imported_file.xlsx',
    total_rows: 0,
    success_rows: 0,
    failed_rows: 0,
    user_id: userId
  };

  // Auto-detect header positions
  const headerRow = sheet.getRow(1);
  const headerMap = {};
  headerRow.eachCell((cell, colNum) => {
    const h = (cell.value || '').toString().trim().toUpperCase();
    headerMap[h] = colNum;
  });
  const getColIdx = (headerRaw) => headerMap[headerRaw.toUpperCase()] || null;

  try {
    const rowsToInsert = [];
    const errors = [];

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      const firstVal = row.getCell(1).value;
      if (!firstVal) continue;
      if (typeof firstVal === 'string' && firstVal.startsWith('(')) continue;

      logData.total_rows++;

      const rowData = {};
      config.columns.forEach((col) => {
        const colIdx = getColIdx(col.header);
        if (colIdx) {
          const cellVal = row.getCell(colIdx).value;
          rowData[col.key] = cellVal !== null && cellVal !== undefined ? cellVal : null;
        } else {
          rowData[col.key] = null;
        }
      });

      const resolved = await resolver(rowData);
      delete resolved._fuzzyWarnings;

      const validation = schema.safeParse(resolved);
      if (validation.success) {
        const dataToInsert = { ...validation.data, created_by: userId };
        rowsToInsert.push(dataToInsert);
      } else {
        errors.push({ row: rowNumber, data: rowData, errors: validation.error.format() });
      }
    }

    if (errors.length > 0) {
      await t.rollback();
      logData.failed_rows = errors.length;
      await MigrationLog.create(logData); // log independently
      return {
        success: false,
        berhasil: 0,
        gagal: errors.length,
        detail_gagal: errors,
        message: 'Terdapat baris data yang bermasalah. Import dibatalkan secara keseluruhan untuk menjaga konsistensi data.'
      };
    }

    if (rowsToInsert.length > 0) {
      await config.model.bulkCreate(rowsToInsert, { transaction: t, ignoreDuplicates: true });
      logData.success_rows = rowsToInsert.length;
    }

    await MigrationLog.create(logData, { transaction: t });
    await t.commit();

    return {
      success: true,
      berhasil: logData.success_rows,
      gagal: 0,
      detail_gagal: []
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};


// ============================================================
// GENERATE TEMPLATE
// ============================================================
const generateTemplate = async (res, jenis) => {
  const config = COLUMN_CONFIG[jenis];
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Template ${jenis}`);

  sheet.columns = config.columns;

  // Style header biru
  sheet.getRow(1).fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' }
  };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Baris petunjuk (baris 2) berwarna kuning
  const guideRow = sheet.addRow(
    config.columns.reduce((acc, col) => {
      acc[col.key] = col.note ? `(${col.note})` : '';
      return acc;
    }, {})
  );
  guideRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
  guideRow.font = { italic: true, color: { argb: 'FF7F6000' } };

  // Tambahkan peringatan di baris ke-3
  const instructionRow = sheet.addRow(['PENTING: Lihat sheet "Referensi Valid" untuk melihat daftar nilai (teks) yang diperbolehkan diisi. Jika salah ketik, data mungkin gagal diimport atau dikoreksi otomatis.']);
  instructionRow.getCell(1).font = { bold: true, color: { argb: 'FFFF0000' } }; // Red
  // Merge cells untuk teks panjang
  sheet.mergeCells(`A3:${String.fromCharCode(64 + Math.min(26, config.columns.length))}3`);

  // Tambahkan 1 baris Data Contoh (Sample Data) di baris ke-4
  const sampleData = {
    mustahiq: { nrm: 'MHQ-2026-001', nama: 'Siti Rahayu', nik: '2171012345678901', jenis_kelamin: 'Perempuan', alamat: 'Jl. Contoh No 1, Batam Kota', kelurahan: 'Batu Selicin', kecamatan: 'Lubuk Baja', no_hp: '081234567890', asnaf: 'Fakir', kategori_mustahiq: 'Individu' },
    muzakki: { npwz: 'MZK-2026-001', nama: 'H. Ahmad Fauzi', nik: '2171098765432100', no_hp: '081298765432', npwp: '01.234.567.8-901.000', jenis_kelamin: 'Laki-laki', alamat: 'Jl. Zakat No 2, Batam Kota', kelurahan: 'Belian', kecamatan: 'Batam Kota', jenis_muzakki: 'Individu', jenis_upz: '' },
    penerimaan: { muzakki_identifier: 'Contoh Abdullah', tanggal: '2026-03-01', via: 'Bank', metode_bayar: 'Bank Mandiri', no_rekening: '1234567890', zis: 'Zakat', jenis_zis: 'Zakat Fitrah', amil_pct: '12.5', jumlah: 500000, keterangan: 'Zakat bulanan (Contoh)' },
    distribusi: { mustahiq_identifier: 'Contoh Fulan', tanggal: '2026-03-05', jumlah: 1000000, nama_program: 'Batam Peduli', sub_program: 'Bantuan Biaya Hidup Asnaf Fakir', program_kegiatan: 'Biaya Hidup Sehari-hari', nama_entitas: 'Individu', kategori_mustahiq: 'Individu', jenis_zis_distribusi: 'Zakat', frekuensi_bantuan: 'Tidak Rutin', no_rekening: '0987654321', keterangan: 'Bantuan (Contoh)' },
    penerimaan_excel: { tanggal_raw: '01 Januari 2026', bulan_raw: 'Januari', nama_muzakki: 'Contoh Abdullah', via_raw: 'Bank', metode_bayar: 'Bank Mandiri', jenis_zis: 'Zakat Fitrah', jenis_muzakki: 'Individu', jenis_upz: 'Individu', jumlah: 500000, amil_pct: '12.5', zis: 'Zakat', no_rekening: '1234567890', keterangan: 'Zakat bulanan (Contoh)' },
    distribusi_excel: { tanggal_raw: '05 Januari 2026', sub_program: 'Bantuan Biaya Hidup Asnaf Fakir', program_kegiatan: 'Biaya Hidup Sehari-hari', frekuensi_bantuan: 'Tidak Rutin', nrm: '123456', nama_mustahik: 'Contoh Fulan', nik: '2171012345678901', alamat: 'Jl. Contoh No 1', kelurahan: 'Batu Selicin', kecamatan: 'Lubuk Baja', jumlah: 1000000, kategori_mustahiq: 'Individu', nama_program: 'Batam Peduli', asnaf: 'Fakir', infak: '', kuantitas: 1, jenis_zis_distribusi: 'Zakat', nama_entitas: 'Individu', keterangan: 'Bantuan (Contoh)', no_hp: '081234567890', rekomendasi_upz: '', status: 'diterima' }
  };

  if (sampleData[jenis]) {
    const sampleRow = sheet.addRow(config.columns.map(col => sampleData[jenis][col.key] || ''));
    // Beri warna latar abu-abu muda untuk baris contoh agar terbedakan
    sampleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
    sampleRow.font = { italic: true };
  }

  // Build Reference Sheet
  const refSheet = workbook.addWorksheet('Referensi Valid');
  let refCols = [];
  let refData = {};

  const fetchRef = async (model, colName, field = 'nama') => {
    refCols.push({ header: colName, key: colName, width: 30 });
    const rows = await model.findAll({ attributes: [field], order: [[field, 'ASC']] });
    refData[colName] = rows.map(r => r[field]);
  };

  if (jenis === 'mustahiq') {
    await fetchRef(Asnaf, 'Asnaf');
    await fetchRef(KategoriMustahiq, 'Kategori Mustahiq');
    await fetchRef(Kecamatan, 'Kecamatan');
    await fetchRef(Kelurahan, 'Kelurahan');
    // Jenis Kelamin adalah ENUM
    refCols.push({ header: 'Jenis Kelamin', key: 'Jenis Kelamin', width: 20 });
    refData['Jenis Kelamin'] = ['Laki-laki', 'Perempuan'];
  } else if (jenis === 'muzakki') {
    await fetchRef(JenisMuzakki, 'Jenis Muzakki');
    await fetchRef(JenisUpz, 'Jenis UPZ');
    await fetchRef(Kecamatan, 'Kecamatan');
    await fetchRef(Kelurahan, 'Kelurahan');
    // Jenis Kelamin adalah ENUM, bukan tabel referensi
    refCols.push({ header: 'Jenis Kelamin', key: 'Jenis Kelamin', width: 20 });
    refData['Jenis Kelamin'] = ['Laki-laki', 'Perempuan'];
  } else if (jenis === 'penerimaan_excel' || jenis === 'penerimaan') {
    await fetchRef(ViaPenerimaan, 'Via (MUZAKI)');
    await fetchRef(MetodeBayar, 'Metode Bayar (CASH/BANK)');
    await fetchRef(Zis, 'ZIS');
    await fetchRef(JenisZis, 'Jenis ZIS');
    await fetchRef(JenisMuzakki, 'Jenis Muzakki');
    await fetchRef(JenisUpz, 'Jenis UPZ');
    await fetchRef(PersentaseAmil, 'AMIL % (Nilai)', 'nilai');
  } else if (jenis === 'distribusi_excel' || jenis === 'distribusi') {
    await fetchRef(Asnaf, 'Asnaf');
    await fetchRef(NamaProgram, 'Nama Program');
    await fetchRef(SubProgram, 'Nama Sub Program');
    await fetchRef(ProgramKegiatan, 'Kegiatan Program');
    await fetchRef(FrekuensiBantuan, 'Frekuensi Bantuan');
    await fetchRef(KategoriMustahiq, 'Kategori Mustahiq');
    await fetchRef(ViaPenerimaan, 'VIA');
    await fetchRef(Infak, 'Infak');
    await fetchRef(JenisZisDistribusi, 'Jenis ZIS Distribusi');
    await fetchRef(NamaEntitas, 'Nama Entitas');

    // Status enum (bukan tabel referensi)
    refCols.push({ header: 'Status', key: 'Status', width: 30 });
    refData['Status'] = ['menunggu', 'diterima', 'ditolak'];
  }

  if (refCols.length > 0) {
    refSheet.columns = refCols;
    refSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF548235' } };
    refSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const maxRows = Math.max(...Object.values(refData).map(arr => arr.length));
    for (let i = 0; i < maxRows; i++) {
      const row = {};
      refCols.forEach(col => {
        row[col.key] = refData[col.key][i] || '';
      });
      refSheet.addRow(row);
    }
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Template_Migrasi_${jenis}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
};

// ============================================================
// PREVIEW EXCEL (validasi tanpa simpan)
// ============================================================
const previewExcel = async (fileBuffer, jenis) => {
  const config = COLUMN_CONFIG[jenis];
  const resolver = await buildResolvers(jenis);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const sheet = getTargetSheet(workbook, jenis);
  if (!sheet) throw new Error('File Excel tidak memiliki sheet yang dapat dibaca.');

  const results = {
    total: 0,
    siap_import: 0,
    bermasalah: 0,
    preview_valid: [],
    preview_invalid: []
  };

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    if (rowNumber === 2) {       // skip baris petunjuk kuning jika ada
      const firstCell = row.getCell(1).value;
      if (typeof firstCell === 'string' && firstCell.startsWith('(')) continue;
    }

    const rowData = {};
    config.columns.forEach((col, index) => {
      const cellVal = row.getCell(index + 1).value;
      rowData[col.key] = cellVal !== null && cellVal !== undefined ? String(cellVal).trim() : null;
    });

    const resolved = await resolver(rowData);
    const fuzzyWarnings = resolved._fuzzyWarnings || [];
    delete resolved._fuzzyWarnings;

    const validation = config.schema.safeParse(resolved);

    if (validation.success) {
      results.siap_import++;
      if (results.preview_valid.length < 10) {
        results.preview_valid.push({
          row: rowNumber,
          data: validation.data,
          ...(fuzzyWarnings.length && { koreksi_otomatis: fuzzyWarnings })
        });
      }
    } else {
      results.bermasalah++;
      results.preview_invalid.push({
        row: rowNumber,
        data: rowData,
        errors: validation.error.format(),
        ...(fuzzyWarnings.length && { koreksi_otomatis: fuzzyWarnings })
      });
    }
    results.total++;
  }

  return results;
};

// ============================================================
// IMPORT EXCEL (simpan ke DB)
// ============================================================
const importExcel = async (fileBuffer, jenis, userId) => {
  const config = COLUMN_CONFIG[jenis];
  const resolver = await buildResolvers(jenis);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const sheet = getTargetSheet(workbook, jenis);
  if (!sheet) throw new Error('File Excel tidak memiliki sheet yang dapat dibaca.');

  const t = await db.transaction();

  // Normalisasi jenis agar sesuai dengan ENUM db ('penerimaan', 'distribusi', dll)
  const normalizedJenis = jenis === 'penerimaan_excel' ? 'penerimaan'
    : (jenis === 'distribusi_excel' ? 'distribusi' : jenis);

  const logData = {
    jenis: normalizedJenis,
    filename: 'imported_file.xlsx',
    total_rows: 0,
    success_rows: 0,
    failed_rows: 0,
    user_id: userId
  };

  try {
    const rowsToInsert = [];
    const errors = [];

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      if (rowNumber === 2) {       // skip baris petunjuk kuning jika ada
        const firstCell = row.getCell(1).value;
        if (typeof firstCell === 'string' && firstCell.startsWith('(')) continue;
      }

      logData.total_rows++;

      const rowData = {};
      config.columns.forEach((col, index) => {
        const cellVal = row.getCell(index + 1).value;
        rowData[col.key] = cellVal !== null && cellVal !== undefined ? String(cellVal).trim() : null;
      });

      // Konversi nama → ID
      const resolved = await resolver(rowData);

      const validation = config.schema.safeParse(resolved);
      if (validation.success) {
        const dataToInsert = validation.data;
        dataToInsert.registered_by = userId; // Ganti created_by dengan registered_by untuk Mustahiq & Muzakki
        if (jenis === 'penerimaan' || jenis === 'distribusi') {
          dataToInsert.created_by = userId;
        }
        rowsToInsert.push(dataToInsert);
      } else {
        errors.push({ row: rowNumber, data: rowData, errors: validation.error.format() });
      }
    }

    if (errors.length > 0) {
      await t.rollback();
      logData.failed_rows = errors.length;
      await MigrationLog.create(logData); // log independently
      return {
        success: false,
        berhasil: 0,
        gagal: errors.length,
        detail_gagal: errors,
        message: 'Terdapat baris data yang bermasalah. Import dibatalkan secara keseluruhan untuk menjaga konsistensi data.'
      };
    }

    if (rowsToInsert.length > 0) {
      // Hilangkan duplikat internal dalam array berdasarkan NIK/NRM/NPWZ agar tidak bentrok di Sequelize
      const uniqueRows = [];
      const keys = new Set();
      for (const row of rowsToInsert) {
        const key = row.nik || row.nrm || row.npwz || Math.random();
        if (!keys.has(key)) {
          uniqueRows.push(row);
          keys.add(key);
        }
      }

      await config.model.bulkCreate(uniqueRows, {
        transaction: t,
        ignoreDuplicates: true
      });
      logData.success_rows = uniqueRows.length;
    }

    await MigrationLog.create(logData, { transaction: t });
    await t.commit();
    return {
      success: true,
      berhasil: logData.success_rows,
      gagal: 0,
      detail_gagal: []
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ============================================================
// GET LOGS
// ============================================================
const getLogs = async (query) => {
  const where = {};
  if (query.jenis) where.jenis = query.jenis;
  if (query.user_id) where.user_id = query.user_id;
  if (query.tanggal) {
    where.created_at = {
      [Op.gte]: new Date(query.tanggal),
      [Op.lt]: new Date(new Date(query.tanggal).getTime() + 24 * 60 * 60 * 1000)
    };
  }

  const limit = parseInt(query.limit) || 10;
  const offset = (parseInt(query.page) - 1) * limit || 0;

  return await MigrationLog.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });
};

export default {
  generateTemplate,
  previewExcel,
  importExcel,
  getLogs,
  previewExcelCustom,
  importExcelCustom
};
