require('dotenv').config();

module.exports = {
    development: {
        username: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "12345678",
        database: process.env.DB_NAME || "baznas_batam",
        host: process.env.DB_HOST || "127.0.0.1",
        port: process.env.DB_PORT || 3306,
        dialect: "mysql",
        dialectOptions: {
            multipleStatements: true
        }
    },
    production: {
        use_env_variable: "DB_URL",
        dialect: "mysql",
        dialectOptions: {
            multipleStatements: true
        }
    }
};
