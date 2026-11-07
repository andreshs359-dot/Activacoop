const database = require("../config/database");

// ==========================================
// CREAR INSCRIPCIÓN
// ==========================================

const createRegistration = async (req, res) => {
  const connection =
    await database.promise().getConnection();

  try {
    const userId = req.user.id;

    const {
      evento_id,
      cantidad_acompanantes = 0,
      acompanantes = []
    } = req.body;

    if (!evento_id) {
      connection.release();

      return res.status(400).json({
        message: "El evento es obligatorio"
      });
    }

    const cantidadAcompanantes =
      Number(cantidad_acompanantes);

    if (
      cantidadAcompanantes < 0 ||
      cantidadAcompanantes > 2
    ) {
      connection.release();

      return res.status(400).json({
        message:
          "Puedes registrar máximo 2 acompañantes"
      });
    }

    if (
      cantidadAcompanantes !== acompanantes.length
    ) {
      connection.release();

      return res.status(400).json({
        message:
          "La cantidad de acompañantes no coincide con los datos enviados"
      });
    }

    await connection.beginTransaction();

    // ==========================================
    // VERIFICAR DOBLE INSCRIPCIÓN
    // ==========================================

    const [existingRegistration] =
      await connection.query(
        `
        SELECT ID_INSCRIPCION
        FROM inscripcion
        WHERE ID_USUARIO = ?
        AND ID_EVENTO = ?
        `,
        [userId, evento_id]
      );

    if (existingRegistration.length > 0) {
      await connection.rollback();
      connection.release();

      return res.status(400).json({
        message:
          "Ya estás inscrito en este evento"
      });
    }

    // ==========================================
    // CONSULTAR EVENTO
    // ==========================================

    const [events] =
      await connection.query(
        `
        SELECT
  ID_EVENTO,
  CUPOS_DISPONIBLES,
  CUPO_ILIMITADO
FROM evento
WHERE ID_EVENTO = ?
FOR UPDATE
        `,
        [evento_id]
      );

    if (events.length === 0) {
      await connection.rollback();
      connection.release();

      return res.status(404).json({
        message: "El evento no existe"
      });
    }

    const event = events[0];

    const cuposNecesarios =
  1 + cantidadAcompanantes;

const esCupoIlimitado =
  Number(event.CUPO_ILIMITADO) === 1;

if (
  !esCupoIlimitado &&
  event.CUPOS_DISPONIBLES < cuposNecesarios
) {
  await connection.rollback();
  connection.release();

  return res.status(400).json({
    message:
      "No hay suficientes cupos disponibles"
  });
}

    // ==========================================
    // VALIDAR ACOMPAÑANTES
    // ==========================================

    for (const acompanante of acompanantes) {
      if (
        !acompanante.numero_documento ||
        !acompanante.nombres ||
        !acompanante.edad ||
        !acompanante.parentesco
      ) {
        await connection.rollback();
        connection.release();

        return res.status(400).json({
          message:
            "Todos los datos obligatorios de los acompañantes deben estar completos"
        });
      }

      if (Number(acompanante.edad) < 15) {
        await connection.rollback();
        connection.release();

        return res.status(400).json({
          message:
            "Los acompañantes deben tener mínimo 15 años"
        });
      }
    }

    // ==========================================
    // CREAR INSCRIPCIÓN
    // ==========================================

    const [registrationResult] =
      await connection.query(
        `
        INSERT INTO inscripcion
        (
          FECHA_INSCRIPCION,
          ESTADO_INSCRIPCION,
          ACOMPAÑANTES,
          ID_USUARIO,
          ID_EVENTO
        )
        VALUES
        (
          CURDATE(),
          'ACTIVA',
          ?,
          ?,
          ?
        )
        `,
        [
          String(cantidadAcompanantes),
          userId,
          evento_id
        ]
      );

    const registrationId =
      registrationResult.insertId;

    // ==========================================
    // GUARDAR ACOMPAÑANTES
    // ==========================================

    for (const acompanante of acompanantes) {
      await connection.query(
        `
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
        `,
        [
          acompanante.numero_documento,
          acompanante.nombres,
          acompanante.apellidos || null,
          acompanante.edad,
          acompanante.parentesco,
          registrationId
        ]
      );
    }

    // ==========================================
    // DESCONTAR CUPOS
    // ==========================================

    if (!esCupoIlimitado) {
  await connection.query(
    `
    UPDATE evento
    SET CUPOS_DISPONIBLES =
        CUPOS_DISPONIBLES - ?
    WHERE ID_EVENTO = ?
    `,
    [
      cuposNecesarios,
      evento_id
    ]
  );
}
    await connection.commit();
    connection.release();

    return res.status(201).json({
      message:
        "Inscripción realizada correctamente",

      id: registrationId,

      cantidad_acompanantes:
        cantidadAcompanantes,

      cupos_utilizados:
        cuposNecesarios
    });

  } catch (error) {
    await connection.rollback();
    connection.release();

    console.error(
      "Error al crear inscripción:",
      error
    );

    return res.status(500).json({
      message:
        "Error interno al realizar la inscripción"
    });
  }
};


// ==========================================
// OBTENER MIS INSCRIPCIONES
// ==========================================

const getMyRegistrations = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT

      i.ID_INSCRIPCION
        AS inscripcion_id,

      i.FECHA_INSCRIPCION
        AS fecha_inscripcion,

      i.ESTADO_INSCRIPCION
        AS estado,

      i.ACOMPAÑANTES
        AS acompanantes,

      e.ID_EVENTO
        AS evento_id,

      e.NOMBRE_EVENTO
        AS titulo,

      e.DESCRIPCION
        AS descripcion,

      e.FECHA_EVENTO
        AS fecha,

      e.HORA_INICIO
        AS hora,

      e.LUGAR
        AS lugar

    FROM inscripcion i

    INNER JOIN evento e
      ON i.ID_EVENTO = e.ID_EVENTO

    WHERE i.ID_USUARIO = ?

    ORDER BY e.FECHA_EVENTO ASC
  `;

  database.query(
    sql,
    [userId],
    async (error, results) => {

      if (error) {
        console.error(
          "Error al consultar las inscripciones:",
          error
        );

        return res.status(500).json({
          message:
            "Error al consultar las inscripciones"
        });
      }

      try {
        for (const registration of results) {

          const [companions] =
            await database.promise().query(
              `
              SELECT
                ID_ACOMPANANTE
                  AS id,

                NUMERO_DOCUMENTO
                  AS numero_documento,

                NOMBRES
                  AS nombres,

                APELLIDOS
                  AS apellidos,

                EDAD
                  AS edad,

                PARENTESCO
                  AS parentesco

              FROM acompanante

              WHERE
                INSCRIPCION_ID_INSCRIPCION = ?

              ORDER BY
                ID_ACOMPANANTE ASC
              `,
              [
                registration.inscripcion_id
              ]
            );

          registration.lista_acompanantes =
            companions;
        }

        return res.json(results);

      } catch (error) {
        console.error(
          "Error al consultar acompañantes:",
          error
        );

        return res.status(500).json({
          message:
            "Error al consultar los acompañantes"
        });
      }
    }
  );
};


// ==========================================
// CANCELAR INSCRIPCIÓN
// ==========================================

const cancelRegistration = async (req, res) => {
  const connection =
    await database.promise().getConnection();

  try {
    const registrationId =
      req.params.id;

    await connection.beginTransaction();

    // =====================================================
    // BUSCAR INSCRIPCIÓN Y EVENTO
    // =====================================================

    const [registrations] =
      await connection.query(
        `
        SELECT
          i.ID_INSCRIPCION,
          i.ID_EVENTO,
          i.ESTADO_INSCRIPCION,
          i.ACOMPAÑANTES,
          e.CUPO_ILIMITADO

        FROM inscripcion i

        INNER JOIN evento e
          ON i.ID_EVENTO = e.ID_EVENTO

        WHERE i.ID_INSCRIPCION = ?

        FOR UPDATE
        `,
        [
          registrationId
        ]
      );


    if (registrations.length === 0) {

      await connection.rollback();

      return res.status(404).json({
        message:
          "Inscripción no encontrada"
      });
    }


    const registration =
      registrations[0];


    // =====================================================
    // CALCULAR CUPOS
    // =====================================================

    const cantidadAcompanantes =
      Number(
        registration.ACOMPAÑANTES || 0
      );


    const cuposADevolver =
      1 + cantidadAcompanantes;


    const esCupoIlimitado =
      Number(
        registration.CUPO_ILIMITADO
      ) === 1;


    // =====================================================
    // ELIMINAR ASISTENCIA
    // =====================================================

    await connection.query(
      `
      DELETE FROM asistencia
      WHERE INSCRIPCION_ID_INSCRIPCION = ?
      `,
      [
        registrationId
      ]
    );


    // =====================================================
    // ELIMINAR ACOMPAÑANTES
    // =====================================================

    await connection.query(
      `
      DELETE FROM acompanante
      WHERE INSCRIPCION_ID_INSCRIPCION = ?
      `,
      [
        registrationId
      ]
    );


    // =====================================================
    // ELIMINAR INSCRIPCIÓN
    // =====================================================

    await connection.query(
      `
      DELETE FROM inscripcion
      WHERE ID_INSCRIPCION = ?
      `,
      [
        registrationId
      ]
    );


    // =====================================================
    // DEVOLVER CUPOS SOLO SI EL EVENTO ES LIMITADO
    // =====================================================

    if (!esCupoIlimitado) {

      await connection.query(
        `
        UPDATE evento

        SET CUPOS_DISPONIBLES =
          CUPOS_DISPONIBLES + ?

        WHERE ID_EVENTO = ?
        `,
        [
          cuposADevolver,
          registration.ID_EVENTO
        ]
      );
    }


    // =====================================================
    // CONFIRMAR CAMBIOS
    // =====================================================

    await connection.commit();


    return res.json({
      message:
        "Inscripción eliminada correctamente"
    });


  } catch (error) {

    await connection.rollback();

    console.error(
      "Error al eliminar inscripción:",
      error
    );


    return res.status(500).json({
      message:
        "Error interno al eliminar la inscripción"
    });


  } finally {

    connection.release();
  }
};


// ==========================================
// OBTENER PARTICIPANTES DE UN EVENTO
// ==========================================

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
      ON a.INSCRIPCION_ID_INSCRIPCION =
         i.ID_INSCRIPCION

    WHERE i.ID_EVENTO = ?

    ORDER BY
      u.NOMBRES ASC,
      u.APELLIDOS ASC
  `;

  database.query(
    sql,
    [eventoId],
    async (error, results) => {

      if (error) {
        console.error(
          "Error al consultar participantes:",
          error
        );

        return res.status(500).json({
          message:
            "Error al consultar participantes"
        });
      }

      try {

        const participantsWithCompanions =
          await Promise.all(

            results.map(
              async (participant) => {

                const companionsSql = `
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
                `;

                const [companions] =
                  await database
                    .promise()
                    .query(
                      companionsSql,
                      [
                        participant.inscripcion_id
                      ]
                    );

                return {
                  ...participant,
                  lista_acompanantes:
                    companions
                };
              }
            )
          );

        return res.json(
          participantsWithCompanions
        );

      } catch (companionsError) {

        console.error(
          "Error al consultar acompañantes:",
          companionsError
        );

        return res.status(500).json({
          message:
            "Error al consultar los acompañantes"
        });
      }
    }
  );
};
// ==========================================
// ACTUALIZAR ASISTENCIA
// ==========================================

const updateAttendance = (req, res) => {
  const { id } = req.params;

  const {
    asistencia
  } = req.body;

  const validStatuses = [
    "pendiente",
    "asistio",
    "no_asistio"
  ];

  if (
    !validStatuses.includes(
      asistencia
    )
  ) {
    return res.status(400).json({
      message:
        "Estado de asistencia inválido"
    });
  }

  /*
    IMPORTANTE:
    La asistencia está guardada en una tabla aparte
    llamada asistencia.
  */

  const asistio =
    asistencia === "asistio"
      ? 1
      : 0;

  const sqlCheck = `
    SELECT ID_ASISTENCIA
    FROM asistencia
    WHERE INSCRIPCION_ID_INSCRIPCION = ?
  `;

  database.query(
    sqlCheck,
    [id],
    (error, results) => {

      if (error) {
        console.error(
          "Error al consultar asistencia:",
          error
        );

        return res.status(500).json({
          message:
            "Error al consultar asistencia"
        });
      }

      // Si ya existe un registro
      if (results.length > 0) {

        const sqlUpdate = `
          UPDATE asistencia

          SET
            ASISTIO = ?,
            FECHA_CONTROL = CURDATE()

          WHERE
            INSCRIPCION_ID_INSCRIPCION = ?
        `;

        database.query(
          sqlUpdate,
          [
            asistio,
            id
          ],
          (error) => {

            if (error) {
              console.error(
                "Error al actualizar asistencia:",
                error
              );

              return res.status(500).json({
                message:
                  "Error al actualizar asistencia"
              });
            }

            return res.json({
              message:
                "Asistencia actualizada correctamente"
            });
          }
        );

        return;
      }

      // Si todavía no existe
      const sqlInsert = `
        INSERT INTO asistencia
        (
          FECHA_CONTROL,
          ASISTIO,
          INSCRIPCION_ID_INSCRIPCION
        )
        VALUES
        (
          CURDATE(),
          ?,
          ?
        )
      `;

      database.query(
        sqlInsert,
        [
          asistio,
          id
        ],
        (error) => {

          if (error) {
            console.error(
              "Error al registrar asistencia:",
              error
            );

            return res.status(500).json({
              message:
                "Error al registrar asistencia"
            });
          }

          return res.json({
            message:
              "Asistencia actualizada correctamente"
          });
        }
      );
    }
  );
};


// ==========================================
// EXPORTAR FUNCIONES
// ==========================================

module.exports = {
  createRegistration,
  getMyRegistrations,
  cancelRegistration,
  getEventParticipants,
  updateAttendance
};