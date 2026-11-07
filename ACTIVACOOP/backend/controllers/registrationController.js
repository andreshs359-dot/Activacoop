
const database = require("../config/database");

// ==================================================
// 1. CREAR INSCRIPCIÓN
// ==================================================

const createRegistration = async (req, res) => {
  let connection;
  let transactionStarted = false;

  try {
    connection = await database.promise().getConnection();

    const userId = req.user.id;
    const {
      evento_id,
      cantidad_acompanantes = 0,
      acompanantes = []
    } = req.body;

    const eventoId = Number(evento_id);
    const cantidadAcompanantes = Number(cantidad_acompanantes);

    // Validar evento y acompañantes.
    if (!Number.isInteger(eventoId) || eventoId <= 0) {
      return res.status(400).json({
        message: "El evento es obligatorio"
      });
    }

    if (
      !Array.isArray(acompanantes) ||
      !Number.isInteger(cantidadAcompanantes) ||
      cantidadAcompanantes < 0 ||
      cantidadAcompanantes !== acompanantes.length
    ) {
      return res.status(400).json({
        message: "La cantidad de acompañantes no coincide con los datos enviados"
      });
    }

    await connection.beginTransaction();
    transactionStarted = true;

    // Consultar evento y bloquear sus cupos.
    const [events] = await connection.query(`
      SELECT ID_EVENTO, CUPOS_DISPONIBLES, CUPO_ILIMITADO
      FROM evento
      WHERE ID_EVENTO = ?
      FOR UPDATE
    `, [eventoId]);

    if (events.length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(404).json({
        message: "El evento no existe"
      });
    }

    // Evitar doble inscripción.
    const [existingRegistration] = await connection.query(`
      SELECT ID_INSCRIPCION
      FROM inscripcion
      WHERE ID_USUARIO = ? AND ID_EVENTO = ?
      LIMIT 1
    `, [userId, eventoId]);

    if (existingRegistration.length > 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        message: "Ya estás inscrito en este evento"
      });
    }

    // Consultar tarifas generales.
    const [configuraciones] = await connection.query(`
      SELECT
        VALOR_ASOCIADO,
        VALOR_ACOMPANANTE,
        MAX_ACOMPANANTES,
        NUMERO_CUOTAS
      FROM configuracion_cobro_evento
      WHERE ID_EVENTO = ?
      LIMIT 1
    `, [eventoId]);

    if (configuraciones.length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        message: "El administrador aún no ha configurado los cobros de este evento"
      });
    }

    const configuracion = configuraciones[0];

    // Consultar beneficios especiales del asociado.
    const [beneficios] = await connection.query(`
      SELECT VALOR_ASOCIADO, MAX_ACOMPANANTES_EXCEPCION
      FROM beneficio_asociado_evento
      WHERE ID_EVENTO = ? AND ID_USUARIO = ?
      LIMIT 1
    `, [eventoId, userId]);

    const beneficio = beneficios[0] || null;

    const maximoPermitido =
      beneficio?.MAX_ACOMPANANTES_EXCEPCION != null
        ? Number(beneficio.MAX_ACOMPANANTES_EXCEPCION)
        : Number(configuracion.MAX_ACOMPANANTES);

    if (
      !Number.isInteger(maximoPermitido) ||
      maximoPermitido < 0 ||
      cantidadAcompanantes > maximoPermitido
    ) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        message: `Puedes registrar máximo ${maximoPermitido} acompañantes`
      });
    }

    const valorAsociado =
      beneficio?.VALOR_ASOCIADO != null
        ? Number(beneficio.VALOR_ASOCIADO)
        : Number(configuracion.VALOR_ASOCIADO);

    const valorPorAcompanante =
      Number(configuracion.VALOR_ACOMPANANTE);

    const numeroCuotas =
      Number(configuracion.NUMERO_CUOTAS);

    if (
      ![valorAsociado, valorPorAcompanante].every(
        valor => Number.isFinite(valor) && valor >= 0
      ) ||
      !Number.isInteger(numeroCuotas) ||
      numeroCuotas < 1
    ) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        message: "La configuración de cobro no es válida"
      });
    }

    // Consultar las fechas configuradas por el administrador.
    const [cuotasEvento] = await connection.query(`
      SELECT ID_CUOTA_EVENTO, NUMERO_CUOTA, FECHA_COBRO
      FROM cuota_evento
      WHERE ID_EVENTO = ?
      ORDER BY NUMERO_CUOTA ASC
    `, [eventoId]);

    const cuotasCorrectas =
      cuotasEvento.length === numeroCuotas &&
      cuotasEvento.every(
        (cuota, indice) =>
          Number(cuota.NUMERO_CUOTA) === indice + 1 &&
          cuota.FECHA_COBRO != null
      );

    if (!cuotasCorrectas) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        message: "El administrador debe configurar correctamente las fechas de todas las cuotas"
      });
    }

    // Validar disponibilidad de cupos.
    const cuposNecesarios = 1 + cantidadAcompanantes;
    const esCupoIlimitado =
      Number(events[0].CUPO_ILIMITADO) === 1;

    if (
      !esCupoIlimitado &&
      Number(events[0].CUPOS_DISPONIBLES) < cuposNecesarios
    ) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        message: "No hay suficientes cupos disponibles"
      });
    }

    // Validar información de acompañantes.
    const documentos = new Set();

    for (const acompanante of acompanantes) {
      if (
        !acompanante ||
        !String(acompanante.numero_documento || "").trim() ||
        !String(acompanante.nombres || "").trim() ||
        !String(acompanante.parentesco || "").trim() ||
        !Number.isInteger(Number(acompanante.edad)) ||
        Number(acompanante.edad) < 15
      ) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(400).json({
          message: "Revisa los datos de los acompañantes; la edad mínima es 15 años"
        });
      }

      const documento =
        String(acompanante.numero_documento).trim();

      if (documentos.has(documento)) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(400).json({
          message: "Los acompañantes no pueden tener el mismo documento"
        });
      }

      documentos.add(documento);
    }

    // Guardar inscripción.
    const [registrationResult] = await connection.query(`
      INSERT INTO inscripcion
        (
          FECHA_INSCRIPCION,
          ESTADO_INSCRIPCION,
          ACOMPAÑANTES,
          ID_USUARIO,
          ID_EVENTO
        )
      VALUES (CURDATE(), 'ACTIVA', ?, ?, ?)
    `, [
      String(cantidadAcompanantes),
      userId,
      eventoId
    ]);

    const registrationId = registrationResult.insertId;

    // Guardar acompañantes.
    for (const acompanante of acompanantes) {
      await connection.query(`
        INSERT INTO acompanante
          (
            NUMERO_DOCUMENTO,
            NOMBRES,
            APELLIDOS,
            EDAD,
            PARENTESCO,
            INSCRIPCION_ID_INSCRIPCION
          )
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        String(acompanante.numero_documento).trim(),
        String(acompanante.nombres).trim(),
        acompanante.apellidos || null,
        Number(acompanante.edad),
        String(acompanante.parentesco).trim(),
        registrationId
      ]);
    }

    // Calcular valores económicos.
    const valorAcompanantes =
      valorPorAcompanante * cantidadAcompanantes;

    const valorTotal =
      valorAsociado + valorAcompanantes;

    // Guardar detalle de cobro.
    await connection.query(`
      INSERT INTO detalle_cobro_inscripcion
        (
          ID_INSCRIPCION,
          VALOR_ASOCIADO,
          VALOR_ACOMPANANTES,
          VALOR_TOTAL,
          NUMERO_CUOTAS
        )
      VALUES (?, ?, ?, ?, ?)
    `, [
      registrationId,
      valorAsociado,
      valorAcompanantes,
      valorTotal,
      numeroCuotas
    ]);

    // ==============================================
    // NUEVO: GENERAR CUOTAS AUTOMÁTICAMENTE
    // ==============================================

    const totalCentavos = Math.round(valorTotal * 100);
    const cuotaBase = Math.floor(totalCentavos / numeroCuotas);
    const sobrante = totalCentavos % numeroCuotas;

    for (let indice = 0; indice < cuotasEvento.length; indice++) {
      const cuotaEvento = cuotasEvento[indice];

      const centavosCuota =
        cuotaBase + (indice < sobrante ? 1 : 0);

      const valorCuota =
        (centavosCuota / 100).toFixed(2);

      const [resultadoCuota] = await connection.query(`
        INSERT INTO cuota_inscripcion
          (
            ID_INSCRIPCION,
            NUMERO_CUOTA,
            FECHA_COBRO,
            VALOR_CUOTA,
            ESTADO_CUOTA
          )
        SELECT
          ?,
          NUMERO_CUOTA,
          FECHA_COBRO,
          ?,
          'PENDIENTE'
        FROM cuota_evento
        WHERE ID_CUOTA_EVENTO = ?
          AND ID_EVENTO = ?
      `, [
        registrationId,
        valorCuota,
        cuotaEvento.ID_CUOTA_EVENTO,
        eventoId
      ]);

      if (resultadoCuota.affectedRows !== 1) {
        throw new Error("No se pudo generar una cuota de la inscripción");
      }
    }

    // Descontar cupos.
    if (!esCupoIlimitado) {
      await connection.query(`
        UPDATE evento
        SET CUPOS_DISPONIBLES = CUPOS_DISPONIBLES - ?
        WHERE ID_EVENTO = ?
      `, [cuposNecesarios, eventoId]);
    }

    // Confirmar todas las operaciones.
    await connection.commit();
    transactionStarted = false;

    return res.status(201).json({
      message: "Inscripción realizada correctamente",
      id: registrationId,
      cantidad_acompanantes: cantidadAcompanantes,
      cupos_utilizados: cuposNecesarios,
      valor_asociado: valorAsociado,
      valor_acompanantes: valorAcompanantes,
      valor_total: valorTotal,
      numero_cuotas: numeroCuotas,
      cuotas_generadas: cuotasEvento.length
    });

  } catch (error) {
    if (transactionStarted && connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Error al revertir la inscripción:", rollbackError);
      }
    }

    console.error("Error al crear inscripción:", error);

    return res.status(500).json({
      message: "Error interno al realizar la inscripción"
    });

  } finally {
    if (connection) connection.release();
  }
};

// ==================================================
// 2. OBTENER MIS INSCRIPCIONES
// ==================================================

const getMyRegistrations = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT
      i.ID_INSCRIPCION AS inscripcion_id,
      i.FECHA_INSCRIPCION AS fecha_inscripcion,
      i.ESTADO_INSCRIPCION AS estado,
      i.ACOMPAÑANTES AS acompanantes,
      e.ID_EVENTO AS evento_id,
      e.NOMBRE_EVENTO AS titulo,
      e.DESCRIPCION AS descripcion,
      e.FECHA_EVENTO AS fecha,
      e.HORA_INICIO AS hora,
      e.LUGAR AS lugar
    FROM inscripcion i
    INNER JOIN evento e
      ON i.ID_EVENTO = e.ID_EVENTO
    WHERE i.ID_USUARIO = ?
    ORDER BY e.FECHA_EVENTO ASC
  `;

  database.query(sql, [userId], async (error, results) => {
    if (error) {
      console.error("Error al consultar las inscripciones:", error);

      return res.status(500).json({
        message: "Error al consultar las inscripciones"
      });
    }

    try {
      for (const registration of results) {
        const [companions] = await database.promise().query(`
          SELECT
            ID_ACOMPANANTE AS id,
            NUMERO_DOCUMENTO AS numero_documento,
            NOMBRES AS nombres,
            APELLIDOS AS apellidos,
            EDAD AS edad,
            PARENTESCO AS parentesco
          FROM acompanante
          WHERE INSCRIPCION_ID_INSCRIPCION = ?
          ORDER BY ID_ACOMPANANTE ASC
        `, [registration.inscripcion_id]);

        registration.lista_acompanantes = companions;
      }

      return res.json(results);

    } catch (error) {
      console.error("Error al consultar acompañantes:", error);

      return res.status(500).json({
        message: "Error al consultar los acompañantes"
      });
    }
  });
};

// ==================================================
// 3. CANCELAR INSCRIPCIÓN
// ==================================================

const cancelRegistration = async (req, res) => {
  let connection;
  let transactionStarted = false;

  try {
    connection = await database.promise().getConnection();

    const registrationId = Number(req.params.id);

    if (!Number.isInteger(registrationId) || registrationId <= 0) {
      return res.status(400).json({
        message: "Identificador de inscripción inválido"
      });
    }

    await connection.beginTransaction();
    transactionStarted = true;

    // Consultar inscripción y evento.
    const [registrations] = await connection.query(`
      SELECT
        i.ID_INSCRIPCION,
        i.ID_EVENTO,
        i.ID_USUARIO,
        i.ESTADO_INSCRIPCION,
        i.ACOMPAÑANTES,
        e.CUPO_ILIMITADO
      FROM inscripcion i
      INNER JOIN evento e
        ON i.ID_EVENTO = e.ID_EVENTO
      WHERE i.ID_INSCRIPCION = ?
      FOR UPDATE
    `, [registrationId]);

    if (registrations.length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(404).json({
        message: "Inscripción no encontrada"
      });
    }

    const registration = registrations[0];

    // Un asociado solo puede cancelar su inscripción.
    // Los administradores también pueden realizar esta acción.
    const esAdministrador =
      String(req.user?.rol || req.user?.role || "").toLowerCase() === "admin" ||
      String(req.user?.rol || req.user?.role || "").toLowerCase() === "administrador";

    if (
      req.user &&
      !esAdministrador &&
      Number(registration.ID_USUARIO) !== Number(req.user.id)
    ) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(403).json({
        message: "No tienes permiso para cancelar esta inscripción"
      });
    }

    const cantidadAcompanantes =
      Number(registration.ACOMPAÑANTES || 0);

    const cuposADevolver = 1 + cantidadAcompanantes;

    const esCupoIlimitado =
      Number(registration.CUPO_ILIMITADO) === 1;

    // Eliminar asistencia.
    await connection.query(`
      DELETE FROM asistencia
      WHERE INSCRIPCION_ID_INSCRIPCION = ?
    `, [registrationId]);

    // Eliminar acompañantes.
    await connection.query(`
      DELETE FROM acompanante
      WHERE INSCRIPCION_ID_INSCRIPCION = ?
    `, [registrationId]);

    // ==============================================
    // NUEVO: ELIMINAR CUOTAS DE LA INSCRIPCIÓN
    // ==============================================

    await connection.query(`
      DELETE FROM cuota_inscripcion
      WHERE ID_INSCRIPCION = ?
    `, [registrationId]);

    // Eliminar detalle económico.
    await connection.query(`
      DELETE FROM detalle_cobro_inscripcion
      WHERE ID_INSCRIPCION = ?
    `, [registrationId]);

    // Eliminar inscripción.
    await connection.query(`
      DELETE FROM inscripcion
      WHERE ID_INSCRIPCION = ?
    `, [registrationId]);

    // Devolver cupos si el evento es limitado.
    if (!esCupoIlimitado) {
      await connection.query(`
        UPDATE evento
        SET CUPOS_DISPONIBLES = CUPOS_DISPONIBLES + ?
        WHERE ID_EVENTO = ?
      `, [
        cuposADevolver,
        registration.ID_EVENTO
      ]);
    }

    await connection.commit();
    transactionStarted = false;

    return res.json({
      message: "Inscripción eliminada correctamente"
    });

  } catch (error) {
    if (transactionStarted && connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Error al revertir la cancelación:", rollbackError);
      }
    }

    console.error("Error al eliminar inscripción:", error);

    return res.status(500).json({
      message: "Error interno al eliminar la inscripción"
    });

  } finally {
    if (connection) connection.release();
  }
};

// ==================================================
// 4. OBTENER PARTICIPANTES DE UN EVENTO
// ==================================================

const getEventParticipants = (req, res) => {
  const { eventoId } = req.params;

  const sql = `
    SELECT
      i.ID_INSCRIPCION AS inscripcion_id,
      u.ID_USUARIO AS usuario_id,
      u.NUMERO_DOCUMENTO AS numero_documento,
      u.NOMBRES AS nombres,
      u.APELLIDOS AS apellidos,
      u.CORREO AS correo,
      i.FECHA_INSCRIPCION AS fecha_inscripcion,
      i.ESTADO_INSCRIPCION AS estado,
      i.ACOMPAÑANTES AS acompanantes,
      CASE
        WHEN a.ASISTIO = 1 THEN 'asistio'
        ELSE 'pendiente'
      END AS asistencia
    FROM inscripcion i
    INNER JOIN usuario u
      ON i.ID_USUARIO = u.ID_USUARIO
    LEFT JOIN asistencia a
      ON a.INSCRIPCION_ID_INSCRIPCION = i.ID_INSCRIPCION
    WHERE i.ID_EVENTO = ?
    ORDER BY u.NOMBRES ASC, u.APELLIDOS ASC
  `;

  database.query(sql, [eventoId], async (error, results) => {
    if (error) {
      console.error("Error al consultar participantes:", error);

      return res.status(500).json({
        message: "Error al consultar participantes"
      });
    }

    try {
      const participantsWithCompanions = await Promise.all(
        results.map(async (participant) => {
          const [companions] = await database.promise().query(`
            SELECT
              ID_ACOMPANANTE AS id,
              NUMERO_DOCUMENTO AS numero_documento,
              NOMBRES AS nombres,
              APELLIDOS AS apellidos,
              EDAD AS edad,
              PARENTESCO AS parentesco
            FROM acompanante
            WHERE INSCRIPCION_ID_INSCRIPCION = ?
            ORDER BY ID_ACOMPANANTE ASC
          `, [participant.inscripcion_id]);

          return {
            ...participant,
            lista_acompanantes: companions
          };
        })
      );

      return res.json(participantsWithCompanions);

    } catch (error) {
      console.error("Error al consultar acompañantes:", error);

      return res.status(500).json({
        message: "Error al consultar los acompañantes"
      });
    }
  });
};

// ==================================================
// 5. ACTUALIZAR ASISTENCIA
// ==================================================

const updateAttendance = (req, res) => {
  const { id } = req.params;
  const { asistencia } = req.body;

  const validStatuses = [
    "pendiente",
    "asistio",
    "no_asistio"
  ];

  if (!validStatuses.includes(asistencia)) {
    return res.status(400).json({
      message: "Estado de asistencia inválido"
    });
  }

  const asistio = asistencia === "asistio" ? 1 : 0;

  const sqlCheck = `
    SELECT ID_ASISTENCIA
    FROM asistencia
    WHERE INSCRIPCION_ID_INSCRIPCION = ?
  `;

  database.query(sqlCheck, [id], (error, results) => {
    if (error) {
      console.error("Error al consultar asistencia:", error);

      return res.status(500).json({
        message: "Error al consultar asistencia"
      });
    }

    if (results.length > 0) {
      const sqlUpdate = `
        UPDATE asistencia
        SET ASISTIO = ?, FECHA_CONTROL = CURDATE()
        WHERE INSCRIPCION_ID_INSCRIPCION = ?
      `;

      database.query(sqlUpdate, [asistio, id], (error) => {
        if (error) {
          console.error("Error al actualizar asistencia:", error);

          return res.status(500).json({
            message: "Error al actualizar asistencia"
          });
        }

        return res.json({
          message: "Asistencia actualizada correctamente"
        });
      });

      return;
    }

    const sqlInsert = `
      INSERT INTO asistencia
        (FECHA_CONTROL, ASISTIO, INSCRIPCION_ID_INSCRIPCION)
      VALUES (CURDATE(), ?, ?)
    `;

    database.query(sqlInsert, [asistio, id], (error) => {
      if (error) {
        console.error("Error al registrar asistencia:", error);

        return res.status(500).json({
          message: "Error al registrar asistencia"
        });
      }

      return res.json({
        message: "Asistencia actualizada correctamente"
      });
    });
  });
};

// ==================================================
// 6. EXPORTAR FUNCIONES
// ==================================================

module.exports = {
  createRegistration,
  getMyRegistrations,
  cancelRegistration,
  getEventParticipants,
  updateAttendance
};
