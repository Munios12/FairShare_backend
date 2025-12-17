const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, usersController.getAllUsers);
router.post("/auth/register", usersController.createUser); //REGISTRO
router.post("/auth/login", usersController.login); //LOGIN
router.get("/auth/me", authMiddleware, usersController.getProfile);
// router.get("/:email", usersController.getUser); SOLO PARA PRUEBAS

module.exports = router;
