import { DataTypes } from 'sequelize';
import db from '../../config/database.js';

const defineSimpleModel = (tableName) => {
  return db.define(tableName, {
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
};

export const KategoriMustahiq = defineSimpleModel('ref_kategori_mustahiq');
export const NamaEntitas = defineSimpleModel('ref_nama_entitas');
export const ViaPenerimaan = defineSimpleModel('ref_via_penerimaan');
export const JenisZisDistribusi = defineSimpleModel('ref_jenis_zis_distribusi');
export const JenisMuzakki = defineSimpleModel('ref_jenis_muzakki');
export const JenisUpz = defineSimpleModel('ref_jenis_upz');
export const FrekuensiBantuan = defineSimpleModel('ref_frekuensi_bantuan');
export const Infak = defineSimpleModel('ref_infak');

export const PersentaseAmil = db.define('ref_persentase_amil', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  label: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  nilai: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false
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

export const MetodeBayar = db.define('ref_metode_bayar', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nama: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  via_penerimaan_id: {
    type: DataTypes.INTEGER,
    references: {
      model: ViaPenerimaan,
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
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['via_penerimaan_id', 'nama']
    }
  ]
});

ViaPenerimaan.hasMany(MetodeBayar, { foreignKey: 'via_penerimaan_id' });
MetodeBayar.belongsTo(ViaPenerimaan, { foreignKey: 'via_penerimaan_id' });
