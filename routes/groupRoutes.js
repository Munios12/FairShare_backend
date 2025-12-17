const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const groupController = require("../controllers/groupController");
const router = express.Router();

router.get("/", authMiddleware, groupController.getAllGroupsByUser); //Obtener todos los grupos por Usuario
router.post("/", authMiddleware, groupController.createGroup); //Crear un nuevo grupo

router.get("/:id", authMiddleware, groupController.getGroupByID); //Obtener un grupo por ID

module.exports = router;
