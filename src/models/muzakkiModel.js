import { Sequelize, DataTypes } from 'sequelize';
import db from '../config/database.js';
import { registerAuditHooks } from '../utils/auditHooks.js';
import {
  Kecamatan,
  Kelurahan,
  JenisMuzakki,
  JenisUpz
} from './ref/index.js';
import User from './userModel.js';

const Muzakki = db.define('muzakki', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  npwz: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true
  },
  nama: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  nik: {
    type: DataTypes.STRING(16),
    allowNull: false,
    unique: true
  },
  no_hp: {
    type: DataTypes.STRING(14),
    allowNull: false
  },
  npwp: {
    type: DataTypes.STRING(20)
  },
  jenis_kelamin: {
    type: DataTypes.ENUM('Laki-laki', 'Perempuan')
  },
  jenis_muzakki_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: JenisMuzakki,
      key: 'id'
    }
  },
  jenis_upz_id: {
    type: DataTypes.INTEGER,
    references: {
      model: JenisUpz,
      key: 'id'
    }
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
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  total_setor_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_setor_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  last_setor_date: {
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
    { unique: true, fields: ['npwz'], name: 'npwz_unique' },
    { unique: true, fields: ['nik'], name: 'nik_unique' },
    { fields: ['nama'], name: 'nama_index' }
  ]
});

// Associations
Muzakki.belongsTo(JenisMuzakki, { foreignKey: 'jenis_muzakki_id' });
Muzakki.belongsTo(JenisUpz, { foreignKey: 'jenis_upz_id' });
Muzakki.belongsTo(Kecamatan, { foreignKey: 'kecamatan_id' });
Muzakki.belongsTo(Kelurahan, { foreignKey: 'kelurahan_id' });
Muzakki.belongsTo(User, { foreignKey: 'registered_by', as: 'registrator' });

registerAuditHooks(Muzakki, 'muzakki');

export default Muzakki;

