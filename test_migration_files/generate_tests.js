import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

// Output directory
const outputDir = path.join(process.cwd(), 'test_migration_files');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// =======================================================
// Data Mocking interconnected: 10 rows each
// =======================================================

const muzakkis = [];
const mustahiqs = [];
const penerimaans = [];
const distribusis = [];

for (let i = 1; i <= 10; i++) {
    // Muzakki
    const namaMuzakki = `Muzakki Tester Ke-${i}`;
    const npwz = `MZK-2026-${String(i).padStart(3, '0')}`;
    const nikMuzakki = `217101000000100${i}`;

    muzakkis.push({
        NPWZ: npwz,
        Nama: namaMuzakki,
        NIK: nikMuzakki,
        'No HP': `08120000100${i}`,
        NPWP: `01.234.567.8-100.${String(i).padStart(3, '0')}`,
        'Jenis Kelamin': i % 2 === 0 ? 'Perempuan' : 'Laki-laki',
        Alamat: `Perumahan Muzakki Blok ${String.fromCharCode(64 + i)}`,
        Kelurahan: 'Belian',
        Kecamatan: 'Batam Kota',
        'Jenis Muzakki': 'Individu',
        'Jenis UPZ': ''
    });

    // Penerimaan (using penerimaan_excel format)
    penerimaans.push({
        'TANGGAL': `0${i} Januari 2026`,
        'BULAN': 'Januari',
        'NAMA MUZAKKI': namaMuzakki,
        'MUZAKI': 'Bank', // Via
        'METODE BAYAR': 'Bank Riau Kepri Syariah',
        'JENIS ZIS': i % 2 === 0 ? 'Zakat Maal' : 'Zakat Fitrah',
        'JENIS MUZAKKI': 'Individu',
        'JENIS UPZ': '',
        'JUMLAH': 100000 * i,
        'AMIL %': '12.5',
        'ZIS': 'Zakat',
        'NO REKENING': `77889900${i}`,
        'KETERANGAN': `Zakat Januari Part ${i}`
    });

    // Mustahiq
    const namaMustahiq = `Mustahiq Penerima Ke-${i}`;
    const nrm = `MHQ-2026-${String(i).padStart(3, '0')}`;
    const nikMustahiq = `217102000000200${i}`;

    mustahiqs.push({
        NRM: nrm,
        Nama: namaMustahiq,
        NIK: nikMustahiq,
        'Jenis Kelamin': i % 2 === 0 ? 'Perempuan' : 'Laki-laki',
        Alamat: `Kp. Mustahiq Jaya RT ${i}`,
        Kelurahan: 'Batu Selicin',
        Kecamatan: 'Lubuk Baja',
        'No HP': `08520000200${i}`,
        Asnaf: 'Fakir',
        'Kategori Mustahiq': 'Individu'
    });

    // Distribusi (using distribusi_excel format)
    distribusis.push({
        'Tanggal': `1${i} Januari 2026`,
        'Nama Sub Program': 'Bantuan Biaya Hidup Asnaf Fakir',
        'Kegiatan Program': 'Biaya Hidup Sehari-hari',
        'Frekuensi Bantuan': 'Tidak Rutin',
        'NRM': nrm,
        'Nama Mustahik': namaMustahiq,
        'NIK': nikMustahiq,
        'Alamat': `Kp. Mustahiq Jaya RT ${i}`,
        'Kelurahan': 'Batu Selicin',
        'Kecamatan': 'Lubuk Baja',
        'Jumlah': 500000 * i,
        'VIA': 'Bank',
        'Kategori Mustahiq': 'Individu',
        'Nama Program': 'Batam Peduli',
        'Asnaf': 'Fakir',
        'Infak': '',
        'Kuantitas': 1,
        'Jenis ZIS Distribusi': 'Zakat',
        'Nama Entitas': 'Individu',
        'Keterangan': `Bantuan Tunai Periode ${i}`,
        'No HP': `08520000200${i}`,
        'Rekomendasi UPZ': '',
        'Status': 'diterima'
    });
}

// =======================================================
// Helper to Export to Excel
// =======================================================
async function createExcel(filename, data) {
    if (data.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // Set headers from the keys of the first object
    const headers = Object.keys(data[0]);
    worksheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));

    // Add rows
    data.forEach(item => worksheet.addRow(item));

    // Save file
    const filePath = path.join(outputDir, filename);
    await workbook.xlsx.writeFile(filePath);
    console.log(`Generated: ${filePath}`);
}

async function run() {
    await createExcel('1_Format_Muzakki_Test.xlsx', muzakkis);
    await createExcel('2_Format_Mustahiq_Test.xlsx', mustahiqs);
    await createExcel('3_Format_Penerimaan_Test.xlsx', penerimaans);
    await createExcel('4_Format_Distribusi_Test.xlsx', distribusis);
    console.log('All test files generated successfully!');
}

run();
