const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const groupController = require("../controllers/groupController");
const router = express.Router();

router.get("/", authMiddleware, groupController.getAllGroupsByUser);
router.post("/", authMiddleware, groupController.createGroup);

router.get("/:id", authMiddleware, groupController.getGroupByID);

module.exports = router;
