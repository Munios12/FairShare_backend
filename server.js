import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

console.log("🔐 JWT_SECRET desde server.js:", process.env.JWT_SECRET); 

import sequelize from "./config/database.js";
import initializeAssociations from "./models/associations.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";  

const app = express();

app.use(cors());
app.use(express.json());

// Rutas base 
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);  

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("DB conectada correctamente");

    await sequelize.sync();
    console.log("Modelos sincronizados");

    initializeAssociations();

    app.listen(PORT, () =>
      console.log(`🚀 Servidor en http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("ERROR INICIANDO SERVIDOR:", err);
  }
}

start();