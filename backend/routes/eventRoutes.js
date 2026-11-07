// Rutas del CRUD de eventos

const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const verifyAdmin = require("../middleware/adminMiddleware");

const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

// ==========================================
// RUTAS PÚBLICAS
// ==========================================

// Obtener todos los eventos
router.get("/", getEvents);

// Obtener evento por ID
router.get("/:id", getEventById);

// ==========================================
// RUTAS ADMINISTRATIVAS
// ==========================================

// Crear evento
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  createEvent
);

// Actualizar evento
router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  updateEvent
);

// Eliminar evento
router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  deleteEvent
);

module.exports = router;