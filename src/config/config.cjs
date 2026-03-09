require('dotenv').config();

const config = {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "12345678",
    database: process.env.DB_NAME || "baznas_batam",
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    dialectOptions: {
        multipleStatements: true
    }
};

if (process.env.DB_URL || process.env.MYSQL_PUBLIC_URL) {
    config.use_env_variable = process.env.DB_URL ? "DB_URL" : "MYSQL_PUBLIC_URL";
}

module.exports = {
    development: config,
    test: config,
    production: config
};
