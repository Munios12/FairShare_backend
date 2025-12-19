import Expense from "../models/Expense.js";
import ExpenseShared from "../models/ExpenseShared.js";
import Group from "../models/Group.js";
import User from "../models/User.js";

// POST - CREAR GASTO
export const createExpense = async (req, res) => {
  try {
    const { grupo_id, descripcion, cantidad_total, pagador_id, participantes } = req.body;
    const userId = req.user.id;

    console.log("💰 Crear gasto:", { grupo_id, descripcion, cantidad_total, pagador_id, participantes });

    // Validaciones
    if (!grupo_id || !descripcion || !cantidad_total || !pagador_id) {
      return res.status(400).json({ 
        status: "fail",
        message: "Faltan datos requeridos" 
      });
    }

    if (!Array.isArray(participantes) || participantes.length === 0) {
      return res.status(400).json({ 
        status: "fail",
        message: "Debe haber al menos un participante" 
      });
    }

    // Verificar que el usuario es miembro del grupo
    const GroupMember = (await import("../models/GroupMember.js")).default;
    const membership = await GroupMember.findOne({
      where: {
        grupo_id,
        usuario_id: userId,
      },
    });

    if (!membership) {
      return res.status(403).json({ 
        status: "fail",
        message: "No tienes acceso a este grupo" 
      });
    }

    // Crear el gasto
    const expense = await Expense.create({
      grupo_id,
      pagador_id,
      descripcion,
      cantidad_total: parseFloat(cantidad_total),
      moneda: "EUR",
      fecha_gasto: new Date(),
      fecha_creacion: new Date(),
    });

    // Calcular cantidad por participante
    const cantidadPorParticipante = parseFloat(cantidad_total) / participantes.length;

    // Crear registros en gastos_compartidos
    const sharedExpenses = await Promise.all(
      participantes.map(participanteId =>
        ExpenseShared.create({
          gasto_id: expense.id,
          usuario_id: participanteId,
          cantidad: cantidadPorParticipante,
        })
      )
    );

    // Actualizar fecha del grupo
    const group = await Group.findByPk(grupo_id);
    if (group) {
      group.ultima_actualizacion = new Date();
      await group.save();
    }

    console.log("✅ Gasto creado exitosamente:", expense.id);

    return res.status(201).json({ 
      status: "success",
      data: {
        expense: {
          id: expense.id,
          descripcion: expense.descripcion,
          cantidad_total: expense.cantidad_total,
          moneda: expense.moneda,
          pagador_id: expense.pagador_id,
          grupo_id: expense.grupo_id,
        }
      }
    });
  } catch (err) {
    console.error("❌ Error al crear gasto:", err.message);
    res.status(500).json({ 
      status: "error",
      message: "Error interno del servidor",
      error: err.message 
    });
  }
};

export const getExpensesByUser = async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: { pagador_id: req.user.id },
      include: [Group]
    });

    return res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: "Internal error" });
  }
};

export const getExpensesByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const expenses = await Expense.findAll({
      where: { grupo_id: groupId },
      include: [User, Group],
    });

    return res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: "Internal error" });
  }
};

export const getRecentExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      limit: 5,
      order: [["fecha_gasto", "DESC"]],
      include: [User],
    });

    return res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: "Internal error" });
  }
};

// GET - OBTENER PARTICIPANTES DE UN GASTO
export const getExpenseParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log("👥 getExpenseParticipants llamado para gasto:", id);

    // Verificar que el gasto existe
    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({
        status: "fail",
        message: "Gasto no encontrado",
      });
    }

    // Verificar que el usuario tiene acceso al grupo del gasto
    const GroupMember = (await import("../models/GroupMember.js")).default;
    const membership = await GroupMember.findOne({
      where: {
        grupo_id: expense.grupo_id,
        usuario_id: userId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        status: "fail",
        message: "No tienes acceso a este gasto",
      });
    }

    // Obtener participantes
    const participants = await ExpenseShared.findAll({
      where: { gasto_id: id },
      include: [
        {
          model: User,
          as: "usuario",
          attributes: ["id", "nombre_usuario", "avatar_color"],
        },
      ],
    });

    const formattedParticipants = participants.map(p => ({
      id: p.id,
      usuario_id: p.usuario_id,
      nombre_usuario: p.usuario?.nombre_usuario,
      cantidad: parseFloat(p.cantidad),
    }));

    return res.status(200).json({
      status: "success",
      data: {
        participantes: formattedParticipants,
      },
    });
  } catch (err) {
    console.error("❌ Error al obtener participantes:", err.message);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
      error: err.message,
    });
  }
};

// PUT - ACTUALIZAR GASTO
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, cantidad_total, pagador_id, participantes } = req.body;
    const userId = req.user.id;

    console.log("✏️ Actualizar gasto:", id);
    console.log("  - Nuevos datos:", { descripcion, cantidad_total, pagador_id, participantes });

    // Validaciones
    if (!descripcion || !cantidad_total || !pagador_id) {
      return res.status(400).json({
        status: "fail",
        message: "Faltan datos requeridos",
      });
    }

    if (!Array.isArray(participantes) || participantes.length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "Debe haber al menos un participante",
      });
    }

    // Verificar que el gasto existe
    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({
        status: "fail",
        message: "Gasto no encontrado",
      });
    }

    // Verificar que el usuario tiene acceso al grupo del gasto
    const GroupMember = (await import("../models/GroupMember.js")).default;
    const membership = await GroupMember.findOne({
      where: {
        grupo_id: expense.grupo_id,
        usuario_id: userId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        status: "fail",
        message: "No tienes acceso a este gasto",
      });
    }

    // Actualizar el gasto
    expense.descripcion = descripcion;
    expense.cantidad_total = parseFloat(cantidad_total);
    expense.pagador_id = pagador_id;
    await expense.save();

    // Eliminar participantes antiguos
    await ExpenseShared.destroy({
      where: { gasto_id: id },
    });

    // Crear nuevos participantes
    const cantidadPorParticipante = parseFloat(cantidad_total) / participantes.length;
    await Promise.all(
      participantes.map(participanteId =>
        ExpenseShared.create({
          gasto_id: expense.id,
          usuario_id: participanteId,
          cantidad: cantidadPorParticipante,
        })
      )
    );

    // Actualizar fecha del grupo
    const group = await Group.findByPk(expense.grupo_id);
    if (group) {
      group.ultima_actualizacion = new Date();
      await group.save();
    }

    console.log("✅ Gasto actualizado exitosamente");

    return res.status(200).json({
      status: "success",
      message: "Gasto actualizado correctamente",
      data: {
        expense: {
          id: expense.id,
          descripcion: expense.descripcion,
          cantidad_total: expense.cantidad_total,
          moneda: expense.moneda,
          pagador_id: expense.pagador_id,
          grupo_id: expense.grupo_id,
        },
      },
    });
  } catch (err) {
    console.error("❌ Error al actualizar gasto:", err.message);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
      error: err.message,
    });
  }
};

// DELETE - ELIMINAR GASTO
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log("🗑️ Eliminar gasto:", id);

    // Verificar que el gasto existe
    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({
        status: "fail",
        message: "Gasto no encontrado",
      });
    }

    // Verificar que el usuario tiene acceso al grupo del gasto
    const GroupMember = (await import("../models/GroupMember.js")).default;
    const membership = await GroupMember.findOne({
      where: {
        grupo_id: expense.grupo_id,
        usuario_id: userId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        status: "fail",
        message: "No tienes acceso a este gasto",
      });
    }

    // Guardar grupo_id antes de eliminar
    const grupoId = expense.grupo_id;

    // Eliminar participantes primero
    await ExpenseShared.destroy({
      where: { gasto_id: id },
    });

    // Eliminar el gasto
    await expense.destroy();

    // Actualizar fecha del grupo
    const group = await Group.findByPk(grupoId);
    if (group) {
      group.ultima_actualizacion = new Date();
      await group.save();
    }

    console.log("✅ Gasto eliminado exitosamente");

    return res.status(200).json({
      status: "success",
      message: "Gasto eliminado correctamente",
    });
  } catch (err) {
    console.error("❌ Error al eliminar gasto:", err.message);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
      error: err.message,
    });
  }
};