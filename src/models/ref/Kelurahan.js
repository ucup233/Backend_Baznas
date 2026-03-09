import { DataTypes } from 'sequelize';
import db from '../../config/database.js';
import Kecamatan from './Kecamatan.js';

const Kelurahan = db.define('ref_kelurahan', {
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
  kecamatan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Kecamatan,
      key: 'id'
    }
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

Kecamatan.hasMany(Kelurahan, { foreignKey: 'kecamatan_id' });
Kelurahan.belongsTo(Kecamatan, { foreignKey: 'kecamatan_id' });

export default Kelurahan;
