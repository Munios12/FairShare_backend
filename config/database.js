require("dotenv").config();
const { Sequelize } = require("sequelize");

const DB_NAME = process.env.DB_NAME || "fairshareDB";
const DB_USER = process.env.DB_USER || "root";
const DB_PASS = process.env.DB_PASS ?? "";
const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT ?? 3307);
const DIALECT = process.env.DB_DIALECT || "mysql";

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DIALECT,
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
  },
  timezone: "+00:00",
});

module.exports = sequelize;
