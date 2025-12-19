import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  getAllGroupsByUser,
  createGroup,
  getGroupByID,
  addMemberToGroup,
  deleteGroup,  
} from "../controllers/groupController.js";

const router = Router();

// Obtener todos los grupos del usuario autenticado
router.get("/", authMiddleware, getAllGroupsByUser);

// Crear un nuevo grupo
router.post("/", authMiddleware, createGroup);

// Obtener un grupo por ID
router.get("/:id", authMiddleware, getGroupByID);

// Añadir miembro al grupo 
router.post("/:id/add-member", authMiddleware, addMemberToGroup);

// Borrar grupo
router.delete("/:id", authMiddleware, deleteGroup); 

export default router;