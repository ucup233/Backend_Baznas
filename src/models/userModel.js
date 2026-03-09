import { Sequelize, DataTypes } from 'sequelize';
import db from '../config/database.js';

const User = db.define('users', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  nama: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  role: {
    type: DataTypes.ENUM('superadmin', 'pelayanan', 'pendistribusian', 'keuangan', 'penerimaan'),
    allowNull: false
  }
}, {
  freezeTableName: true
});

export default User;
