// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

//Routes
const usersRoutes = require("./routes/usersRoutes");
const groupRoutes = require("./routes/groupRoutes");

const { sequelize, testConnection } = require("./config/database");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/users", usersRoutes); // *********** Rutas de usuarios
app.use("/api/groups", groupRoutes); // *********** Rutas de grupos

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    // Probar conexión (reintenta 2 veces si hace falta)
    await testConnection({ retries: 2 });

    // Sincronizar modelos (en dev). En producción usa migraciones.
    await sequelize.sync();
    console.log("✅ Base de datos conectada y sincronizada.");

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error inicializando la aplicación:", err.message || err);
    process.exit(1);
  }
}

start();
