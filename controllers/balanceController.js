import Expense from "../models/Expense.js";
import ExpenseShared from "../models/ExpenseShared.js";
import Group from "../models/Group.js";
import GroupMember from "../models/GroupMember.js";
import User from "../models/User.js";
import { Op } from "sequelize";

// GET - BALANCE GENERAL DEL USUARIO
export const getBalanceGeneral = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("💼 Obteniendo balance general para usuario:", userId);

    // Obtener grupos del usuario
    const memberships = await GroupMember.findAll({
      where: { usuario_id: userId },
      attributes: ["grupo_id"],
      raw: true,
    });

    const groupIds = memberships.map((m) => m.grupo_id);

    // Gastos personales
    const gastosPersonales = await Expense.findAll({
      where: {
        pagador_id: userId,
        grupo_id: null,
      },
      raw: true,
    });

    const totalGastadoPersonal = gastosPersonales.reduce(
      (sum, e) => sum + parseFloat(e.cantidad_total || 0),
      0
    );

    // Gastos de grupo donde el usuario pagó
    const gastosPagadosEnGrupos = groupIds.length > 0
      ? await Expense.findAll({
          where: {
            pagador_id: userId,
            grupo_id: groupIds,
          },
          raw: true,
        })
      : [];

    const totalPagadoEnGrupos = gastosPagadosEnGrupos.reduce(
      (sum, e) => sum + parseFloat(e.cantidad_total || 0),
      0
    );

    // Calcular lo que el usuario debe pagar (su parte en gastos de grupo)
    const participacionesUsuario = groupIds.length > 0
      ? await ExpenseShared.findAll({
          where: { usuario_id: userId },
          include: [
            {
              model: Expense,
              as: "gasto",
              where: {
                grupo_id: groupIds,
                pagador_id: { [Op.ne]: userId },
              },
            },
          ],
        })
      : [];

    const totalDebesPagar = participacionesUsuario.reduce(
      (sum, p) => sum + parseFloat(p.cantidad || 0),
      0
    );

    // Calcular lo que otros deben al usuario
    const gastosQueOtrosDeben = gastosPagadosEnGrupos.map((g) => g.id);

    const participacionesDeOtros = gastosQueOtrosDeben.length > 0
      ? await ExpenseShared.findAll({
          where: {
            gasto_id: gastosQueOtrosDeben,
            usuario_id: { [Op.ne]: userId },
          },
        })
      : [];

    const totalDebesRecibir = participacionesDeOtros.reduce(
      (sum, p) => sum + parseFloat(p.cantidad || 0),
      0
    );

    // Total gastado global
    const totalGastado = totalGastadoPersonal + totalPagadoEnGrupos;

    // Balance neto
    const balanceNeto = totalDebesRecibir - totalDebesPagar;

    return res.status(200).json({
      status: "success",
      data: {
        total_gastado: parseFloat(totalGastado.toFixed(2)),
        total_gastado_personal: parseFloat(totalGastadoPersonal.toFixed(2)),
        total_gastado_grupos: parseFloat(totalPagadoEnGrupos.toFixed(2)),
        total_debes_recibir: parseFloat(totalDebesRecibir.toFixed(2)),
        total_debes_pagar: parseFloat(totalDebesPagar.toFixed(2)),
        balance_neto: parseFloat(balanceNeto.toFixed(2)),
      },
    });
  } catch (err) {
    console.error("❌ Error en getBalanceGeneral:", err.message);
    res.status(500).json({
      status: "error",
      message: "Error al obtener balance general",
      error: err.message,
    });
  }
};

// GET - DETALLES DE GASTOS PERSONALES
export const getGastosPersonalesDetalle = async (req, res) => {
  try {
    const userId = req.user.id;

    const gastosPersonales = await Expense.findAll({
      where: {
        pagador_id: userId,
        grupo_id: null,
      },
      order: [["fecha_gasto", "DESC"]],
    });

    const formattedExpenses = gastosPersonales.map((expense) => ({
      id: expense.id,
      descripcion: expense.descripcion,
      cantidad: parseFloat(expense.cantidad_total),
      moneda: expense.moneda,
      fecha: expense.fecha_gasto,
    }));

    const totalGastado = formattedExpenses.reduce(
      (sum, e) => sum + e.cantidad,
      0
    );

    return res.status(200).json({
      status: "success",
      data: {
        gastos: formattedExpenses,
        total: parseFloat(totalGastado.toFixed(2)),
      },
    });
  } catch (err) {
    console.error("❌ Error en getGastosPersonalesDetalle:", err.message);
    res.status(500).json({
      status: "error",
      message: "Error al obtener gastos personales",
      error: err.message,
    });
  }
};

// GET - RESUMEN DE GRUPOS DEL USUARIO
export const getResumenGrupos = async (req, res) => {
  try {
    const userId = req.user.id;

    const memberships = await GroupMember.findAll({
      where: { usuario_id: userId },
      include: [
        {
          model: Group,
          as: "grupo",
          attributes: ["id", "nombre_grupo"],
        },
      ],
    });

    const resumenGrupos = await Promise.all(
      memberships.map(async (membership) => {
        const groupId = membership.grupo_id;

        // Total aportado
        const gastosPagados = await Expense.findAll({
          where: {
            grupo_id: groupId,
            pagador_id: userId,
          },
          raw: true,
        });

        const totalAportado = gastosPagados.reduce(
          (sum, e) => sum + parseFloat(e.cantidad_total || 0),
          0
        );

        // Total que debe
        const participaciones = await ExpenseShared.findAll({
          where: { usuario_id: userId },
          include: [
            {
              model: Expense,
              as: "gasto",
              where: {
                grupo_id: groupId,
                pagador_id: { [Op.ne]: userId },
              },
            },
          ],
        });

        const totalDebe = participaciones.reduce(
          (sum, p) => sum + parseFloat(p.cantidad || 0),
          0
        );

        // Total que le deben
        const gastosIds = gastosPagados.map((g) => g.id);
        const participacionesOtros = gastosIds.length > 0
          ? await ExpenseShared.findAll({
              where: {
                gasto_id: gastosIds,
                usuario_id: { [Op.ne]: userId },
              },
            })
          : [];

        const totalRecibe = participacionesOtros.reduce(
          (sum, p) => sum + parseFloat(p.cantidad || 0),
          0
        );

        const balanceNeto = totalRecibe - totalDebe;

        return {
          grupo_id: groupId,
          nombre_grupo: membership.grupo.nombre_grupo,
          total_aportado: parseFloat(totalAportado.toFixed(2)),
          total_debe: parseFloat(totalDebe.toFixed(2)),
          total_recibe: parseFloat(totalRecibe.toFixed(2)),
          balance_neto: parseFloat(balanceNeto.toFixed(2)),
        };
      })
    );

    return res.status(200).json({
      status: "success",
      data: {
        grupos: resumenGrupos,
      },
    });
  } catch (err) {
    console.error("❌ Error en getResumenGrupos:", err.message);
    res.status(500).json({
      status: "error",
      message: "Error al obtener resumen de grupos",
      error: err.message,
    });
  }
};

// GET - BALANCE POR GRUPO
export const getBalanceByGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log("👥 Obteniendo balance del grupo:", id);

    // Verificar acceso
    const membership = await GroupMember.findOne({
      where: {
        grupo_id: id,
        usuario_id: userId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        status: "fail",
        message: "No tienes acceso a este grupo",
      });
    }

    // Obtener miembros
    const members = await GroupMember.findAll({
      where: { grupo_id: id },
      include: [
        {
          model: User,
          as: "usuario",
          attributes: ["id", "nombre_usuario", "avatar_color"],
        },
      ],
    });

    // Calcular balance por miembro
    const balances = await Promise.all(
      members.map(async (member) => {
        const memberId = member.usuario_id;

        // Total pagado
        const gastosPagados = await Expense.findAll({
          where: {
            grupo_id: id,
            pagador_id: memberId,
          },
          raw: true,
        });

        const totalAportado = gastosPagados.reduce(
          (sum, e) => sum + parseFloat(e.cantidad_total || 0),
          0
        );

        // Total que debe
        const participaciones = await ExpenseShared.findAll({
          where: { usuario_id: memberId },
          include: [
            {
              model: Expense,
              as: "gasto",
              where: {
                grupo_id: id,
                pagador_id: { [Op.ne]: memberId },
              },
            },
          ],
        });

        const totalDebe = participaciones.reduce(
          (sum, p) => sum + parseFloat(p.cantidad || 0),
          0
        );

        // Total que le deben
        const gastosIds = gastosPagados.map((g) => g.id);
        const participacionesOtros = gastosIds.length > 0
          ? await ExpenseShared.findAll({
              where: {
                gasto_id: gastosIds,
                usuario_id: { [Op.ne]: memberId },
              },
            })
          : [];

        const totalRecibe = participacionesOtros.reduce(
          (sum, p) => sum + parseFloat(p.cantidad || 0),
          0
        );

        const balanceNeto = totalRecibe - totalDebe;

        return {
          usuario_id: memberId,
          nombre_usuario: member.usuario.nombre_usuario,
          avatar_color: member.usuario.avatar_color,
          total_aportado: parseFloat(totalAportado.toFixed(2)),
          total_debe: parseFloat(totalDebe.toFixed(2)),
          total_recibe: parseFloat(totalRecibe.toFixed(2)),
          balance_neto: parseFloat(balanceNeto.toFixed(2)),
        };
      })
    );

    return res.status(200).json({
      status: "success",
      data: {
        grupo_id: parseInt(id),
        members: balances,
      },
    });
  } catch (err) {
    console.error("❌ Error en getBalanceByGroup:", err.message);
    res.status(500).json({
      status: "error",
      message: "Error al obtener balance del grupo",
      error: err.message,
    });
  }
};

// GET - BALANCE 
export const getBalanceWithTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log("💰 Obteniendo balance con transacciones para grupo:", id);

    // Verificar acceso
    const membership = await GroupMember.findOne({
      where: {
        grupo_id: id,
        usuario_id: userId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        status: "fail",
        message: "No tienes acceso a este grupo",
      });
    }

    // Obtener miembros
    const members = await GroupMember.findAll({
      where: { grupo_id: id },
      include: [
        {
          model: User,
          as: "usuario",
          attributes: ["id", "nombre_usuario", "avatar_color"],
        },
      ],
    });

    // Calcular balance por usuario
    const balances = await Promise.all(
      members.map(async (member) => {
        const memberId = member.usuario_id;

        // Total pagado
        const gastosPagados = await Expense.findAll({
          where: {
            grupo_id: id,
            pagador_id: memberId,
          },
          raw: true,
        });

        const totalAportado = gastosPagados.reduce(
          (sum, e) => sum + parseFloat(e.cantidad_total || 0),
          0
        );

        // Total que debe 
        const participaciones = await ExpenseShared.findAll({
          where: { usuario_id: memberId },
          include: [
            {
              model: Expense,
              as: "gasto",
              where: {
                grupo_id: id,
                pagador_id: { [Op.ne]: memberId },
              },
            },
          ],
        });

        const totalDebe = participaciones.reduce(
          (sum, p) => sum + parseFloat(p.cantidad || 0),
          0
        );

        // Total que le deben 
        const gastosIds = gastosPagados.map((g) => g.id);
        const participacionesOtros = gastosIds.length > 0
          ? await ExpenseShared.findAll({
              where: {
                gasto_id: gastosIds,
                usuario_id: { [Op.ne]: memberId },
              },
            })
          : [];

        const totalRecibe = participacionesOtros.reduce(
          (sum, p) => sum + parseFloat(p.cantidad || 0),
          0
        );

        const balanceNeto = totalRecibe - totalDebe;

        return {
          usuario_id: memberId,
          nombre_usuario: member.usuario.nombre_usuario,
          avatar_color: member.usuario.avatar_color,
          total_aportado: parseFloat(totalAportado.toFixed(2)),
          total_debe: parseFloat(totalDebe.toFixed(2)),
          total_recibe: parseFloat(totalRecibe.toFixed(2)),
          balance_neto: parseFloat(balanceNeto.toFixed(2)),
        };
      })
    );

    const transactions = calculateOptimalTransactions(balances);

    return res.status(200).json({
      status: "success",
      data: {
        grupo_id: parseInt(id),
        members: balances,
        transactions: transactions,
      },
    });
  } catch (err) {
    console.error("❌ Error en getBalanceWithTransactions:", err.message);
    res.status(500).json({
      status: "error",
      message: "Error al obtener balance del grupo",
      error: err.message,
    });
  }
};

function calculateOptimalTransactions(balances) {
  // Deudores y acreedores
  const deudores = balances
    .filter(b => b.balance_neto < 0)
    .map(b => ({
      nombre: b.nombre_usuario,
      usuario_id: b.usuario_id,
      cantidad: Math.abs(b.balance_neto),
      avatar_color: b.avatar_color,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);

  const acreedores = balances
    .filter(b => b.balance_neto > 0)
    .map(b => ({
      nombre: b.nombre_usuario,
      usuario_id: b.usuario_id,
      cantidad: b.balance_neto,
      avatar_color: b.avatar_color,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);

  const transactions = [];

  let i = 0;
  let j = 0;

  while (i < deudores.length && j < acreedores.length) {
    const deudor = deudores[i];
    const acreedor = acreedores[j];

    const cantidad = Math.min(deudor.cantidad, acreedor.cantidad);

    if (cantidad > 0.01) { 
      transactions.push({
        de: deudor.nombre,
        de_id: deudor.usuario_id,
        de_avatar: deudor.avatar_color,
        a: acreedor.nombre,
        a_id: acreedor.usuario_id,
        a_avatar: acreedor.avatar_color,
        cantidad: parseFloat(cantidad.toFixed(2)),
      });
    }

    deudor.cantidad -= cantidad;
    acreedor.cantidad -= cantidad;

    if (deudor.cantidad < 0.01) i++;
    if (acreedor.cantidad < 0.01) j++;
  }

  return transactions;
}