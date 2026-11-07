// middleware / proteger rutas solo para administradores

const verifyAdmin = (req, res, next) => {
  // Verificar que exista usuario autenticado
  if (!req.user) {
    return res.status(401).json({
      message: "Usuario no autenticado",
    });
  }

  // Rol 2 = ADMINISTRADOR
  if (Number(req.user.rol) !== 2) {
    return res.status(403).json({
      message: "Acceso restringido a administradores",
    });
  }

  next();
};

module.exports = verifyAdmin;