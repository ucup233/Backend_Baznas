import { DataTypes } from 'sequelize';
import db from '../config/database.js';

const MigrationLog = db.define('migration_log', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  jenis: {
    type: DataTypes.ENUM('mustahiq', 'muzakki', 'penerimaan', 'distribusi'),
    allowNull: false
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  total_rows: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  success_rows: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  failed_rows: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  freezeTableName: true,
  timestamps: false // Karena kita mendefinisikan created_at secara manual di migration
});

export default MigrationLog;
