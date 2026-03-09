import { Sequelize, DataTypes } from 'sequelize';
import db from '../config/database.js';

const AuditLog = db.define('audit_log', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tabel: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  aksi: {
    type: DataTypes.ENUM('INSERT', 'UPDATE', 'DELETE'),
    allowNull: false
  },
  data_lama: {
    type: DataTypes.JSON,
    allowNull: true
  },
  data_baru: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  freezeTableName: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
      { fields: ['user_id'] },
      { fields: ['tabel'] },
      { fields: ['aksi'] },
      { fields: ['created_at'] }
  ]
});

export default AuditLog;
