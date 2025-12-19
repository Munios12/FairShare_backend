import Expense from "../models/Expense.js";
import ExpenseShared from "../models/ExpenseShared.js";
import Group from "../models/Group.js";

export const getBalance = async (req, res) => {
  try {
    const uid = req.user.id;

    // Total pagado por el usuario
    const paid = await Expense.sum("amount", {
      where: { pagador_id: uid },
    });

    // Total que debe pagar (participaciones)
    const mustPay = await ExpenseShared.sum("amount", {
      where: { usuario_id: uid },
    });

    // Total que deben pagarle al usuario
    const mustReceive = await ExpenseShared.sum("amount", {
      include: [
        {
          model: Expense,
          where: { pagador_id: uid },
        },
      ],
    });

    return res.json({
      paid: paid || 0,
      mustPay: mustPay || 0,
      mustReceive: mustReceive || 0,
      balance: (mustReceive || 0) - (mustPay || 0),
    });
  } catch (err) {
    console.error("BALANCE ERROR:", err);
    res.status(500).json({ message: "Internal error" });
  }
};
