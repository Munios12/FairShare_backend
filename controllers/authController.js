import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";

function sanitizeUser(userInstance) {
  const { password_usuario, ...safe } = userInstance.toJSON();
  return safe;
}

// REGISTER
export async function register(req, res) {
  try {
    const { nombre_usuario, email, password } = req.body;

    if (!nombre_usuario || !email || !password) {
      return res.status(400).json({ message: "Faltan campos" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "El email ya está registrado" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      nombre_usuario,
      email,
      password_usuario: hashed,
      fecha_alta: new Date()
    });

    return res.status(201).json({
      user: sanitizeUser(newUser),
    });
  } catch (err) {
    return res.status(500).json({ message: "Error en register", error: err.message });
  }
}

// LOGIN
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Faltan campos" });

    const user = await User.findOne({ where: { email } });

    if (!user)
      return res.status(401).json({ message: "Credenciales inválidas" });

    const ok = await bcrypt.compare(password, user.password_usuario);
    if (!ok)
      return res.status(401).json({ message: "Credenciales inválidas" });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nombre: user.nombre_usuario,
      },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: "Error en login", error: err.message });
  }
}

// GET -ME
export async function me(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({ message: "Token inválido" });

    const user = await User.findByPk(userId);

    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    res.json({
      user: sanitizeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: "Error en /me", error: err.message });
  }
}
