import mustahiqService from '../services/mustahiqService.js';
import exportToExcel from '../utils/excelHelper.js';

const getAll = async (req, res, next) => {
  try {
    const data = await mustahiqService.getAll(req.query);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await mustahiqService.getById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getRiwayat = async (req, res, next) => {
  try {
    const data = await mustahiqService.getRiwayat(req.params.id, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await mustahiqService.create(req.body, req.user.id);
    res.status(201).json({ success: true, data, message: 'Mustahiq berhasil didaftarkan.' });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await mustahiqService.update(req.params.id, req.body, req.user.id);
    res.status(200).json({ success: true, data, message: 'Mustahiq berhasil diperbarui.' });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const data = await mustahiqService.updateStatus(req.params.id, req.body.status, req.user.id);
    res.status(200).json({ success: true, data, message: `Status mustahiq diubah menjadi '${req.body.status}'.` });
  } catch (error) {
    next(error);
  }
};

const destroy = async (req, res, next) => {
  try {
    await mustahiqService.destroy(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Mustahiq berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

const exportExcel = async (req, res, next) => {
  try {
    const data = await mustahiqService.getExportData(req.query);

    await exportToExcel(res, {
      sheetName: 'Data Mustahiq',
      filename: 'mustahiq_export',
      columns: [
        { header: 'No Reg BPP', key: 'no_reg_bpp', width: 15 },
        { header: 'NRM', key: 'nrm', width: 15 },
        { header: 'NIK', key: 'nik', width: 20 },
        { header: 'Nama', key: 'nama', width: 30 },
        { header: 'No HP', key: 'no_hp', width: 15 },
        { header: 'Alamat', key: 'alamat', width: 30 },
        { header: 'Kelurahan', key: 'kelurahan.nama', width: 20 },
        { header: 'Kecamatan', key: 'kecamatan.nama', width: 20 },
        { header: 'Kategori', key: 'ref_kategori_mustahiq.nama', width: 12 },
        { header: 'Asnaf', key: 'ref_asnaf.nama', width: 15 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Total Penerimaan', key: 'total_penerimaan_count', width: 18 },
        { header: 'Total Amount', key: 'total_penerimaan_amount', width: 18 },
        { header: 'Keterangan', key: 'keterangan', width: 25 }
      ],
      ...data  // { rows, totalAvailable, exported, isTruncated }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAll,
  getById,
  getRiwayat,
  create,
  update,
  updateStatus,
  destroy,
  exportExcel
};
