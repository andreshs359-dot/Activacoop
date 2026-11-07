const database = require("../config/database");


// ==========================================
// OBTENER CATEGORÍAS
// ==========================================

const getCategories = (req, res) => {

  const sql = `
    SELECT
      id_CATEGORIA_EVENTO AS id,
      NOMBRE_CATEGORIA AS nombre,
      DESCRIPCION AS descripcion

    FROM categoria_evento

    ORDER BY
      NOMBRE_CATEGORIA ASC
  `;


  database.query(
    sql,
    (error, results) => {

      if (error) {

        console.error(
          "Error al consultar categorías:",
          error
        );

        return res.status(500).json({
          message:
            "Error al consultar las categorías"
        });
      }


      return res.json(
        results
      );
    }
  );
};


// ==========================================
// CREAR CATEGORÍA
// ==========================================

const createCategory = (req, res) => {

  const {
    nombre,
    descripcion
  } = req.body;


  const nombreLimpio =
    String(nombre || "").trim();


  const descripcionLimpia =
    String(descripcion || "").trim();


  // ==========================================
  // VALIDACIONES
  // ==========================================

  if (!nombreLimpio) {

    return res.status(400).json({
      message:
        "El nombre de la categoría es obligatorio"
    });
  }


  if (nombreLimpio.length < 3) {

    return res.status(400).json({
      message:
        "El nombre debe tener al menos 3 caracteres"
    });
  }


  if (
    descripcionLimpia &&
    descripcionLimpia.length < 5
  ) {

    return res.status(400).json({
      message:
        "La descripción debe tener al menos 5 caracteres"
    });
  }


  // ==========================================
  // VERIFICAR SI YA EXISTE
  // ==========================================

  const checkSql = `
    SELECT
      id_CATEGORIA_EVENTO

    FROM categoria_evento

    WHERE LOWER(TRIM(NOMBRE_CATEGORIA)) =
          LOWER(TRIM(?))

    LIMIT 1
  `;


  database.query(
    checkSql,
    [nombreLimpio],
    (checkError, existingResults) => {

      if (checkError) {

        console.error(
          "Error al verificar categoría:",
          checkError
        );

        return res.status(500).json({
          message:
            "Error al verificar la categoría"
        });
      }


      if (existingResults.length > 0) {

        return res.status(409).json({
          message:
            "Ya existe una categoría con ese nombre"
        });
      }


      // ==========================================
      // CREAR CATEGORÍA
      // ==========================================

      const insertSql = `
        INSERT INTO categoria_evento
        (
          NOMBRE_CATEGORIA,
          DESCRIPCION
        )
        VALUES (?, ?)
      `;


      database.query(
        insertSql,
        [
          nombreLimpio,
          descripcionLimpia || null
        ],
        (error, result) => {

          if (error) {

            console.error(
              "Error al crear categoría:",
              error
            );

            return res.status(500).json({
              message:
                "Error al crear la categoría"
            });
          }


          return res.status(201).json({
            message:
              "Categoría creada correctamente",

            categoryId:
              result.insertId
          });
        }
      );
    }
  );
};


// ==========================================
// ELIMINAR CATEGORÍA
// ==========================================

const deleteCategory = (req, res) => {

  const { id } = req.params;


  // Primero revisamos si la categoría
  // está siendo utilizada por algún evento.

  const checkSql = `
    SELECT
      COUNT(*) AS total

    FROM evento

    WHERE ID_CATEGORIA = ?
  `;


  database.query(
    checkSql,
    [id],
    (checkError, checkResults) => {

      if (checkError) {

        console.error(
          "Error al verificar eventos de categoría:",
          checkError
        );

        return res.status(500).json({
          message:
            "Error al verificar la categoría"
        });
      }


      const eventosRelacionados =
        Number(
          checkResults[0].total
        );


      if (eventosRelacionados > 0) {

        return res.status(409).json({
          message:
            "No se puede eliminar la categoría porque tiene eventos asociados"
        });
      }


      // ==========================================
      // ELIMINAR CATEGORÍA
      // ==========================================

      const deleteSql = `
        DELETE FROM categoria_evento
        WHERE id_CATEGORIA_EVENTO = ?
      `;


      database.query(
        deleteSql,
        [id],
        (error, result) => {

          if (error) {

            console.error(
              "Error al eliminar categoría:",
              error
            );

            return res.status(500).json({
              message:
                "Error al eliminar la categoría"
            });
          }


          if (
            result.affectedRows === 0
          ) {

            return res.status(404).json({
              message:
                "Categoría no encontrada"
            });
          }


          return res.json({
            message:
              "Categoría eliminada correctamente"
          });
        }
      );
    }
  );
};


module.exports = {
  getCategories,
  createCategory,
  deleteCategory
};