const express = require("express");

const {
  createRegistration,
  getMyRegistrations,
  cancelRegistration,
  getEventParticipants,
  updateAttendance
} = require(
  "../controllers/registrationController"
);

const authenticateToken =
  require(
    "../middleware/authMiddleware"
  );

const isAdmin =
  require(
    "../middleware/adminMiddleware"
  );

const router =
  express.Router();


// ==========================================
// USUARIO AUTENTICADO
// ==========================================


// Crear inscripción
router.post(
  "/",
  authenticateToken,
  createRegistration
);


// Consultar mis inscripciones
router.get(
  "/mis-inscripciones",
  authenticateToken,
  getMyRegistrations
);


// ==========================================
// ADMINISTRADOR
// ==========================================


// Consultar participantes de un evento
router.get(
  "/evento/:eventoId/participantes",
  authenticateToken,
  isAdmin,
  getEventParticipants
);


// Actualizar asistencia
router.put(
  "/:id/asistencia",
  authenticateToken,
  isAdmin,
  updateAttendance
);


// Eliminar inscripción
// Solamente un administrador puede realizar esta acción
router.delete(
  "/:id",
  authenticateToken,
  isAdmin,
  cancelRegistration
);


module.exports =
  router;