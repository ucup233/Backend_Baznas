import AuditLog from '../models/auditLogModel.js';
import db from '../config/database.js';

const logAction = async (userId, table, action, oldData, newData, ipAddress) => {
  try {
    await AuditLog.create({
      user_id: userId,
      tabel: table,
      aksi: action,
      data_lama: oldData,
      data_baru: newData,
      ip_address: ipAddress
    });
  } catch (error) {
    console.error('Failed to save audit log:', error);
  }
};

const getLogs = async (query) => {
  const where = {};
  if (query.user_id) where.user_id = query.user_id;
  if (query.tabel) where.tabel = query.tabel;
  if (query.aksi) where.aksi = query.aksi;
  if (query.tanggal) {
    where.created_at = {
      [db.Sequelize.Op.gte]: new Date(query.tanggal),
      [db.Sequelize.Op.lt]: new Date(new Date(query.tanggal).getTime() + 24 * 60 * 60 * 1000)
    };
  }

  const limit = parseInt(query.limit) || 20;
  const offset = (parseInt(query.page) - 1) * limit || 0;

  return await AuditLog.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });
};

export default {
  logAction,
  getLogs
};
