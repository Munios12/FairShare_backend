const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const GroupMember = require("./GroupMember");

const Group = sequelize.define(
  "Group",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_grupo: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ultima_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "grupos",
    timestamps: false,
    hooks: {
      beforeUpdate: (group) => {
        group.ultima_actualizacion = new Date();
      },
    },
  }
);

Group.hasMany(GroupMember, {
  foreignKey: "grupo_id",
  as: "miembros",
});

GroupMember.belongsTo(Group, {
  foreignKey: "grupo_id",
  as: "grupo",
});

module.exports = Group;
