const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const GroupMember = sequelize.define(
  "GroupMember",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    grupo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "member",
    },
    fecha_anadido: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "fecha_añadido",
    },
  },
  {
    tableName: "miembros_grupo",
    timestamps: false,
  }
);

module.exports = GroupMember;
