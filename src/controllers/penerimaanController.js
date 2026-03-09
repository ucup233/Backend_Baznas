import penerimaanService from '../services/penerimaanService.js';
import PDFDocument from 'pdfkit';
import Penerimaan from '../models/penerimaanModel.js';
import { Op } from 'sequelize';

const getAll = async (req, res, next) => {
  try {
    const data = await penerimaanService.getAll(req.query);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await penerimaanService.getById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await penerimaanService.create(req.body, req.user.id);
    res.status(201).json({ success: true, data, message: 'Penerimaan berhasil dicatat.' });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await penerimaanService.update(req.params.id, req.body);
    res.status(200).json({ success: true, data, message: 'Penerimaan berhasil diperbarui.' });
  } catch (error) {
    next(error);
  }
};

const destroy = async (req, res, next) => {
  try {
    await penerimaanService.destroy(req.params.id);
    res.status(200).json({ success: true, message: 'Penerimaan berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

const rekapHarian = async (req, res, next) => {
  try {
    const data = await penerimaanService.rekapHarian(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const rekapBulanan = async (req, res, next) => {
  try {
    const data = await penerimaanService.rekapBulanan(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const rekapTahunan = async (req, res, next) => {
  try {
    const data = await penerimaanService.rekapTahunan(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const cetakBuktiSetor = async (req, res, next) => {
  try {
    const penerimaan = await penerimaanService.getById(req.params.id);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `bukti_setor_${penerimaan.id}_${timestamp}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // --- Header ---
    doc.fontSize(16).font('Helvetica-Bold')
      .text('BAZNAS KOTA BATAM', { align: 'center' });
    doc.fontSize(10).font('Helvetica')
      .text('Badan Amil Zakat Nasional Kota Batam', { align: 'center' });
    doc.moveDown(0.5);

    // Garis pembatas
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(14).font('Helvetica-Bold')
      .text('BUKTI SETOR / PENERIMAAN', { align: 'center' });
    doc.moveDown(1);

    // --- Detail Muzakki ---
    doc.fontSize(11).font('Helvetica-Bold').text('Data Muzakki');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');

    const leftCol = 50;
    const rightCol = 200;
    let y = doc.y;

    const addRow = (label, value) => {
      doc.text(label, leftCol, y, { width: 145 });
      doc.text(`: ${value || '-'}`, rightCol, y);
      y += 18;
    };

    addRow('NPWZ', penerimaan.npwz);
    addRow('Nama', penerimaan.nama_muzakki);
    addRow('NIK', penerimaan.nik_muzakki);
    addRow('No HP', penerimaan.no_hp_muzakki);
    addRow('Jenis Muzakki', penerimaan.ref_jenis_muzakki?.nama);
    addRow('Jenis UPZ', penerimaan.ref_jenis_upz?.nama);

    doc.y = y;
    doc.moveDown(0.5);

    // Garis pembatas
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // --- Detail Transaksi ---
    doc.fontSize(11).font('Helvetica-Bold').text('Detail Transaksi');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    y = doc.y;

    addRow('No. Transaksi', `PNR-${String(penerimaan.id).padStart(6, '0')}`);
    addRow('Tanggal', penerimaan.tanggal);
    addRow('Via', penerimaan.ref_via_penerimaan?.nama);
    addRow('Metode Bayar', penerimaan.ref_metode_bayar?.nama);
    addRow('No Rekening', penerimaan.no_rekening);
    addRow('ZIS', penerimaan.ref_zi?.nama);
    addRow('Jenis ZIS', penerimaan.ref_jenis_zi?.nama);

    doc.y = y;
    doc.moveDown(0.5);

    // Garis pembatas
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // --- Rincian Dana ---
    doc.fontSize(11).font('Helvetica-Bold').text('Rincian Dana');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    y = doc.y;

    const formatCurrency = (val) => {
      const num = parseFloat(val) || 0;
      return `Rp ${num.toLocaleString('id-ID', { minimumFractionDigits: 2 })}`;
    };

    addRow('Jumlah', formatCurrency(penerimaan.jumlah));
    addRow('Persentase Amil', penerimaan.ref_persentase_amil?.label);
    addRow('Dana Amil', formatCurrency(penerimaan.dana_amil));
    addRow('Dana Bersih', formatCurrency(penerimaan.dana_bersih));

    doc.y = y;
    doc.moveDown(0.5);

    if (penerimaan.keterangan) {
      addRow('Keterangan', penerimaan.keterangan);
      doc.y = y;
    }

    doc.moveDown(2);

    // Garis pembatas
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // --- Tanda tangan ---
    const signY = doc.y;
    doc.text('Petugas,', leftCol, signY);
    doc.text('Muzakki,', 400, signY);

    doc.text('(_______________)', leftCol, signY + 60);
    doc.text('(_______________)', 400, signY + 60);

    // Footer
    doc.fontSize(8).font('Helvetica')
      .text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 50, 760, { align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
};

const dailySeq = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await Penerimaan.findByPk(id, { attributes: ['id', 'tanggal'] });
    if (!record) return res.status(404).json({ success: false, message: 'Tidak ditemukan.' });
    const tanggal = String(record.tanggal).slice(0, 10); // YYYY-MM-DD
    const count = await Penerimaan.count({
      where: {
        tanggal: { [Op.like]: `${tanggal}%` },
        id: { [Op.lte]: record.id }
      }
    });
    res.json({ success: true, seq: count });
  } catch (error) {
    next(error);
  }
};

export default {
  getAll,
  getById,
  create,
  update,
  destroy,
  rekapHarian,
  rekapBulanan,
  rekapTahunan,
  cetakBuktiSetor,
  dailySeq
};
