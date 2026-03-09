import { DataTypes } from 'sequelize';
import db from '../../config/database.js';
import NamaProgram from './NamaProgram.js';

const SubProgram = db.define('ref_sub_program', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nama_program_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: NamaProgram,
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
      fields: ['nama_program_id', 'nama'],
      name: 'unique_sub_program'
    }
  ]
});

NamaProgram.hasMany(SubProgram, { foreignKey: 'nama_program_id' });
SubProgram.belongsTo(NamaProgram, { foreignKey: 'nama_program_id' });

export default SubProgram;
