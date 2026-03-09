import { DataTypes } from 'sequelize';
import db from '../../config/database.js';
import SubProgram from './SubProgram.js';

const ProgramKegiatan = db.define('ref_program_kegiatan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  sub_program_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: SubProgram,
      key: 'id'
    }
  },
  nama: {
    type: DataTypes.STRING(200),
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
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['sub_program_id', 'nama'],
      name: 'unique_program_kegiatan'
    }
  ]
});

SubProgram.hasMany(ProgramKegiatan, { foreignKey: 'sub_program_id' });
ProgramKegiatan.belongsTo(SubProgram, { foreignKey: 'sub_program_id' });

export default ProgramKegiatan;
