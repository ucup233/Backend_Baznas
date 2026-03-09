import { DataTypes } from 'sequelize';
import db from '../../config/database.js';

const Zis = db.define('ref_zis', {
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

const JenisZis = db.define('ref_jenis_zis', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  zis_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Zis,
      key: 'id'
    }
  },
  nama: {
    type: DataTypes.STRING(100),
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

Zis.hasMany(JenisZis, { foreignKey: 'zis_id', as: 'jenis_zis' });
JenisZis.belongsTo(Zis, { foreignKey: 'zis_id', as: 'zis' });

export { Zis, JenisZis };
