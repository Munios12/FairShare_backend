import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Expense = sequelize.define(
  "Expense",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    grupo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,  // ✅ CAMBIO: Permite NULL para gastos personales
      references: {
        model: "grupos",
        key: "id",
      },
    },
    pagador_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    cantidad_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    moneda: {
      type: DataTypes.STRING(10),
      defaultValue: "EUR",
    },
    fecha_gasto: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "gastos",
    timestamps: false,
  }
);

export default Expense;