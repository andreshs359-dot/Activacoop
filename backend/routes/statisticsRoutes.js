//========================
// Rutas de Estadisticas
//========================
const express = require("express");

const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");

const {
  getStatistics
} = require("../controllers/statisticsController");

router.get(
  "/",
  authenticateToken,
  isAdmin,
  getStatistics
);

module.exports = router;
