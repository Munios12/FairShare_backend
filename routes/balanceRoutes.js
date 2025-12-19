import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  getBalanceGeneral,
  getGastosPersonalesDetalle,
  getResumenGrupos,
  getBalanceByGroup,
  getBalanceWithTransactions
} from "../controllers/balanceController.js";

const router = Router();

// Rutas de balance
router.get("/", authMiddleware, getBalanceGeneral);
router.get("/personal", authMiddleware, getGastosPersonalesDetalle);
router.get("/grupos", authMiddleware, getResumenGrupos);
router.get("/group/:id/transactions", authMiddleware, getBalanceWithTransactions);
router.get("/group/:id", authMiddleware, getBalanceByGroup);

export default router;
