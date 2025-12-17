const { Op } = require("sequelize");
const Group = require("../models/Group");
const GroupMember = require("../models/GroupMember");

// Nota: en este punto aún no existe la tabla intermedia de membresías.
// Se asume temporalmente que cada grupo pertenece al usuario autenticado
// a través de un campo usuario_id en la tabla grupos. Ajusta cuando tengas
// la tabla group_members.

exports.getAllGroupsByUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Token inválido.",
      });
    }

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

    const groups = await Group.findAll({
      where: {
        id: groupIds,
      },
      order: [["ultima_actualizacion", "DESC"]],
    });

    res.status(200).json({
      status: "success",
      result: groups.length,
      data: {
        groups,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.createGroup = async (req, res) => {
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

    res.status(201).json({
      status: "success",
      data: {
        group,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getGroupByID = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Token inválido.",
      });
    }

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

    const group = await Group.findByPk(id);

    if (!group) {
      return res.status(404).json({
        status: "fail",
        message: "Grupo no encontrado o sin acceso.",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        group,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
