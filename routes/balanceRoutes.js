import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getBalance } from "../controllers/balanceController.js";

const router = Router();

router.get("/", authMiddleware, getBalance);

export default router;
