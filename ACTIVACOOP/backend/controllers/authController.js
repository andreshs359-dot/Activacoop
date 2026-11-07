const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const database = require("../config/database");

// ==========================================
// REGISTRO PÚBLICO DESHABILITADO
// ==========================================

const register = (req, res) => {
  return res.status(403).json({
    message:
      "El registro público no está disponible. Los asociados deben estar registrados previamente en Activacoop."
  });
};

// ==========================================
// INICIO DE SESIÓN
// ==========================================

const login = (req, res) => {

  const {
    numeroDocumento,
    password
  } = req.body;

  // Validar campos obligatorios
  if (!numeroDocumento || !password) {
    return res.status(400).json({
      message:
        "Número de documento y contraseña son obligatorios"
    });
  }

  // Buscar asociado por número de documento
  const sql = `
    SELECT *
    FROM usuario
    WHERE NUMERO_DOCUMENTO = ?
  `;

  database.query(
    sql,
    [numeroDocumento],
    async (error, results) => {

      if (error) {

        console.error(error);

        return res.status(500).json({
          message:
            "Error al consultar el usuario"
        });
      }

      // Usuario no encontrado
      if (results.length === 0) {
        return res.status(401).json({
          message:
            "Número de documento o contraseña incorrectos"
        });
      }

      const user = results[0];

      // Verificar que el usuario esté activo
      if (
        user.ESTADO_USUARIO &&
        user.ESTADO_USUARIO.toUpperCase() !== "ACTIVO"
      ) {
        return res.status(403).json({
          message:
            "El usuario no se encuentra activo"
        });
      }

      let passwordMatch = false;

      // ==========================================
      // PRIMER INGRESO
      // ==========================================

      if (!user.CONTRASENA) {

        // Obtener últimos 4 dígitos del documento
        const documento =
          String(user.NUMERO_DOCUMENTO);

        const passwordInicial =
          documento.slice(-4);

        // Comparar contraseña ingresada
        passwordMatch =
          password === passwordInicial;

        if (!passwordMatch) {
          return res.status(401).json({
            message:
              "Número de documento o contraseña incorrectos"
          });
        }

        // Guardar contraseña inicial protegida con bcrypt
        const hashedPassword =
          await bcrypt.hash(
            passwordInicial,
            10
          );

        const sqlUpdate = `
  UPDATE usuario
  SET
    CONTRASENA = ?,
    PRIMER_INGRESO = 0
  WHERE ID_USUARIO = ?
`;

        database.query(
          sqlUpdate,
          [
            hashedPassword,
            user.ID_USUARIO
          ],
          (updateError) => {

            if (updateError) {
              console.error(
                "Error guardando contraseña:",
                updateError
              );
            }
          }
        );

      } else {

        // ==========================================
        // USUARIO QUE YA TIENE CONTRASEÑA
        // ==========================================

        passwordMatch =
          await bcrypt.compare(
            password,
            user.CONTRASENA
          );

        if (!passwordMatch) {
          return res.status(401).json({
            message:
              "Número de documento o contraseña incorrectos"
          });
        }
      }

      // ==========================================
      // GENERAR TOKEN
      // ==========================================

      const token = jwt.sign(
        {
          id: user.ID_USUARIO,
          documento:
            user.NUMERO_DOCUMENTO,
          rol:
            user.ROL_ID_ROL
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "2h"
        }
      );

      // ==========================================
      // RESPUESTA
      // ==========================================

      res.json({

        message:
          "Inicio de sesión exitoso",

        token,

        primerIngreso:
          Boolean(user.PRIMER_INGRESO),

        user: {

          id:
            user.ID_USUARIO,

          numeroDocumento:
            user.NUMERO_DOCUMENTO,

          nombres:
            user.NOMBRES,

          apellidos:
            user.APELLIDOS,

          correo:
            user.CORREO,

          rol:
            user.ROL_ID_ROL

        }

      });

    }
  );

};

module.exports = {
  register,
  login
};
