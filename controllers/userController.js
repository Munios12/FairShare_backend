import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";

const sanitizeUser = (userInstance) => {
  const { password_usuario, ...publicData } = userInstance.toJSON();
  return publicData;
};

// GET ALL USERS
export async function getAllUsers(req, res) {
  try {
    const usersList = await User.findAll();
    const safeUsers = usersList.map(sanitizeUser);

    res.status(200).json({
      status: "success",
      result: safeUsers.length,
      data: {
        users: safeUsers,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// GET USER BY EMAIL
export async function getUser(req, res) {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        status: "fail",
        message: "Debe proporcionar un email válido.",
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "Usuario no encontrado.",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// LOGIN
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Email y contraseña son obligatorios.",
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "Credenciales inválidas.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_usuario
    );

    if (!passwordMatches) {
      return res.status(401).json({
        status: "fail",
        message: "Credenciales inválidas.",
      });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      nombre: user.nombre_usuario,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: "12h",
    });

    res.status(200).json({
      status: "success",
      message: "Login exitoso",
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// REGISTER
export async function createUser(req, res) {
  try {
    const { nombre_usuario, email, password } = req.body;

    if (!nombre_usuario || !email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Nombre, email y contraseña son obligatorios.",
      });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        status: "fail",
        message: "El email ya está registrado.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      nombre_usuario,
      email,
      password_usuario: hashedPassword,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: sanitizeUser(newUser),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// GET PROFILE
export async function getProfile(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Token inválido.",
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "Usuario no encontrado.",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// UPDATE AVATAR
// UPDATE AVATAR
export async function updateAvatar(req, res) {
  try {
    console.log("🎨 updateAvatar llamado");
    console.log("👤 req.user:", req.user); // ✅ Debug
    console.log("📦 req.body:", req.body); // ✅ Debug
    
    const userId = req.user?.id;
    const { color_avatar } = req.body;

    if (!userId || !color_avatar) {
      return res.status(400).json({ message: "Faltan datos requeridos." });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    user.avatar_color = color_avatar;
    await user.save();

    res.status(200).json({
      status: "success",
      data: { user: sanitizeUser(user) },
    });
  } catch (err) {
    console.error("❌ Error en updateAvatar:", err.message); // ✅ Debug
    res.status(500).json({ message: "Error al actualizar el avatar", error: err.message });
  }
}

// UPDATE PROFILE
export async function updateProfile(req, res) {
  try {
    const userId = req.user?.id;
    const { nombre_usuario, email } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (nombre_usuario) user.nombre_usuario = nombre_usuario;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({
      status: "success",
      data: { user: sanitizeUser(user) },
    });
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar perfil", error: err.message });
  }
}

// UPDATE PASSWORD
export async function updatePassword(req, res) {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    console.log("🔑 updatePassword llamado para userId:", userId);

    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Se requiere la contraseña actual y la nueva contraseña" 
      });
    }

    // Validar longitud mínima de la nueva contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "La nueva contraseña debe tener al menos 6 caracteres" 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar contraseña actual
    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password_usuario
    );

    if (!passwordMatches) {
      return res.status(401).json({ 
        message: "La contraseña actual es incorrecta" 
      });
    }

    // Nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password_usuario = hashedPassword;
    await user.save();

    console.log("✅ Contraseña actualizada correctamente");

    res.status(200).json({
      status: "success",
      message: "Contraseña actualizada correctamente"
    });
  } catch (err) {
    console.error("❌ Error en updatePassword:", err.message);
    res.status(500).json({ 
      message: "Error al actualizar contraseña", 
      error: err.message 
    });
  }
}

// DELETE ACCOUNT
export async function deleteAccount(req, res) {
  try {
    const userId = req.user?.id;
    const { password } = req.body;

    console.log("🗑️ deleteAccount llamado para userId:", userId);

    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    if (!password) {
      return res.status(400).json({ 
        message: "Se requiere la contraseña para eliminar la cuenta" 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar contraseña
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_usuario
    );

    if (!passwordMatches) {
      return res.status(401).json({ 
        message: "La contraseña es incorrecta" 
      });
    }

    // Eliminar usuario 
    await user.destroy();

    console.log("✅ Usuario eliminado exitosamente");

    res.status(200).json({
      status: "success",
      message: "Cuenta eliminada correctamente"
    });
  } catch (err) {
    console.error("❌ Error en deleteAccount:", err.message);
    res.status(500).json({ 
      message: "Error al eliminar cuenta", 
      error: err.message 
    });
  }
}

// GET - DATOS DEL DASHBOARD
export async function getDashboardData(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Token inválido.",
      });
    }

    // Importar modelos necesarios
    const Group = (await import("../models/Group.js")).default;
    const GroupMember = (await import("../models/GroupMember.js")).default;
    const Expense = (await import("../models/Expense.js")).default;
    const ExpenseShared = (await import("../models/ExpenseShared.js")).default;

    //  Obtener grupos del usuario
    const memberships = await GroupMember.findAll({
      where: { usuario_id: userId },
      attributes: ["grupo_id"],
      raw: true,
    });

    const groupIds = memberships.length > 0 
      ? [...new Set(memberships.map((m) => m.grupo_id))]
      : [];

    //  Obtener información de grupos
    const groups = groupIds.length > 0
      ? await Group.findAll({
          where: { id: groupIds },
          order: [["ultima_actualizacion", "DESC"]],
        })
      : [];

    //  Obtener gastos donde el usuario es pagador
    const expensesPaid = groupIds.length > 0
      ? await Expense.findAll({
          where: { 
            pagador_id: userId,
            grupo_id: groupIds
          },
          raw: true,
        })
      : [];

    //  Calcular total gastado
    const totalGastado = expensesPaid.reduce(
      (sum, e) => sum + parseFloat(e.cantidad_total || 0),
      0
    );

    //  Calcular balance (simplificado)
    let totalTeDeben = 0;
    let totalDebes = 0;

    const balance = totalTeDeben - totalDebes;

    //  Obtener gastos recientes
    const recentExpenses = groupIds.length > 0
      ? await Expense.findAll({
          where: { grupo_id: groupIds },
          limit: 10,
          order: [["fecha_gasto", "DESC"]],
        })
      : [];

    //  Formatear grupos con último gasto
    const formattedGroups = await Promise.all(
      groups.map(async (group) => {
        const membersCount = await GroupMember.count({
          where: { grupo_id: group.id },
        });

        const lastExpense = await Expense.findOne({
          where: { grupo_id: group.id },
          order: [["fecha_gasto", "DESC"]],
        });

        return {
          id: group.id,
          nombre_grupo: group.nombre_grupo,
          members_count: membersCount,
          last_expense: lastExpense
            ? {
                descripcion: lastExpense.descripcion,
                cantidad: parseFloat(lastExpense.cantidad_total),
                moneda: lastExpense.moneda,
              }
            : null,
        };
      })
    );

    //  Formatear gastos recientes con pagador
    const formattedExpenses = await Promise.all(
      recentExpenses.map(async (expense) => {
        const pagador = await User.findByPk(expense.pagador_id, {
          attributes: ["id", "nombre_usuario", "avatar_color"],
        });

        return {
          id: expense.id,
          descripcion: expense.descripcion,
          cantidad_total: parseFloat(expense.cantidad_total),
          moneda: expense.moneda,
          fecha_gasto: expense.fecha_gasto,
          pagador: pagador ? {
            id: pagador.id,
            nombre_usuario: pagador.nombre_usuario,
            avatar_color: pagador.avatar_color,
          } : null,
        };
      })
    );

    res.status(200).json({
      status: "success",
      data: {
        total_gastado: parseFloat(totalGastado.toFixed(2)),
        grupos_activos: groups.length,
        balance: {
          te_deben: parseFloat(totalTeDeben.toFixed(2)),
          debes: parseFloat(totalDebes.toFixed(2)),
          neto: parseFloat(balance.toFixed(2)),
        },
        grupos: formattedGroups,
        gastos_recientes: formattedExpenses,
      },
    });
  } catch (error) {
    console.error("❌ Error en getDashboardData:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}