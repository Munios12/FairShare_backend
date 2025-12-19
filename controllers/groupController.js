import { Op } from "sequelize";
import Group from "../models/Group.js";
import GroupMember from "../models/GroupMember.js";
import User from "../models/User.js";

// GET - TODOS LOS GRUPOS DEL USUARIO
export async function getAllGroupsByUser(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Token inválido.",
      });
    }

    // Obtener los IDs de grupos donde participa el usuario
    const memberships = await GroupMember.findAll({
      where: { usuario_id: userId },
      attributes: ["grupo_id"],
      raw: true,
    });

    if (!memberships.length) {
      return res.status(200).json({
        status: "success",
        result: 0,
        data: {
          groups: [],
        },
      });
    }

    const groupIds = [...new Set(memberships.map((m) => m.grupo_id))];

    // Obtener los grupos con información de miembros
    const groups = await Group.findAll({
      where: {
        id: groupIds,
      },
      include: [
        {
          model: GroupMember,
          as: "miembros",
          include: [
            {
              model: User,
              as: "usuario",
              attributes: ["id", "nombre_usuario", "email", "avatar_color"],
            },
          ],
        },
      ],
      order: [["ultima_actualizacion", "DESC"]],
    });

    // Formatear la respuesta
    const formattedGroups = groups.map((group) => {
      const groupData = group.toJSON();
      return {
        ...groupData,
        miembros: groupData.miembros?.map((m) => ({
          id: m.id,
          usuario_id: m.usuario_id,
          nombre_usuario: m.usuario?.nombre_usuario,
          email: m.usuario?.email,
          avatar_color: m.usuario?.avatar_color,
          role: m.role,
          fecha_anadido: m.fecha_anadido,
        })),
      };
    });

    res.status(200).json({
      status: "success",
      result: formattedGroups.length,
      data: {
        groups: formattedGroups,
      },
    });
  } catch (error) {
    console.error("❌ Error en getAllGroupsByUser:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// POST - CREAR NUEVO GRUPO
export async function createGroup(req, res) {
  try {
    const userId = req.user?.id;
    const { nombre_grupo } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Token inválido.",
      });
    }

    if (!nombre_grupo || !nombre_grupo.trim()) {
      return res.status(400).json({
        status: "fail",
        message: "El nombre del grupo es obligatorio.",
      });
    }

    const group = await Group.create({
      nombre_grupo: nombre_grupo.trim(),
      usuario_id: userId,
    });

    await GroupMember.create({
      grupo_id: group.id,
      usuario_id: userId,
      role: "admin",
    });

    console.log("✅ Grupo creado exitosamente:", group.id);

    res.status(201).json({
      status: "success",
      data: {
        group,
      },
    });
  } catch (error) {
    console.error("❌ Error en createGroup:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// GET - DETALLE DEL GRUPO POR ID
export async function getGroupByID(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Token inválido.",
      });
    }

    // Verificar que el usuario es miembro
    const membership = await GroupMember.findOne({
      where: {
        grupo_id: id,
        usuario_id: userId,
      },
    });

    if (!membership) {
      return res.status(404).json({
        status: "fail",
        message: "Grupo no encontrado o sin acceso.",
      });
    }

    // Obtener el grupo con miembros
    const group = await Group.findByPk(id, {
      include: [
        {
          model: GroupMember,
          as: "miembros",
          include: [
            {
              model: User,
              as: "usuario",
              attributes: ["id", "nombre_usuario", "email", "avatar_color"],
            },
          ],
        },
      ],
    });

    if (!group) {
      return res.status(404).json({
        status: "fail",
        message: "Grupo no encontrado.",
      });
    }

    // OBTENER GASTOS RECIENTES DEL GRUPO
    const Expense = (await import("../models/Expense.js")).default;
    
    const recentExpenses = await Expense.findAll({
      where: { grupo_id: id },
      limit: 10,
      order: [["fecha_gasto", "DESC"]],
    });

    // OBTENER INFO DEL PAGADOR PARA CADA GASTO
    const expensesWithPayer = await Promise.all(
      recentExpenses.map(async (expense) => {
        const payer = await User.findByPk(expense.pagador_id, {
          attributes: ["id", "nombre_usuario", "avatar_color"],
        });

        return {
          id: expense.id,
          descripcion: expense.descripcion,
          cantidad_total: parseFloat(expense.cantidad_total),
          moneda: expense.moneda,
          fecha_gasto: expense.fecha_gasto,
          grupo_id: expense.grupo_id,  // ✅ AÑADIR ESTO
          pagador_id: expense.pagador_id,  // ✅ AÑADIR ESTO
          pagador: payer ? {
            id: payer.id,
            nombre_usuario: payer.nombre_usuario,
            avatar_color: payer.avatar_color,
          } : null,
        };
      })
    );

    // Formatear respuesta
    const groupData = group.toJSON();
    const formattedGroup = {
      ...groupData,
      miembros: groupData.miembros?.map((m) => ({
        id: m.id,
        usuario_id: m.usuario_id,
        nombre_usuario: m.usuario?.nombre_usuario,
        email: m.usuario?.email,
        avatar_color: m.usuario?.avatar_color,
        role: m.role,
        fecha_anadido: m.fecha_anadido,
      })),
      gastos_recientes: expensesWithPayer,  // ✅ Ahora incluye gastos reales
    };

    res.status(200).json({
      status: "success",
      data: {
        group: formattedGroup,
      },
    });
  } catch (error) {
    console.error("❌ Error en getGroupByID:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// POST - AÑADIR MIEMBRO AL GRUPO
export async function addMemberToGroup(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { email } = req.body;

    console.log("👥 addMemberToGroup llamado");
    console.log("  - Grupo ID:", id);
    console.log("  - Email a añadir:", email);

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Token inválido.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        status: "fail",
        message: "El email es obligatorio.",
      });
    }

    // Verificar que el usuario autenticado es miembro del grupo
    const membership = await GroupMember.findOne({
      where: {
        grupo_id: id,
        usuario_id: userId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        status: "fail",
        message: "No tienes acceso a este grupo.",
      });
    }

    // Buscar al usuario por email
    const userToAdd = await User.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!userToAdd) {
      return res.status(404).json({
        status: "fail",
        message: "No existe ningún usuario con ese email.",
      });
    }

    // Verificar si ya es miembro
    const existingMember = await GroupMember.findOne({
      where: {
        grupo_id: id,
        usuario_id: userToAdd.id,
      },
    });

    if (existingMember) {
      return res.status(409).json({
        status: "fail",
        message: "Este usuario ya es miembro del grupo.",
      });
    }

    // Añadir al grupo
    const newMember = await GroupMember.create({
      grupo_id: id,
      usuario_id: userToAdd.id,
      role: "member",
    });

    // Actualizar fecha del grupo
    const group = await Group.findByPk(id);
    if (group) {
      group.ultima_actualizacion = new Date();
      await group.save();
    }

    console.log("✅ Miembro añadido exitosamente");

    res.status(201).json({
      status: "success",
      message: "Miembro añadido correctamente",
      data: {
        member: {
          id: newMember.id,
          usuario_id: userToAdd.id,
          nombre_usuario: userToAdd.nombre_usuario,
          email: userToAdd.email,
          role: newMember.role,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error en addMemberToGroup:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// DELETE - ELIMINAR GRUPO
export async function deleteGroup(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    console.log("🗑️ deleteGroup llamado");
    console.log("  - Grupo ID:", id);
    console.log("  - Usuario ID:", userId);

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Token inválido.",
      });
    }

    // Buscar el grupo
    const group = await Group.findByPk(id);

    if (!group) {
      return res.status(404).json({
        status: "fail",
        message: "Grupo no encontrado.",
      });
    }

    // Verificar que el usuario es el creador del grupo
    if (group.usuario_id !== userId) {
      return res.status(403).json({
        status: "fail",
        message: "Solo el creador del grupo puede eliminarlo.",
      });
    }

    // Eliminar el grupo (CASCADE eliminará miembros y gastos automáticamente)
    await group.destroy();

    console.log("✅ Grupo eliminado exitosamente");

    res.status(200).json({
      status: "success",
      message: "Grupo eliminado correctamente",
    });
  } catch (error) {
    console.error("❌ Error en deleteGroup:", error.message);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}