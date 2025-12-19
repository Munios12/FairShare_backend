import express from "express";
import * as usersController from "../controllers/userController.js";
import { 
  updateAvatar, 
  updateProfile,
  updatePassword,
  deleteAccount,
  getDashboardData  
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// USUARIOS
router.get("/", authMiddleware, usersController.getAllUsers);

// AUTH
router.post("/auth/register", usersController.createUser);
router.post("/auth/login", usersController.login);
router.get("/auth/me", authMiddleware, usersController.getProfile);

// PERFIL
router.patch("/update-avatar", authMiddleware, updateAvatar);
router.patch("/update-profile", authMiddleware, updateProfile);
router.patch("/update-password", authMiddleware, updatePassword);
router.delete("/delete-account", authMiddleware, deleteAccount);

// DASHBOARD
router.get("/dashboard", authMiddleware, getDashboardData); 

export default router;