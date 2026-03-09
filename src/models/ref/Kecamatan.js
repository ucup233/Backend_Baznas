import { DataTypes } from 'sequelize';
import db from '../../config/database.js';

const Kecamatan = db.define('ref_kecamatan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nama: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
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

export default Kecamatan;
