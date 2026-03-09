import muzakkiService from '../services/muzakkiService.js';
import exportToExcel from '../utils/excelHelper.js';

const getAll = async (req, res, next) => {
  try {
    const data = await muzakkiService.getAll(req.query);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await muzakkiService.getById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getRiwayat = async (req, res, next) => {
  try {
    const data = await muzakkiService.getRiwayat(req.params.id, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await muzakkiService.create(req.body, req.user.id);
    res.status(201).json({ success: true, data, message: 'Muzakki berhasil didaftarkan.' });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await muzakkiService.update(req.params.id, req.body, req.user.id);
    res.status(200).json({ success: true, data, message: 'Muzakki berhasil diperbarui.' });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const data = await muzakkiService.updateStatus(req.params.id, req.body.status, req.user.id);
    res.status(200).json({ success: true, data, message: `Status muzakki diubah menjadi '${req.body.status}'.` });
  } catch (error) {
    next(error);
  }
};

const destroy = async (req, res, next) => {
  try {
    await muzakkiService.destroy(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Muzakki berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

const exportExcel = async (req, res, next) => {
  try {
    const data = await muzakkiService.getExportData(req.query);

    await exportToExcel(res, {
      sheetName: 'Data Muzakki',
      filename: 'muzakki_export',
      columns: [
        { header: 'NPWZ', key: 'npwz', width: 18 },
        { header: 'Nama', key: 'nama', width: 30 },
        { header: 'NIK', key: 'nik', width: 20 },
        { header: 'No HP', key: 'no_hp', width: 15 },
        { header: 'Jenis Muzakki', key: 'ref_jenis_muzakki.nama', width: 15 },
        { header: 'Jenis UPZ', key: 'ref_jenis_upz.nama', width: 25 },
        { header: 'Alamat', key: 'alamat', width: 30 },
        { header: 'Kelurahan', key: 'kelurahan.nama', width: 20 },
        { header: 'Kecamatan', key: 'kecamatan.nama', width: 20 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Total Setor', key: 'total_setor_count', width: 12 },
        { header: 'Total Amount', key: 'total_setor_amount', width: 18 },
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
