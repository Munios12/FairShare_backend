const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const GroupMember = require("./GroupMember");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_usuario: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
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
    tableName: "users",
    timestamps: false,
  }
);

User.hasMany(GroupMember, {
  foreignKey: "usuario_id",
  as: "groupMemberships",
});

GroupMember.belongsTo(User, {
  foreignKey: "usuario_id",
  as: "usuario",
});

module.exports = User;
