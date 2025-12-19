import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";

export async function authMiddleware(req, res, next) {
  try {
    console.log("🔐 JWT_SECRET cargado:", JWT_SECRET); 
    console.log("📨 Authorization header:", req.headers.authorization); 
    
    const token = req.headers.authorization?.split(" ")[1];
    
    console.log("🎫 Token extraído:", token); 

    if (!token)
      return res.status(401).json({ message: "Token requerido" });

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("✅ Token decodificado:", decoded); 

    const user = await User.findByPk(decoded.id);

    if (!user)
      return res.status(401).json({ message: "Usuario no encontrado" });

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Error en authMiddleware:", err.message); 
    return res.status(401).json({ message: "Token inválido" });
  }
}