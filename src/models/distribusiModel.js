import { Sequelize, DataTypes } from 'sequelize';
import db from '../config/database.js';
import { registerAuditHooks } from '../utils/auditHooks.js';
import Mustahiq from './mustahiqModel.js';
import {
  Kecamatan,
  Kelurahan,
  Asnaf,
  NamaProgram,
  SubProgram,
  ProgramKegiatan,
  FrekuensiBantuan,
  NamaEntitas,
  KategoriMustahiq,
  Infak,
  JenisZisDistribusi
} from './ref/index.js';
import User from './userModel.js';

const Distribusi = db.define('distribusi', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  mustahiq_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Mustahiq,
      key: 'id'
    }
  },
  // Denormalized Data (Snapshot)
  nrm: { type: DataTypes.STRING(24) },
  nama_mustahik: { type: DataTypes.STRING(200) },
  nik: { type: DataTypes.STRING(20) },
  alamat: { type: DataTypes.TEXT },
  kelurahan_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Kelurahan,
      key: 'id'
    }
  },
  kecamatan_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Kecamatan,
      key: 'id'
    }
  },
  no_hp: { type: DataTypes.STRING(20) },
  asnaf_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Asnaf,
      key: 'id'
    }
  },

  tanggal: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  bulan: { type: DataTypes.STRING(20) },
  tahun: { type: DataTypes.INTEGER },

  nama_program_id: {
    type: DataTypes.INTEGER,
    references: {
      model: NamaProgram,
      key: 'id'
    }
  },
  sub_program_id: {
    type: DataTypes.INTEGER,
    references: {
      model: SubProgram,
      key: 'id'
    }
  },
  program_kegiatan_id: {
    type: DataTypes.INTEGER,
    references: {
      model: ProgramKegiatan,
      key: 'id'
    }
  },

  frekuensi_bantuan_id: {
    type: DataTypes.INTEGER,
    references: {
      model: FrekuensiBantuan,
      key: 'id'
    }
  },

  jumlah: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  quantity: { type: DataTypes.INTEGER },

  nama_entitas_id: {
    type: DataTypes.INTEGER,
    references: {
      model: NamaEntitas,
      key: 'id'
    }
  },
  kategori_mustahiq_id: {
    type: DataTypes.INTEGER,
    references: {
      model: KategoriMustahiq,
      key: 'id'
    }
  },

  infak_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Infak,
      key: 'id'
    }
  },
  jenis_zis_distribusi_id: {
    type: DataTypes.INTEGER,
    references: {
      model: JenisZisDistribusi,
      key: 'id'
    }
  },

  keterangan: { type: DataTypes.TEXT },
  rekomendasi_upz: { type: DataTypes.TEXT },

  // Kolom Permohonan & Survei
  tgl_masuk_permohonan: { type: DataTypes.DATEONLY },
  tgl_survei: { type: DataTypes.DATEONLY },
  surveyor: { type: DataTypes.STRING(100) },
  jumlah_permohonan: { type: DataTypes.DECIMAL(15, 2) },
  status: {
    type: DataTypes.ENUM('menunggu', 'diterima', 'ditolak'),
    allowNull: true,
    defaultValue: 'menunggu'
  },
  tgl_disetujui: { type: DataTypes.DATEONLY },
  no_reg_bpp: { type: DataTypes.STRING(12) },

  created_by: {
    type: DataTypes.INTEGER,
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
    { fields: ['mustahiq_id'] },
    { fields: ['nrm'] },
    { fields: ['nik'] },
    { fields: ['tanggal'] },
    { fields: ['nama_program_id'] },
    { fields: ['sub_program_id'] },
    { fields: ['program_kegiatan_id'] }
  ]
});

// Associations
Distribusi.belongsTo(Mustahiq, { foreignKey: 'mustahiq_id' });
Distribusi.belongsTo(Kecamatan, { foreignKey: 'kecamatan_id' });
Distribusi.belongsTo(Kelurahan, { foreignKey: 'kelurahan_id' });
Distribusi.belongsTo(Asnaf, { foreignKey: 'asnaf_id', as: 'asnaf' });
Distribusi.belongsTo(NamaProgram, { foreignKey: 'nama_program_id' });
Distribusi.belongsTo(SubProgram, { foreignKey: 'sub_program_id' });
Distribusi.belongsTo(ProgramKegiatan, { foreignKey: 'program_kegiatan_id' });
Distribusi.belongsTo(FrekuensiBantuan, { foreignKey: 'frekuensi_bantuan_id' });
Distribusi.belongsTo(NamaEntitas, { foreignKey: 'nama_entitas_id' });
Distribusi.belongsTo(KategoriMustahiq, { foreignKey: 'kategori_mustahiq_id' });
Distribusi.belongsTo(Infak, { foreignKey: 'infak_id', as: 'infak' });
Distribusi.belongsTo(JenisZisDistribusi, { foreignKey: 'jenis_zis_distribusi_id' });
Distribusi.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

registerAuditHooks(Distribusi, 'distribusi');

export default Distribusi;

