import laporanService from '../services/laporanService.js';
import excelHelper from '../utils/excelHelper.js';
import PDFDocument from 'pdfkit';

const getArusKas = async (req, res, next) => {
  try {
    const data = await laporanService.getArusKas(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getNeraca = async (req, res, next) => {
  try {
    const data = await laporanService.getNeraca(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const exportPenerimaan = async (req, res, next) => {
  try {
    const data = await laporanService.getRawDataForExport('penerimaan', req.query);
    const columns = [
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Muzakki', key: 'nama_muzakki', width: 25 },
      { header: 'Jenis ZIS', key: 'jenis_zis', width: 20 },
      { header: 'Jumlah', key: 'jumlah', width: 15 },
      { header: 'Via', key: 'via', width: 15 },
      { header: 'Keterangan', key: 'keterangan', width: 30 }
    ];
    await excelHelper(res, {
      sheetName: 'Penerimaan',
      columns,
      rows: data,
      filename: 'Laporan_Penerimaan'
    });
  } catch (error) {
    next(error);
  }
};

const exportDistribusi = async (req, res, next) => {
  try {
    const data = await laporanService.getRawDataForExport('distribusi', req.query);
    const columns = [
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Mustahiq', key: 'nama_mustahik', width: 25 },
      { header: 'Program', key: 'nama_program', width: 20 },
      { header: 'Jumlah', key: 'jumlah', width: 15 },
      { header: 'Asnaf', key: 'asnaf', width: 15 },
      { header: 'Keterangan', key: 'keterangan', width: 30 }
    ];
    await excelHelper(res, {
      sheetName: 'Distribusi',
      columns,
      rows: data,
      filename: 'Laporan_Distribusi'
    });
  } catch (error) {
    next(error);
  }
};

// --- PDF Export Arus Kas ---
const exportArusKasPdf = async (req, res, next) => {
  try {
    const data = await laporanService.getArusKas(req.query);
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Arus_Kas_${data.periode}.pdf"`);
    doc.pipe(res);

    doc.fontSize(16).text('BAZNAS KOTA BATAM', { align: 'center' });
    doc.fontSize(14).text('LAPORAN ARUS KAS', { align: 'center' });
    doc.fontSize(10).text(`Periode: ${data.periode}`, { align: 'center' });
    doc.moveDown();

    const drawRow = (label, value, isBold = false) => {
      if (isBold) doc.font('Helvetica-Bold');
      else doc.font('Helvetica');

      const y = doc.y;
      doc.text(label, 50, y);
      doc.text(value, 400, y, { align: 'right', width: 100 });
      doc.moveDown(0.5);
    };

    const fmt = (v) => `Rp ${parseFloat(v).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`;

    drawRow('SALDO AWAL', fmt(data.saldo_awal), true);
    doc.moveDown();

    doc.text('ARUS KAS MASUK:', { underline: true });
    drawRow('Total Zakat', fmt(data.arus_kas_masuk.total_zakat));
    drawRow('Total Infak/Sedekah', fmt(data.arus_kas_masuk.total_infaq));
    drawRow('Porsi Amil (12.5%)', `(${fmt(data.arus_kas_masuk.total_dana_amil)})`, false);
    drawRow('TOTAL KAS MASUK BERSIH', fmt(data.arus_kas_masuk.total_masuk - data.arus_kas_masuk.total_dana_amil), true);
    doc.moveDown();

    doc.text('ARUS KAS KELUAR:', { underline: true });
    drawRow('Total Pendistribusian', fmt(data.arus_kas_keluar.total_distribusi));
    drawRow('TOTAL KAS KELUAR', fmt(data.arus_kas_keluar.total_keluar), true);
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
    doc.moveDown();
    drawRow('SALDO AKHIR', fmt(data.saldo_akhir), true);

    doc.end();
  } catch (error) {
    next(error);
  }
};

const exportNeracaPdf = async (req, res, next) => {
  try {
    const data = await laporanService.getNeraca(req.query);
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Neraca_${data.periode}.pdf"`);
    doc.pipe(res);

    doc.fontSize(16).text('BAZNAS KOTA BATAM', { align: 'center' });
    doc.fontSize(14).text('LAPORAN NERACA', { align: 'center' });
    doc.fontSize(10).text(`Periode: ${data.periode}`, { align: 'center' });
    doc.moveDown();

    const drawRow = (label, value, isBold = false) => {
      if (isBold) doc.font('Helvetica-Bold');
      else doc.font('Helvetica');
      const y = doc.y;
      doc.text(label, 50, y);
      doc.text(value, 400, y, { align: 'right', width: 100 });
      doc.moveDown(0.5);
    };

    const fmt = (v) => `Rp ${parseFloat(v).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`;

    doc.text('AKTIVA (PENGGUNAAN DANA):', { underline: true, bold: true });
    drawRow('Kas dan Setara Kas', fmt(data.aktiva.kas_dan_setara_kas));
    drawRow('TOTAL AKTIVA', fmt(data.aktiva.total_aktiva), true);
    doc.moveDown();

    doc.text('PASIVA (SUMBER DANA):', { underline: true, bold: true });
    drawRow('Dana Zakat', fmt(data.pasiva.dana_zakat));
    drawRow('Dana Infaq', fmt(data.pasiva.dana_infaq));
    drawRow('Dana Amil', fmt(data.pasiva.dana_amil));
    drawRow('TOTAL PASIVA', fmt(data.pasiva.total_pasiva), true);
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
    doc.moveDown();
    drawRow('SELISIH (BALANCE)', fmt(data.selisih), true);

    doc.end();
  } catch (error) {
    next(error);
  }
};

const exportRekapTahunanPdf = async (req, res, next) => {
  try {
    const data = await laporanService.getRekapTahunan(req.query);
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Rekap_Tahunan_${data.tahun}.pdf"`);
    doc.pipe(res);

    doc.fontSize(16).text('BAZNAS KOTA BATAM', { align: 'center' });
    doc.fontSize(14).text(`REKAPITULASI PENYALURAN & PENERIMAAN TAHUN ${data.tahun}`, { align: 'center' });
    doc.moveDown();

    // Sederhananya tampilkan tabel data bulanan
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Bulan', 50, doc.y, { continued: true });
    doc.text('Penerimaan', 200, doc.y, { continued: true });
    doc.text('Penyaluran', 350, doc.y);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
    doc.moveDown(0.5);

    const bulanList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    doc.font('Helvetica');

    const fmt = (v) => parseFloat(v).toLocaleString('id-ID');

    bulanList.forEach(b => {
      const p = data.penerimaan.find(x => x.bulan === b)?.get('total') || 0;
      const d = data.distribusi.find(x => x.bulan === b)?.get('total') || 0;

      const y = doc.y;
      doc.text(b, 50, y);
      doc.text(fmt(p), 200, y);
      doc.text(fmt(d), 350, y);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

const getDistribusiByProgram = async (req, res, next) => {
  try {
    const data = await laporanService.getDistribusiByProgram(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getDistribusiByAsnaf = async (req, res, next) => {
  try {
    const data = await laporanService.getDistribusiByAsnaf(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getDistribusiHarian = async (req, res, next) => {
  try {
    const data = await laporanService.getDistribusiHarian(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getPerubahanDana = async (req, res, next) => {
  try {
    const data = await laporanService.getPerubahanDana(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const exportPerubahanDanaPdf = async (req, res, next) => {
  try {
    const data = await laporanService.getPerubahanDana(req.query);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Perubahan_Dana_${data.periode}.pdf"`);
    doc.pipe(res);

    // Helper functions for layout
    const startX = 40;
    const colLabelsX = 40;
    const colAccX = 230;
    const colCurrX = 300;
    const colPrevX = 415;
    const tableWidth = 520;

    const drawHeader = () => {
      doc.fontSize(12).font('Helvetica-Bold').text('BAZNAS KOTA BATAM', startX, 40, { align: 'left' });
      doc.fontSize(11).text('LAPORAN PERUBAHAN DANA (UNAUDITED)', { align: 'left' });
      doc.fontSize(10).font('Helvetica').text(`Per ${data.periode}`, { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica-Oblique').text('(Dinyatakan dalam Rupiah Penuh)', { align: 'left' });
      
      doc.moveDown(0.2);
      doc.moveTo(startX, doc.y).lineTo(startX + tableWidth, doc.y).stroke();
      doc.moveDown(1);
      
      doc.fontSize(9).font('Helvetica-Bold');
      const headerColY = doc.y;
      doc.text('Acc. No.', colAccX, headerColY, { width: 60, align: 'center' });
      doc.text(data.labels.tahun_current.toString(), colCurrX, headerColY, { width: 105, align: 'center' });
      doc.text(data.labels.tahun_previous.toString(), colPrevX, headerColY, { width: 105, align: 'center' });
      
      // Line under years
      doc.moveDown(0.5);
      doc.moveTo(colCurrX + 5, headerColY + 14).lineTo(colCurrX + 100, headerColY + 14).stroke();
      doc.moveTo(colPrevX + 5, headerColY + 14).lineTo(colPrevX + 100, headerColY + 14).stroke();
      doc.moveDown();
    };

    const drawFooter = (pageNum, totalPages) => {
      // Signatures
      doc.moveDown(4);
      const footerY = doc.y;
      
      doc.fontSize(9).font('Helvetica').text('03 Maret 2026', startX, footerY, { align: 'center' });
      doc.text('PIMPINAN', startX, footerY + 15, { align: 'center' });

      doc.moveDown(5);
      const signY = doc.y;
      doc.font('Helvetica-Bold').text('Habib Soleh, M.Pd.I.', startX, signY);
      doc.font('Helvetica').text('Ketua', startX, signY + 12);

      doc.font('Helvetica-Bold').text('Achmad Fahmi, S.T.', 400, signY);
      doc.font('Helvetica').text('Wakil Ketua Bidang Keuangan', 400, signY + 12);

      // Line under names
      doc.moveTo(startX, signY + 11).lineTo(startX + 110, signY + 11).stroke();
      doc.moveTo(400, signY + 11).lineTo(530, signY + 11).stroke();

      // Page Number
      doc.fontSize(8).font('Helvetica').text(`Page ${pageNum}/${totalPages}`, startX, 800, { align: 'center' });
      doc.moveTo(startX, 790).lineTo(startX + tableWidth, 790).stroke();
    };

    const fmt = (v) => parseFloat(v || 0).toLocaleString('id-ID');

    const drawRow = (label, acc, currVal, prevVal, isBold = false, indent = 0, topBorder = false, bottomBorder = false, doubleBottomBorder = false) => {
      const y = doc.y;
      
      if (topBorder) {
        doc.moveTo(colCurrX, y - 2).lineTo(colCurrX + 105, y - 2).stroke();
        doc.moveTo(colPrevX, y - 2).lineTo(colPrevX + 105, y - 2).stroke();
      }

      if (isBold) doc.font('Helvetica-Bold'); else doc.font('Helvetica');
      doc.text(label, colLabelsX + indent, y, { width: 180 });
      if (acc) doc.text(acc, colAccX, y, { width: 60, align: 'center' });
      doc.text(fmt(currVal), colCurrX, y, { width: 105, align: 'right' });
      doc.text(fmt(prevVal), colPrevX, y, { width: 105, align: 'right' });
      
      if (bottomBorder) {
        doc.moveTo(colCurrX, doc.y + 2).lineTo(colCurrX + 105, doc.y + 2).stroke();
        doc.moveTo(colPrevX, doc.y + 2).lineTo(colPrevX + 105, doc.y + 2).stroke();
      }

      if (doubleBottomBorder) {
        doc.moveTo(colCurrX, doc.y + 2).lineTo(colCurrX + 105, doc.y + 2).stroke();
        doc.moveTo(colPrevX, doc.y + 2).lineTo(colPrevX + 105, doc.y + 2).stroke();
        doc.moveTo(colCurrX, doc.y + 4).lineTo(colCurrX + 105, doc.y + 4).stroke();
        doc.moveTo(colPrevX, doc.y + 4).lineTo(colPrevX + 105, doc.y + 4).stroke();
      }

      doc.moveDown(1.2);
    };

    // ================= PAGE 1: ZAKAT =================
    drawHeader();
    
    doc.fontSize(10).font('Helvetica-Bold').text('DANA ZAKAT', colLabelsX, doc.y);
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica-Bold').text('Penerimaan Dana', colLabelsX, doc.y);
    doc.moveDown(0.3);
    const z = data.current.zakat;
    const oz = data.previous.zakat;

    drawRow('Penerimaan | Zakat | Entitas', '4101', z.penerimaan.entitas, oz.penerimaan.entitas, false, 15);
    drawRow('Penerimaan | Zakat | Individual', '4102', z.penerimaan.individual, oz.penerimaan.individual, false, 15);
    drawRow('Penerimaan | Zakat | Bagi Hasil atas...', '4103', 0, 0, false, 15);
    drawRow('Penerimaan | Zakat | Dampak Pengukuran', '4104', 0, 0, false, 15);
    drawRow('Penerimaan | Zakat | Hasil Penjualan/Laba', '4105', 0, 0, false, 15);
    drawRow('Penerimaan | Zakat | Lainnya', '4199', z.penerimaan.lainnya, oz.penerimaan.lainnya, false, 15);

    drawRow('Jumlah Penerimaan BAZNAS', '', z.total_penerimaan, oz.total_penerimaan, true, 0, true, true);
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica-Bold').text('Penyaluran Dana', colLabelsX, doc.y);
    doc.moveDown(0.3);
    drawRow('Penyaluran | Zakat | Amil', '5101', z.penyaluran.amil, oz.penyaluran.amil, false, 15);
    drawRow('Penyaluran | Zakat | Fakir', '5102', z.penyaluran.fakir, oz.penyaluran.fakir, false, 15);
    drawRow('Penyaluran | Zakat | Miskin', '5103', z.penyaluran.miskin, oz.penyaluran.miskin, false, 15);
    drawRow('Penyaluran | Zakat | Riqab', '5104', z.penyaluran.riqob, oz.penyaluran.riqob, false, 15);
    drawRow('Penyaluran | Zakat | Gharimin', '5105', z.penyaluran.gharimin, oz.penyaluran.gharimin, false, 15);
    drawRow('Penyaluran | Zakat | Muallaf', '5106', z.penyaluran.muallaf, oz.penyaluran.muallaf, false, 15);
    drawRow('Penyaluran | Zakat | Sabilillah', '5107', z.penyaluran.fisabilillah, oz.penyaluran.fisabilillah, false, 15);
    drawRow('Penyaluran | Zakat | Ibnu Sabil', '5108', z.penyaluran.ibnu_sabil, oz.penyaluran.ibnu_sabil, false, 15);
    drawRow('Penyaluran | Zakat | Alokasi Pemanfaatan', '5109', 0, 0, false, 15);
    drawRow('Penyaluran | Zakat | Lainnya', '5199', z.penyaluran.lainnya, oz.penyaluran.lainnya, false, 15);

    drawRow('Jumlah Penyaluran', '', z.total_penyaluran, oz.total_penyaluran, true, 0, true, true);
    doc.moveDown(0.5);

    drawRow('Surplus (Defisit)', '', z.surplus, oz.surplus, true);
    doc.moveDown(0.5);

    drawRow('Saldo Dana Zakat Awal Periode', '', z.saldo_awal, oz.saldo_awal, true);
    doc.moveDown(0.5);

    doc.fontSize(10);
    drawRow('Saldo Dana Zakat Akhir Periode', '', z.saldo_akhir, oz.saldo_akhir, true, 0, true, false, true);

    drawFooter(1, 2);

    // ================= PAGE 2: INFAK =================
    doc.addPage();
    drawHeader();
    
    doc.fontSize(10).font('Helvetica-Bold').text('DANA INFAK', colLabelsX, doc.y);
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica-Bold').text('Penerimaan Dana', colLabelsX, doc.y);
    doc.moveDown(0.3);
    const i = data.current.infak;
    const oi = data.previous.infak;

    drawRow('Penerimaan | Infak dan Sedekah | Terikat', '4201', i.penerimaan.terikat, oi.penerimaan.terikat, false, 15);
    drawRow('Penerimaan | Infak dan Sedekah | Tidak', '4202', i.penerimaan.tidak_terikat, oi.penerimaan.tidak_terikat, false, 15);
    drawRow('Penerimaan | Infak dan Sedekah | Bagi Hasil', '4203', i.penerimaan.bagi_hasil, oi.penerimaan.bagi_hasil, false, 15);
    drawRow('Penerimaan | Infak dan Sedekah | Dampak', '4204', i.penerimaan.dampak, oi.penerimaan.dampak, false, 15);
    drawRow('Penerimaan | Infak dan Sedekah | Hasil', '4205', i.penerimaan.hasil, oi.penerimaan.hasil, false, 15);
    drawRow('Penerimaan | Infak dan Sedekah | Lainnya', '4299', i.penerimaan.lainnya, oi.penerimaan.lainnya, false, 15);

    drawRow('Jumlah Penerimaan', '', i.total_penerimaan, oi.total_penerimaan, true, 0, true, true);
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica-Bold').text('Penyaluran Dana', colLabelsX, doc.y);
    doc.moveDown(0.3);
    drawRow('Penyaluran | Infak dan Sedekah | Amil-Infak', '5201', i.penyaluran.amil_infak, oi.penyaluran.amil_infak, false, 15);
    drawRow('Penyaluran | Infak dan Sedekah | Amil-Sedekah', '5202', i.penyaluran.amil_sedekah, oi.penyaluran.amil_sedekah, false, 15);
    drawRow('Penyaluran | Infak dan Sedekah | Terikat', '5203', i.penyaluran.terikat, oi.penyaluran.terikat, false, 15);
    drawRow('Penyaluran | Infak dan Sedekah | Tidak', '5204', i.penyaluran.tidak_terikat, oi.penyaluran.tidak_terikat, false, 15);
    drawRow('Penyaluran | Infak dan Sedekah | Alokasi', '5205', i.penyaluran.alokasi, oi.penyaluran.alokasi, false, 15);
    drawRow('Penyaluran | Infak dan Sedekah | Lainnya', '5299', i.penyaluran.lainnya, oi.penyaluran.lainnya, false, 15);

    drawRow('Jumlah Penyaluran', '', i.total_penyaluran, oi.total_penyaluran, true, 0, true, true);
    doc.moveDown(0.5);

    drawRow('Surplus (Defisit)', '', i.surplus, oi.surplus, true);
    doc.moveDown(0.5);

    drawRow('Saldo Dana Infak Awal Periode', '', i.saldo_awal, oi.saldo_awal, true);
    doc.moveDown(0.5);

    doc.fontSize(10);
    drawRow('Saldo Dana Infak Akhir Periode', '', i.saldo_akhir, oi.saldo_akhir, true, 0, true, false, true);

    drawFooter(2, 3);

    // ─── PAGE 3: DANA AMIL ───
    doc.addPage();
    drawHeader();

    const am = data.current.amil  || {};
    const oam = data.previous.amil || {};

    doc.fontSize(10).font('Helvetica-Bold').text('DANA AMIL', colLabelsX, doc.y);
    doc.moveDown(0.5);

    // --- Penerimaan Amil ---
    doc.fontSize(9).font('Helvetica-Bold').text('Penerimaan Dana', colLabelsX, doc.y);
    doc.moveDown(0.3);
    drawRow('Penerimaan | Amil | Bagian dari Zakat',            '4301', am.penerimaan?.bagian_dari_zakat, oam.penerimaan?.bagian_dari_zakat, false, 15);
    drawRow('Penerimaan | Amil | Bagian dari Infak dan Sedekah','4302', am.penerimaan?.bagian_dari_infak, oam.penerimaan?.bagian_dari_infak, false, 15);
    drawRow('Penerimaan | Amil | Infak dan Sedekah',            '4303', am.penerimaan?.infak_sedekah,     oam.penerimaan?.infak_sedekah,     false, 15);
    drawRow('Penerimaan | Amil | Bagi Hasil',                   '4304', am.penerimaan?.bagi_hasil,         oam.penerimaan?.bagi_hasil,         false, 15);
    drawRow('Penerimaan | Amil | Lainnya',                      '4399', am.penerimaan?.lainnya,            oam.penerimaan?.lainnya,            false, 15);
    doc.moveDown(0.3);
    drawRow('Jumlah Penerimaan', '', am.total_penerimaan, oam.total_penerimaan, true, 0, false, true);
    doc.moveDown(0.8);

    // --- Penyaluran Amil ---
    doc.fontSize(9).font('Helvetica-Bold').text('Penyaluran Dana', colLabelsX, doc.y);
    doc.moveDown(0.3);
    drawRow('Penyaluran | Amil | Belanja Pegawai',          '5301', am.penyaluran?.belanja_pegawai,      oam.penyaluran?.belanja_pegawai,      false, 15);
    drawRow('Penyaluran | Amil | Belanja Kegiatan',         '5302', am.penyaluran?.belanja_kegiatan,     oam.penyaluran?.belanja_kegiatan,     false, 15);
    drawRow('Penyaluran | Amil | Belanja Perjalanan Dinas', '5303', am.penyaluran?.perjalanan_dinas,     oam.penyaluran?.perjalanan_dinas,     false, 15);
    drawRow('Penyaluran | Amil | Belanja Administrasi',     '5304', am.penyaluran?.belanja_administrasi, oam.penyaluran?.belanja_administrasi, false, 15);
    drawRow('Penyaluran | Amil | Beban Pengadaan',          '5305', am.penyaluran?.beban_pengadaan,      oam.penyaluran?.beban_pengadaan,      false, 15);
    drawRow('Penyaluran | Amil | Beban Penyusutan',         '5306', am.penyaluran?.beban_penyusutan,     oam.penyaluran?.beban_penyusutan,     false, 15);
    drawRow('Penyaluran | Amil | Belanja Jasa Pihak Ketiga','5307', am.penyaluran?.jasa_pihak_ketiga,   oam.penyaluran?.jasa_pihak_ketiga,   false, 15);
    drawRow('Penyaluran | Amil | Operasional UPZ',          '5308', am.penyaluran?.operasional_upz,      oam.penyaluran?.operasional_upz,      false, 15);
    drawRow('Penyaluran | Amil | Lainnya',                  '5399', am.penyaluran?.lainnya,              oam.penyaluran?.lainnya,              false, 15);
    doc.moveDown(0.3);
    drawRow('Jumlah Penyaluran', '', am.total_penyaluran, oam.total_penyaluran, true, 0, false, true);
    doc.moveDown(0.8);

    // --- Surplus, Saldo ---
    drawRow('Surplus (Defisit)', '', am.surplus, oam.surplus, true);
    doc.moveDown(0.5);
    drawRow('Saldo Dana Amil Awal Periode', '', am.saldo_awal, oam.saldo_awal, true);
    doc.moveDown(0.5);
    doc.fontSize(10);
    drawRow('Saldo Dana Amil Akhir Periode', '', am.saldo_akhir, oam.saldo_akhir, true, 0, true, false, true);

    drawFooter(3, 3);

    doc.end();
  } catch (error) {
    next(error);
  }
};

const getKasMasukHarian = async (req, res, next) => {
  try {
    const data = await laporanService.getKasMasukHarian(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export default {
  getArusKas,
  getNeraca,
  exportPenerimaan,
  exportDistribusi,
  exportArusKasPdf,
  exportNeracaPdf,
  exportRekapTahunanPdf,
  getDistribusiByProgram,
  getDistribusiByAsnaf,
  getDistribusiHarian,
  getPerubahanDana,
  exportPerubahanDanaPdf,
  getKasMasukHarian
};

