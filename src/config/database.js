import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Mendukung koneksi via URL tunggal atau variabel terpisah (Fallback untuk Railway)
const dbUrl = process.env.DB_URL || process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_URL;

const db = dbUrl
  ? new Sequelize(dbUrl, {
    dialect: 'mysql',
    dialectOptions: { multipleStatements: true },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  })
  : new Sequelize(
    process.env.DB_NAME || process.env.MYSQLDATABASE,
    process.env.DB_USER || process.env.MYSQLUSER,
    process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
    {
      host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
      port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
      dialect: 'mysql',
      dialectOptions: {
        multipleStatements: true
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000
      }
    }
  );

export default db;
