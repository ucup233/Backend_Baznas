import { Sequelize, DataTypes } from 'sequelize';
import db from '../config/database.js';
import { registerAuditHooks } from '../utils/auditHooks.js';
import {
  Kecamatan,
  Kelurahan,
  Asnaf,
  KategoriMustahiq
} from './ref/index.js';
import User from './userModel.js';

const Mustahiq = db.define('mustahiq', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nrm: {
    type: DataTypes.STRING(24),
    allowNull: false,
    unique: true
  },
  nik: {
    type: DataTypes.STRING(16),
    allowNull: false,
    unique: true
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  no_hp: {
    type: DataTypes.STRING(14),
    allowNull: false
  },
  jenis_kelamin: {
    type: DataTypes.ENUM('Laki-laki', 'Perempuan')
  },
  alamat: {
    type: DataTypes.TEXT
  },
  kelurahan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Kelurahan,
      key: 'id'
    }
  },
  kecamatan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Kecamatan,
      key: 'id'
    }
  },
  kategori_mustahiq_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: KategoriMustahiq,
      key: 'id'
    }
  },
  asnaf_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Asnaf,
      key: 'id'
    }
  },
  rekomendasi_upz: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'blacklist'),
    defaultValue: 'active'
  },
  total_penerimaan_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_penerimaan_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  last_received_date: {
    type: DataTypes.DATEONLY
  },
  keterangan: {
    type: DataTypes.TEXT
  },
  registered_date: {
    type: DataTypes.DATEONLY
  },
  tgl_lahir: {
    type: DataTypes.DATEONLY
  },
  registered_by: {
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
    { unique: true, fields: ['nrm'], name: 'nrm_unique' },
    { unique: true, fields: ['nik'], name: 'nik_unique' }
  ]
});

// Associations
Mustahiq.belongsTo(Kecamatan, { foreignKey: 'kecamatan_id' });
Mustahiq.belongsTo(Kelurahan, { foreignKey: 'kelurahan_id' });
Mustahiq.belongsTo(Asnaf, { foreignKey: 'asnaf_id' });
Mustahiq.belongsTo(KategoriMustahiq, { foreignKey: 'kategori_mustahiq_id' });
Mustahiq.belongsTo(User, { foreignKey: 'registered_by', as: 'registrator' });

registerAuditHooks(Mustahiq, 'mustahiq');

export default Mustahiq;

