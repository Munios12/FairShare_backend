// config/database.js
require("dotenv").config();
const { Sequelize } = require("sequelize");

const DB_NAME = process.env.DB_NAME || "fairshareDB";
const DB_USER = process.env.DB_USER || "root";
const DB_PASS = process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "";
const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT ?? 3307);
const DIALECT = process.env.DB_DIALECT || "mysql";

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DIALECT,
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true,
    timestamps: true,
  },
  timezone: "+00:00",
});

async function testConnection({ retries = 0 } = {}) {
  try {
    await sequelize.authenticate();
    console.log(
      `✅ Conexión DB OK — ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`
    );
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    console.error("❌ Error conectando a la base de datos:", msg);
    console.error("--- Datos de conexión (para depuración) ---");
    console.error("DB_HOST:", DB_HOST);
    console.error("DB_PORT:", DB_PORT);
    console.error("DB_USER:", DB_USER);
    console.error("DB_NAME:", DB_NAME);
    console.error("DB_PASS set?:", DB_PASS ? "yes" : "no");
    console.error("DIALECT:", DIALECT);
    console.error("------------------------------------------");

    if (retries > 0) {
      console.log(
        `Reintentando conexión en 1s (${retries - 1} reintentos restantes)...`
      );
      await new Promise((r) => setTimeout(r, 1000));
      return testConnection({ retries: retries - 1 });
    }

    throw err;
  }
}

module.exports = { sequelize, testConnection };
