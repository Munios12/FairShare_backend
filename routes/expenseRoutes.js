import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  createExpense,
  getExpensesByUser,
  getExpensesByGroup,
  getRecentExpenses,
  getExpenseParticipants,  
  updateExpense,           
  deleteExpense,           
} from "../controllers/expenseController.js";

const router = Router();

router.post("/", authMiddleware, createExpense);
router.get("/me", authMiddleware, getExpensesByUser);
router.get("/group/:groupId", authMiddleware, getExpensesByGroup);
router.get("/recent", authMiddleware, getRecentExpenses);
router.get("/:id/participants", authMiddleware, getExpenseParticipants);  
router.put("/:id", authMiddleware, updateExpense);                        
router.delete("/:id", authMiddleware, deleteExpense);      

export default router;
