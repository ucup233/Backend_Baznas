import { DataTypes } from 'sequelize';
import db from '../../config/database.js';

const NamaProgram = db.define('ref_nama_program', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  deskripsi: {
    type: DataTypes.TEXT
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  freezeTableName: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default NamaProgram;
