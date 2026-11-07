const express = require("express");

const {
  getBillingConfig,
  saveBillingConfig,
  getEventInstallments,
  saveEventInstallments,
  searchAssociates,
  getAssociateBenefit,
  saveAssociateBenefit,
  getMyEventBenefit
} = require(
  "../controllers/billingController"
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
// CONFIGURACIÓN GENERAL DE COBRO
// ==========================================

// Consultar configuración
router.get(
  "/evento/:eventoId/configuracion",
  authenticateToken,
  isAdmin,
  getBillingConfig
);


// Crear o actualizar configuración
router.put(
  "/evento/:eventoId/configuracion",
  authenticateToken,
  isAdmin,
  saveBillingConfig
);


// ==========================================
// CUOTAS DEL EVENTO
// ==========================================

// Consultar cuotas
router.get(
  "/evento/:eventoId/cuotas",
  authenticateToken,
  isAdmin,
  getEventInstallments
);


// Guardar cuotas
router.put(
  "/evento/:eventoId/cuotas",
  authenticateToken,
  isAdmin,
  saveEventInstallments
);


// ==========================================
// BÚSQUEDA DE ASOCIADOS
// ==========================================

router.get(
  "/asociados/buscar",
  authenticateToken,
  isAdmin,
  searchAssociates
);


// ==========================================
// BENEFICIO INDIVIDUAL DEL ASOCIADO
// ==========================================

// Consultar beneficio
router.get(
  "/evento/:eventoId/asociado/:usuarioId/beneficio",
  authenticateToken,
  isAdmin,
  getAssociateBenefit
);


// Guardar o actualizar beneficio
router.put(
  "/evento/:eventoId/asociado/:usuarioId/beneficio",
  authenticateToken,
  isAdmin,
  saveAssociateBenefit
);
// ==========================================
// CONSULTAR MI PROPIO BENEFICIO
// ==========================================

router.get(
  "/evento/:eventoId/mi-beneficio",
  authenticateToken,
  getMyEventBenefit
);

module.exports =
  router;