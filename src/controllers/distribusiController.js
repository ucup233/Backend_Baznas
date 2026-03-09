import distribusiService from '../services/distribusiService.js';
import PDFDocument from 'pdfkit';
import Distribusi from '../models/distribusiModel.js';
import { Op } from 'sequelize';

const getAll = async (req, res, next) => {
  try {
    const data = await distribusiService.getAll(req.query);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await distribusiService.getById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await distribusiService.create(req.body, req.user.id);
    res.status(201).json({ success: true, data, message: 'Data distribusi berhasil disimpan.' });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await distribusiService.update(req.params.id, req.body, req.user.id);
    res.status(200).json({ success: true, data, message: 'Data distribusi berhasil diperbarui.' });
  } catch (error) {
    next(error);
  }
};

const destroy = async (req, res, next) => {
  try {
    await distribusiService.destroy(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Data distribusi berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

const rekapHarian = async (req, res, next) => {
  try {
    const data = await distribusiService.rekapHarian(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const rekapBulanan = async (req, res, next) => {
  try {
    const data = await distribusiService.rekapBulanan(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const rekapTahunan = async (req, res, next) => {
  try {
    const data = await distribusiService.rekapTahunan(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const cetakBuktiPenyaluran = async (req, res, next) => {
  try {
    const distribusi = await distribusiService.getById(req.params.id);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `bukti_penyaluran_${distribusi.id}_${timestamp}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // --- Header ---
    doc.fontSize(16).font('Helvetica-Bold')
      .text('BAZNAS KOTA BATAM', { align: 'center' });
    doc.fontSize(10).font('Helvetica')
      .text('Badan Amil Zakat Nasional Kota Batam', { align: 'center' });
    doc.moveDown(0.5);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(14).font('Helvetica-Bold')
      .text('BUKTI PENYALURAN / DISTRIBUSI', { align: 'center' });
    doc.moveDown(1);

    // --- Detail Mustahiq ---
    doc.fontSize(11).font('Helvetica-Bold').text('Data Mustahiq');
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

    addRow('No Reg BPP', distribusi.no_reg_bpp);
    addRow('NRM', distribusi.nrm);
    addRow('NIK', distribusi.nik);
    addRow('Nama', distribusi.nama_mustahik);
    addRow('No HP', distribusi.no_hp);
    addRow('Alamat', distribusi.alamat);
    addRow('Kelurahan', distribusi.ref_kelurahan?.nama);
    addRow('Kecamatan', distribusi.ref_kecamatan?.nama);
    addRow('Asnaf', distribusi.ref_asnaf?.nama);

    doc.y = y;
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // --- Detail Program ---
    doc.fontSize(11).font('Helvetica-Bold').text('Detail Penyaluran');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    y = doc.y;

    addRow('No. Distribusi', `DST-${String(distribusi.id).padStart(6, '0')}`);
    addRow('Tanggal', distribusi.tanggal);
    addRow('Program', distribusi.ref_nama_program?.nama);
    addRow('Kegiatan', distribusi.ref_program_kegiatan?.nama);
    addRow('Sub Program', distribusi.ref_sub_program?.nama);
    addRow('Frekuensi', distribusi.ref_frekuensi_bantuan?.nama);

    doc.y = y;
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // --- Rincian Dana ---
    doc.fontSize(11).font('Helvetica-Bold').text('Rincian Bantuan');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    y = doc.y;

    const formatCurrency = (val) => {
      const num = parseFloat(val) || 0;
      return `Rp ${num.toLocaleString('id-ID', { minimumFractionDigits: 2 })}`;
    };

    addRow('Jumlah', formatCurrency(distribusi.jumlah));
    addRow('Quantity', distribusi.quantity);
    addRow('Nama Entitas', distribusi.ref_nama_entitas?.nama);
    addRow('No Rekening', distribusi.no_rekening);
    addRow('Jenis ZIS', distribusi.ref_jenis_zis_distribusi?.nama);

    doc.y = y;
    if (distribusi.keterangan) {
      addRow('Keterangan', distribusi.keterangan);
      doc.y = y;
    }

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // --- Tanda tangan ---
    const signY = doc.y;
    doc.text('Petugas,', leftCol, signY);
    doc.text('Penerima / Mustahiq,', 400, signY);

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

const getStats = async (req, res, next) => {
  try {
    const data = await distribusiService.getStats(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const dailySeq = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await Distribusi.findByPk(id, { attributes: ['id', 'tanggal'] });
    if (!record) return res.status(404).json({ success: false, message: 'Tidak ditemukan.' });
    const tanggal = String(record.tanggal).slice(0, 10);
    const count = await Distribusi.count({
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
  cetakBuktiPenyaluran,
  getStats,
  dailySeq
};
