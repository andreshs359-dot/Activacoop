// ==========================================
// CONTROLADOR DE EVENTOS
// ==========================================
// Maneja las solicitudes relacionadas
// con los eventos de Activacoop.

const database = require("../config/database");


// ==========================================
// OBTENER TODOS LOS EVENTOS
// ==========================================

const getEvents = (req, res) => {

  const sql = `
    SELECT
      evento.ID_EVENTO AS id,
      evento.NOMBRE_EVENTO AS titulo,
      evento.DESCRIPCION AS descripcion,
      evento.FECHA_EVENTO AS fecha,
      evento.HORA_INICIO AS hora,
      evento.HORA_FIN AS hora_fin,
      evento.LUGAR AS lugar,
      evento.ESTADO_EVENTO AS estado,
      evento.CUPOS_DISPONIBLES AS cupos_disponibles,
      evento.CUPO_ILIMITADO AS cupo_ilimitado,
      evento.ID_CATEGORIA AS categoria_id,
      categoria_evento.NOMBRE_CATEGORIA AS categoria_nombre

    FROM evento

    LEFT JOIN categoria_evento
      ON evento.ID_CATEGORIA =
         categoria_evento.id_CATEGORIA_EVENTO

    ORDER BY
      evento.FECHA_EVENTO ASC,
      evento.HORA_INICIO ASC
  `;


  database.query(
    sql,
    (error, results) => {

      if (error) {

        console.error(
          "Error al consultar eventos:",
          error
        );

        return res.status(500).json({
          message:
            "Error al consultar los eventos"
        });
      }


      return res.json(results);
    }
  );
};


// ==========================================
// OBTENER EVENTO POR ID
// ==========================================

const getEventById = (req, res) => {

  const { id } = req.params;


  const sql = `
    SELECT
      evento.ID_EVENTO AS id,
      evento.NOMBRE_EVENTO AS titulo,
      evento.DESCRIPCION AS descripcion,
      evento.FECHA_EVENTO AS fecha,
      evento.HORA_INICIO AS hora,
      evento.HORA_FIN AS hora_fin,
      evento.LUGAR AS lugar,
      evento.ESTADO_EVENTO AS estado,
      evento.CUPOS_DISPONIBLES AS cupos_disponibles,
      evento.CUPO_ILIMITADO AS cupo_ilimitado,
      evento.ID_CATEGORIA AS categoria_id,
      categoria_evento.NOMBRE_CATEGORIA AS categoria_nombre

    FROM evento

    LEFT JOIN categoria_evento
      ON evento.ID_CATEGORIA =
         categoria_evento.id_CATEGORIA_EVENTO

    WHERE
      evento.ID_EVENTO = ?
  `;


  database.query(
    sql,
    [id],
    (error, results) => {

      if (error) {

        console.error(
          "Error al consultar evento:",
          error
        );

        return res.status(500).json({
          message:
            "Error al consultar el evento"
        });
      }


      if (results.length === 0) {

        return res.status(404).json({
          message:
            "Evento no encontrado"
        });
      }


      return res.json(
        results[0]
      );
    }
  );
};


// ==========================================
// CREAR EVENTO
// ==========================================

const createEvent = (req, res) => {

  const {
    titulo,
    descripcion,
    fecha,
    hora,
    hora_fin,
    lugar,
    cupos_disponibles,
    cupo_ilimitado = 0,
    categoria_id,
    estado = "ACTIVO"
  } = req.body;


  const esCupoIlimitado =
    Number(cupo_ilimitado) === 1;


  // ==========================================
  // VALIDAR CAMPOS OBLIGATORIOS
  // ==========================================

  if (!titulo) {

    return res.status(400).json({
      message:
        "El título del evento es obligatorio"
    });
  }


  if (!descripcion) {

    return res.status(400).json({
      message:
        "La descripción del evento es obligatoria"
    });
  }


  if (!fecha) {

    return res.status(400).json({
      message:
        "La fecha del evento es obligatoria"
    });
  }


  if (!hora) {

    return res.status(400).json({
      message:
        "La hora de inicio es obligatoria"
    });
  }


  if (!hora_fin) {

    return res.status(400).json({
      message:
        "La hora de finalización es obligatoria"
    });
  }


  if (!lugar) {

    return res.status(400).json({
      message:
        "El lugar del evento es obligatorio"
    });
  }


  if (!categoria_id) {

    return res.status(400).json({
      message:
        "Debes seleccionar una categoría"
    });
  }


  // ==========================================
  // VALIDAR FECHA
  // ==========================================

  const today =
    new Date()
      .toISOString()
      .split("T")[0];


  if (fecha < today) {

    return res.status(400).json({
      message:
        "La fecha del evento no puede ser anterior a hoy"
    });
  }


  // ==========================================
  // VALIDAR HORARIOS
  // ==========================================

  if (hora_fin <= hora) {

    return res.status(400).json({
      message:
        "La hora de finalización debe ser posterior a la hora de inicio"
    });
  }


  // ==========================================
  // VALIDAR CUPOS SI ES LIMITADO
  // ==========================================

  if (!esCupoIlimitado) {

    const cupos =
      Number(cupos_disponibles);


    if (
      !Number.isInteger(cupos) ||
      cupos <= 0
    ) {

      return res.status(400).json({
        message:
          "Los cupos deben ser un número mayor que cero"
      });
    }
  }


  // ==========================================
  // PREPARAR VALORES
  // ==========================================

  const cuposFinales =
    esCupoIlimitado
      ? 0
      : Number(cupos_disponibles);


  const cupoIlimitadoFinal =
    esCupoIlimitado
      ? 1
      : 0;


  const estadoFinal =
    String(
      estado || "ACTIVO"
    ).toUpperCase();


  // ==========================================
  // INSERTAR EVENTO
  // ==========================================

  const sql = `
    INSERT INTO evento
    (
      NOMBRE_EVENTO,
      DESCRIPCION,
      FECHA_EVENTO,
      HORA_INICIO,
      HORA_FIN,
      LUGAR,
      ESTADO_EVENTO,
      CUPOS_DISPONIBLES,
      CUPO_ILIMITADO,
      ID_CATEGORIA
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;


  database.query(
    sql,
    [
      titulo.trim(),
      descripcion.trim(),
      fecha,
      hora,
      hora_fin,
      lugar.trim(),
      estadoFinal,
      cuposFinales,
      cupoIlimitadoFinal,
      categoria_id
    ],
    (error, result) => {

      if (error) {

        console.error(
          "Error al crear evento:",
          error
        );

        return res.status(500).json({
          message:
            "Error al crear el evento"
        });
      }


      return res.status(201).json({

        message:
          "Evento creado correctamente",

        eventId:
          result.insertId
      });
    }
  );
};


// ==========================================
// ACTUALIZAR EVENTO
// ==========================================

const updateEvent = (req, res) => {

  const { id } = req.params;


  const {
    titulo,
    descripcion,
    fecha,
    hora,
    hora_fin,
    lugar,
    cupos_disponibles,
    cupo_ilimitado = 0,
    categoria_id,
    estado = "ACTIVO"
  } = req.body;


  const esCupoIlimitado =
    Number(cupo_ilimitado) === 1;


  // ==========================================
  // VALIDAR CAMPOS
  // ==========================================

  if (!titulo) {

    return res.status(400).json({
      message:
        "El título del evento es obligatorio"
    });
  }


  if (!descripcion) {

    return res.status(400).json({
      message:
        "La descripción del evento es obligatoria"
    });
  }


  if (!fecha) {

    return res.status(400).json({
      message:
        "La fecha del evento es obligatoria"
    });
  }


  if (!hora) {

    return res.status(400).json({
      message:
        "La hora de inicio es obligatoria"
    });
  }


  if (!hora_fin) {

    return res.status(400).json({
      message:
        "La hora de finalización es obligatoria"
    });
  }


  if (!lugar) {

    return res.status(400).json({
      message:
        "El lugar del evento es obligatorio"
    });
  }


  if (!categoria_id) {

    return res.status(400).json({
      message:
        "Debes seleccionar una categoría"
    });
  }


  // ==========================================
  // VALIDAR HORARIOS
  // ==========================================

  if (hora_fin <= hora) {

    return res.status(400).json({
      message:
        "La hora de finalización debe ser posterior a la hora de inicio"
    });
  }


  // ==========================================
  // VALIDAR CUPOS SI ES LIMITADO
  // ==========================================

  if (!esCupoIlimitado) {

    const cupos =
      Number(cupos_disponibles);


    if (
      !Number.isInteger(cupos) ||
      cupos <= 0
    ) {

      return res.status(400).json({
        message:
          "Los cupos deben ser un número mayor que cero"
      });
    }
  }


  // ==========================================
  // PREPARAR VALORES
  // ==========================================

  const cuposFinales =
    esCupoIlimitado
      ? 0
      : Number(cupos_disponibles);


  const cupoIlimitadoFinal =
    esCupoIlimitado
      ? 1
      : 0;


  const estadoFinal =
    String(
      estado || "ACTIVO"
    ).toUpperCase();


  // ==========================================
  // ACTUALIZAR EVENTO
  // ==========================================

  const sql = `
    UPDATE evento

    SET
      NOMBRE_EVENTO = ?,
      DESCRIPCION = ?,
      FECHA_EVENTO = ?,
      HORA_INICIO = ?,
      HORA_FIN = ?,
      LUGAR = ?,
      ESTADO_EVENTO = ?,
      CUPOS_DISPONIBLES = ?,
      CUPO_ILIMITADO = ?,
      ID_CATEGORIA = ?

    WHERE
      ID_EVENTO = ?
  `;


  database.query(
    sql,
    [
      titulo.trim(),
      descripcion.trim(),
      fecha,
      hora,
      hora_fin,
      lugar.trim(),
      estadoFinal,
      cuposFinales,
      cupoIlimitadoFinal,
      categoria_id,
      id
    ],
    (error, result) => {

      if (error) {

        console.error(
          "Error al actualizar evento:",
          error
        );

        return res.status(500).json({
          message:
            "Error al actualizar el evento"
        });
      }


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({
          message:
            "Evento no encontrado"
        });
      }


      return res.json({
        message:
          "Evento actualizado correctamente"
      });
    }
  );
};


// ==========================================
// ELIMINAR EVENTO
// ==========================================

const deleteEvent = (req, res) => {

  const { id } = req.params;


  const sql = `
    DELETE FROM evento
    WHERE ID_EVENTO = ?
  `;


  database.query(
    sql,
    [id],
    (error, result) => {

      if (error) {

        console.error(
          "Error al eliminar evento:",
          error
        );


        return res.status(500).json({
          message:
            "No se puede eliminar el evento. Puede tener inscripciones relacionadas."
        });
      }


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({
          message:
            "Evento no encontrado"
        });
      }


      return res.json({
        message:
          "Evento eliminado correctamente"
      });
    }
  );
};


// ==========================================
// EXPORTAR FUNCIONES
// ==========================================

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};