const { Op } = require("sequelize");
const Group = require("../models/Group");

// Nota: en este punto aún no existe la tabla intermedia de membresías.
// Se asume temporalmente que cada grupo pertenece al usuario autenticado
// a través de un campo user_id en la tabla groups. Ajusta cuando tengas
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

    const groups = await Group.findAll({
      where: {
        user_id: userId,
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
      user_id: userId,
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

    const group = await Group.findOne({
      where: {
        id,
        user_id: userId,
      },
    });

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
