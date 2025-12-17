const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";

const sanitizeUser = (userInstance) => {
  const { password_usuario, ...publicData } = userInstance.toJSON();
  return publicData;
};

exports.getAllUsers = async (req, res) => {
  try {
    const usersList = await User.findAll();
    const safeUsers = usersList.map(sanitizeUser);

    //RESPONSE
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
};

exports.getUser = async (req, res) => {
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

    //RESPONSE
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
};

exports.login = async (req, res) => {
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
};

exports.createUser = async (req, res) => {
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
};

exports.getProfile = async (req, res) => {
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
};
