const { sequelize } = require("./config/database");
const { DataTypes } = require("sequelize");

const Usuario = sequelize.define(
  "users",
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_usuario: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password_usuario: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fecha_alta: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
  }
);

async function insertar() {
  try {
    await sequelize.authenticate();
    console.log("🔌 Conexión OK.");

    const nuevo = await Usuario.create({
      nombre_usuario: "prueba_backend",
      password_usuario: "123456",
    });

    console.log("✅ Usuario insertado:", nuevo.toJSON());
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

insertar();
