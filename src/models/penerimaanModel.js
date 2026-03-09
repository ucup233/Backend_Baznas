import { Sequelize, DataTypes } from 'sequelize';
import db from '../config/database.js';
import { registerAuditHooks } from '../utils/auditHooks.js';
import Muzakki from './muzakkiModel.js';
import {
  JenisMuzakki,
  JenisUpz,
  ViaPenerimaan,
  MetodeBayar,
  Zis,
  JenisZis,
  PersentaseAmil
} from './ref/index.js';
import User from './userModel.js';

const Penerimaan = db.define('penerimaan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  muzakki_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Muzakki,
      key: 'id'
    }
  },
  // Denormalized Data (Snapshot)
  npwz: { type: DataTypes.STRING(20) },
  nama_muzakki: { type: DataTypes.STRING(150) },
  nik_muzakki: { type: DataTypes.STRING(20) },
  no_hp_muzakki: { type: DataTypes.STRING(14) },
  jenis_muzakki_id: { type: DataTypes.INTEGER },
  jenis_upz_id: { type: DataTypes.INTEGER },

  tanggal: { type: DataTypes.DATEONLY, allowNull: false },
  bulan: { type: DataTypes.STRING(20) },
  tahun: { type: DataTypes.INTEGER },

  via_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ViaPenerimaan,
      key: 'id'
    }
  },

  metode_bayar_id: {
    type: DataTypes.INTEGER,
    references: {
      model: MetodeBayar,
      key: 'id'
    }
  },
  no_rekening: { type: DataTypes.STRING(50) },

  zis_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Zis,
      key: 'id'
    }
  },

  jenis_zis_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: JenisZis,
      key: 'id'
    }
  },

  jumlah: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  dana_amil: { type: DataTypes.DECIMAL(15, 2) },
  dana_bersih: { type: DataTypes.DECIMAL(15, 2) },

  keterangan: { type: DataTypes.TEXT },

  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }

}, {
  freezeTableName: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['muzakki_id'] },
    { fields: ['npwz'] },
    { fields: ['tanggal'] },
    { fields: ['jenis_zis_id'] },
    { fields: ['via_id'] }
  ]
});

// Associations
Penerimaan.belongsTo(Muzakki, { foreignKey: 'muzakki_id' });
Penerimaan.belongsTo(JenisMuzakki, { foreignKey: 'jenis_muzakki_id', as: 'jenis_muzakki' });
Penerimaan.belongsTo(JenisUpz, { foreignKey: 'jenis_upz_id', as: 'jenis_upz' });
Penerimaan.belongsTo(ViaPenerimaan, { foreignKey: 'via_id', as: 'via' });
Penerimaan.belongsTo(MetodeBayar, { foreignKey: 'metode_bayar_id', as: 'metode_bayar' });
Penerimaan.belongsTo(Zis, { foreignKey: 'zis_id', as: 'zis' });
Penerimaan.belongsTo(JenisZis, { foreignKey: 'jenis_zis_id', as: 'jenis_zis' });
Penerimaan.belongsTo(PersentaseAmil, { foreignKey: 'persentase_amil_id', as: 'persentase_amil' });
Penerimaan.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

registerAuditHooks(Penerimaan, 'penerimaan');

export default Penerimaan;

