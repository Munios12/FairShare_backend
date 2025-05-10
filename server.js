require("dotenv").config();
const express = require("express");
const cors = require("cors");

const sequelize = require("./config/database");

//Rutas y middlewares
const app = express();
app.use(express.json());
app.use(cors());

// Sincronizar la base de datos con sequelize
sequelize.sync({ force: false }).then(() => {
  console.log("Base de datos conectada y sincronizada.");
});

//Levantar el servidor
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_HOST:", process.env.DB_HOST);
