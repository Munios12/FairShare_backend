import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ExpenseShared = sequelize.define(
  "ExpenseShared",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    gasto_id: {  
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    usuario_id: {  
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidad: {  
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "gastos_compartidos",
    timestamps: false,
  }
);

export default ExpenseShared;