import User from "./User.js";
import Group from "./Group.js";
import GroupMember from "./GroupMember.js";
import Expense from "./Expense.js";
import ExpenseShared from "./ExpenseShared.js";

// Variable para controlar si ya se inicializaron
let associationsInitialized = false;

export function initializeAssociations() {
  // Si ya se inicializaron, no hacer nada
  if (associationsInitialized) {
    console.log("⚠️ Asociaciones ya inicializadas, omitiendo...");
    return;
  }

  console.log("🔗 Inicializando asociaciones de modelos...");

  // USER <-> GROUP_MEMBER
  User.hasMany(GroupMember, { foreignKey: "usuario_id", as: "memberships" });
  GroupMember.belongsTo(User, { foreignKey: "usuario_id", as: "usuario" });

  // GROUP <-> GROUP_MEMBER
  Group.hasMany(GroupMember, { foreignKey: "grupo_id", as: "miembros" });
  GroupMember.belongsTo(Group, { foreignKey: "grupo_id", as: "grupo" });

  // USER <-> GROUP (creador)
  Group.belongsTo(User, { foreignKey: "usuario_id", as: "creador" });
  User.hasMany(Group, { foreignKey: "usuario_id", as: "grupos_creados" });

  // EXPENSE <-> USER (pagador)
  Expense.belongsTo(User, { foreignKey: "pagador_id", as: "pagador" });
  User.hasMany(Expense, { foreignKey: "pagador_id", as: "gastos_pagados" });

  // EXPENSE <-> GROUP
  Expense.belongsTo(Group, { foreignKey: "grupo_id", as: "grupo" });
  Group.hasMany(Expense, { foreignKey: "grupo_id", as: "gastos" });

  // EXPENSE <-> EXPENSE_SHARED
  Expense.hasMany(ExpenseShared, { foreignKey: "gasto_id", as: "compartidos" });
  ExpenseShared.belongsTo(Expense, { foreignKey: "gasto_id", as: "gasto" });

  // EXPENSE_SHARED <-> USER
  ExpenseShared.belongsTo(User, { foreignKey: "usuario_id", as: "usuario" });
  User.hasMany(ExpenseShared, { foreignKey: "usuario_id", as: "gastos_compartidos" });

  associationsInitialized = true;
  console.log("✅ Asociaciones inicializadas correctamente");
}

export default initializeAssociations;