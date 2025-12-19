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
  createPersonalExpense,
  getPersonalExpenses,
  deletePersonalExpense,
} from "../controllers/expenseController.js";

const router = Router();


router.get("/recent", authMiddleware, getRecentExpenses);
router.get("/me", authMiddleware, getExpensesByUser);
router.get("/personal", authMiddleware, getPersonalExpenses);           
router.post("/personal", authMiddleware, createPersonalExpense);        
router.delete("/personal/:id", authMiddleware, deletePersonalExpense);  


router.get("/group/:groupId", authMiddleware, getExpensesByGroup);


router.get("/:id/participants", authMiddleware, getExpenseParticipants);
router.put("/:id", authMiddleware, updateExpense);
router.delete("/:id", authMiddleware, deleteExpense);


router.post("/", authMiddleware, createExpense);

export default router;