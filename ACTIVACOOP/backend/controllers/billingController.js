// ==========================================
// CONTROLADOR DE COBROS
// ==========================================

const database = require("../config/database");


// ==========================================
// OBTENER CONFIGURACIÓN DE COBRO DEL EVENTO
// ==========================================

const getBillingConfig = (req, res) => {

  const { eventoId } = req.params;

  const sql = `
    SELECT
      ID_CONFIGURACION AS id_configuracion,
      ID_EVENTO AS evento_id,
      VALOR_ASOCIADO AS valor_asociado,
      VALOR_ACOMPANANTE AS valor_acompanante,
      MAX_ACOMPANANTES AS max_acompanantes,
      NUMERO_CUOTAS AS numero_cuotas,
      FECHA_REGISTRO AS fecha_registro

    FROM configuracion_cobro_evento

    WHERE ID_EVENTO = ?
  `;


  database.query(
    sql,
    [eventoId],
    (error, results) => {

      if (error) {

        console.error(
          "Error al consultar configuración de cobro:",
          error
        );

        return res.status(500).json({
          message:
            "Error al consultar la configuración de cobro"
        });
      }


      if (results.length === 0) {

        return res.status(404).json({
          message:
            "El evento no tiene configuración de cobro"
        });
      }


      return res.json(
        results[0]
      );
    }
  );
};


// ==========================================
// GUARDAR CONFIGURACIÓN DE COBRO
// ==========================================

const saveBillingConfig = (req, res) => {

  const { eventoId } = req.params;

  const {
    valor_asociado,
    valor_acompanante,
    max_acompanantes = 2,
    numero_cuotas = 3
  } = req.body;


  // Compatibilidad temporal con el panel anterior:
  // si no envía valor_asociado, conservamos la tarifa existente.
  const incluyeValorAsociado =
    valor_asociado !== undefined &&
    valor_asociado !== null &&
    valor_asociado !== "";

  const valorAsociado = incluyeValorAsociado
    ? Number(valor_asociado)
    : 0;

  if (
    !Number.isFinite(valorAsociado) ||
    valorAsociado < 0
  ) {
    return res.status(400).json({
      message: "El valor del asociado no es válido"
    });
  }

  const valorAcompanante =
    Number(valor_acompanante);

  const maxAcompanantes =
    Number(max_acompanantes);

  const numeroCuotas =
    Number(numero_cuotas);


  if (
    !Number.isFinite(valorAcompanante) ||
    valorAcompanante < 0
  ) {

    return res.status(400).json({
      message:
        "El valor del acompañante no es válido"
    });
  }


  if (
    !Number.isInteger(maxAcompanantes) ||
    maxAcompanantes < 0
  ) {

    return res.status(400).json({
      message:
        "La cantidad máxima de acompañantes no es válida"
    });
  }


  if (
    !Number.isInteger(numeroCuotas) ||
    numeroCuotas <= 0
  ) {

    return res.status(400).json({
      message:
        "El número de cuotas debe ser mayor que cero"
    });
  }


  const eventSql = `
    SELECT ID_EVENTO

    FROM evento

    WHERE ID_EVENTO = ?
  `;


  database.query(
    eventSql,
    [eventoId],
    (eventError, eventResults) => {

      if (eventError) {

        console.error(
          "Error al verificar evento:",
          eventError
        );

        return res.status(500).json({
          message:
            "Error al verificar el evento"
        });
      }


      if (eventResults.length === 0) {

        return res.status(404).json({
          message:
            "Evento no encontrado"
        });
      }


      const sql = `
        INSERT INTO configuracion_cobro_evento
        (
          ID_EVENTO,
          VALOR_ASOCIADO,
          VALOR_ACOMPANANTE,
          MAX_ACOMPANANTES,
          NUMERO_CUOTAS
        )

        VALUES (?, ?, ?, ?, ?)

        ON DUPLICATE KEY UPDATE

          VALOR_ASOCIADO = IF(
            ?,
            VALUES(VALOR_ASOCIADO),
            VALOR_ASOCIADO
          ),

          VALOR_ACOMPANANTE =
            VALUES(VALOR_ACOMPANANTE),

          MAX_ACOMPANANTES =
            VALUES(MAX_ACOMPANANTES),

          NUMERO_CUOTAS =
            VALUES(NUMERO_CUOTAS)
      `;


      database.query(
        sql,
        [
          eventoId,
          valorAsociado,
          valorAcompanante,
          maxAcompanantes,
          numeroCuotas,
          incluyeValorAsociado
        ],
        (error) => {

          if (error) {

            console.error(
              "Error al guardar configuración de cobro:",
              error
            );

            return res.status(500).json({
              message:
                "Error al guardar la configuración de cobro"
            });
          }


          return res.json({
            message:
              "Configuración de cobro guardada correctamente"
          });
        }
      );
    }
  );
};


// ==========================================
// OBTENER CUOTAS DEL EVENTO
// ==========================================

const getEventInstallments = (req, res) => {

  const { eventoId } = req.params;


  const sql = `
    SELECT
      ID_CUOTA_EVENTO AS id,
      ID_EVENTO AS evento_id,
      NUMERO_CUOTA AS numero_cuota,
      FECHA_COBRO AS fecha_cobro,
      DESCRIPCION AS descripcion

    FROM cuota_evento

    WHERE ID_EVENTO = ?

    ORDER BY NUMERO_CUOTA ASC
  `;


  database.query(
    sql,
    [eventoId],
    (error, results) => {

      if (error) {

        console.error(
          "Error al consultar cuotas del evento:",
          error
        );

        return res.status(500).json({
          message:
            "Error al consultar las cuotas del evento"
        });
      }


      return res.json(
        results
      );
    }
  );
};


// ==========================================
// GUARDAR CUOTAS DEL EVENTO
// ==========================================

const saveEventInstallments =
  async (req, res) => {

    const { eventoId } =
      req.params;

    const { cuotas } =
      req.body;


    if (
      !Array.isArray(cuotas) ||
      cuotas.length === 0
    ) {

      return res.status(400).json({
        message:
          "Debes enviar al menos una cuota"
      });
    }


    const connection =
      await database
        .promise()
        .getConnection();


    try {

      await connection.beginTransaction();


      await connection.query(
        `
        DELETE FROM cuota_evento

        WHERE ID_EVENTO = ?
        `,
        [eventoId]
      );


      for (const cuota of cuotas) {

        const numeroCuota =
          Number(
            cuota.numero_cuota
          );


        if (
          !Number.isInteger(numeroCuota) ||
          numeroCuota <= 0 ||
          !cuota.fecha_cobro
        ) {

          await connection.rollback();

          return res.status(400).json({
            message:
              "Los datos de las cuotas no son válidos"
          });
        }


        await connection.query(
          `
          INSERT INTO cuota_evento
          (
            ID_EVENTO,
            NUMERO_CUOTA,
            FECHA_COBRO,
            DESCRIPCION
          )

          VALUES (?, ?, ?, ?)
          `,
          [
            eventoId,
            numeroCuota,
            cuota.fecha_cobro,
            cuota.descripcion || null
          ]
        );
      }


      await connection.commit();


      return res.json({
        message:
          "Cuotas del evento guardadas correctamente"
      });


    } catch (error) {

      await connection.rollback();


      console.error(
        "Error al guardar cuotas del evento:",
        error
      );


      return res.status(500).json({
        message:
          "Error al guardar las cuotas del evento"
      });


    } finally {

      connection.release();
    }
  };


// ==========================================
// BUSCAR ASOCIADOS
// ==========================================

const searchAssociates = (req, res) => {

  const search =
    String(
      req.query.q || ""
    ).trim();


  if (search.length < 2) {

    return res.status(400).json({
      message:
        "Escribe al menos 2 caracteres para buscar"
    });
  }


  const searchValue =
    `%${search}%`;


  const sql = `
    SELECT
      ID_USUARIO AS id,
      NUMERO_DOCUMENTO AS numero_documento,
      NOMBRES AS nombres,
      APELLIDOS AS apellidos,
      CORREO AS correo,
      TELEFONO AS telefono,
      ESTADO_USUARIO AS estado

    FROM usuario

    WHERE
    (
      NUMERO_DOCUMENTO LIKE ?
      OR NOMBRES LIKE ?
      OR APELLIDOS LIKE ?
      OR CONCAT(
        NOMBRES,
        ' ',
        APELLIDOS
      ) LIKE ?
    )

    AND (
      ESTADO_USUARIO IS NULL
      OR UPPER(ESTADO_USUARIO) = 'ACTIVO'
    )

    ORDER BY
      NOMBRES ASC,
      APELLIDOS ASC

    LIMIT 20
  `;


  database.query(
    sql,
    [
      searchValue,
      searchValue,
      searchValue,
      searchValue
    ],
    (error, results) => {

      if (error) {

        console.error(
          "Error al buscar asociados:",
          error
        );

        return res.status(500).json({
          message:
            "Error al buscar asociados"
        });
      }


      return res.json(
        results
      );
    }
  );
};


// ==========================================
// OBTENER BENEFICIO DE UN ASOCIADO
// ==========================================

const getAssociateBenefit =
  (req, res) => {

    const {
      eventoId,
      usuarioId
    } = req.params;


    const sql = `
      SELECT
        b.ID_BENEFICIO
          AS id_beneficio,

        b.ID_EVENTO
          AS evento_id,

        b.ID_USUARIO
          AS usuario_id,

        b.VALOR_ASOCIADO
          AS valor_asociado,

        b.MAX_ACOMPANANTES_EXCEPCION
          AS max_acompanantes_excepcion,

        b.OBSERVACION
          AS observacion,

        b.FECHA_REGISTRO
          AS fecha_registro,

        u.NUMERO_DOCUMENTO
          AS numero_documento,

        u.NOMBRES
          AS nombres,

        u.APELLIDOS
          AS apellidos

      FROM beneficio_asociado_evento b

      INNER JOIN usuario u
        ON b.ID_USUARIO =
           u.ID_USUARIO

      WHERE
        b.ID_EVENTO = ?

      AND
        b.ID_USUARIO = ?
    `;


    database.query(
      sql,
      [
        eventoId,
        usuarioId
      ],
      (error, results) => {

        if (error) {

          console.error(
            "Error al consultar beneficio:",
            error
          );

          return res.status(500).json({
            message:
              "Error al consultar el beneficio del asociado"
          });
        }


        if (
          results.length === 0
        ) {

          return res.status(404).json({
            message:
              "El asociado no tiene un beneficio configurado para este evento"
          });
        }


        return res.json(
          results[0]
        );
      }
    );
  };

// ==========================================
// CONSULTAR MI BENEFICIO PARA UN EVENTO
// ==========================================

const getMyEventBenefit = (req, res) => {

  const { eventoId } = req.params;

  // Obtener el usuario desde el token
  const usuarioId = req.user.id;

  // Validar identificador del evento
  if (
    !Number.isInteger(Number(eventoId)) ||
    Number(eventoId) <= 0
  ) {
    return res.status(400).json({
      message: "El identificador del evento no es válido."
    });
  }

  const sql = `
    SELECT
      ID_BENEFICIO AS id_beneficio,
      ID_EVENTO AS evento_id,
      ID_USUARIO AS usuario_id,
      VALOR_ASOCIADO AS valor_asociado,
      MAX_ACOMPANANTES_EXCEPCION
        AS max_acompanantes_excepcion

    FROM beneficio_asociado_evento

    WHERE ID_EVENTO = ?
      AND ID_USUARIO = ?

    LIMIT 1
  `;

  database.query(
    sql,
    [eventoId, usuarioId],
    (error, results) => {

      if (error) {
        console.error(
          "Error al consultar mi beneficio:",
          error
        );

        return res.status(500).json({
          message:
            "No fue posible consultar el beneficio."
        });
      }

      if (results.length === 0) {
        return res.json({
          tiene_beneficio: false,
          valor_asociado: null,
          max_acompanantes_excepcion: null
        });
      }

      return res.json({
        tiene_beneficio: true,
        valor_asociado:
          results[0].valor_asociado,
        max_acompanantes_excepcion:
          results[0].max_acompanantes_excepcion
      });
    }
  );
};
// ==========================================
// GUARDAR BENEFICIO DEL ASOCIADO
// ==========================================

const saveAssociateBenefit =
  (req, res) => {

    const {
      eventoId,
      usuarioId
    } = req.params;


    const {
      valor_asociado,
      max_acompanantes_excepcion,
      observacion
    } = req.body;


    const valorAsociado =
      Number(
        valor_asociado
      );


    if (
      Number.isNaN(
        valorAsociado
      ) ||
      valorAsociado < 0
    ) {

      return res.status(400).json({
        message:
          "El valor del asociado no es válido"
      });
    }


    let maxExcepcion = null;


    if (
      max_acompanantes_excepcion !== "" &&
      max_acompanantes_excepcion !== null &&
      max_acompanantes_excepcion !== undefined
    ) {

      maxExcepcion =
        Number(
          max_acompanantes_excepcion
        );


      if (
        !Number.isInteger(
          maxExcepcion
        ) ||
        maxExcepcion < 0
      ) {

        return res.status(400).json({
          message:
            "La excepción de acompañantes no es válida"
        });
      }
    }


    // Verificar que exista el evento
    const eventSql = `
      SELECT ID_EVENTO

      FROM evento

      WHERE ID_EVENTO = ?
    `;


    database.query(
      eventSql,
      [eventoId],
      (eventError, eventResults) => {

        if (eventError) {

          console.error(
            "Error al verificar evento:",
            eventError
          );

          return res.status(500).json({
            message:
              "Error al verificar el evento"
          });
        }


        if (
          eventResults.length === 0
        ) {

          return res.status(404).json({
            message:
              "Evento no encontrado"
          });
        }


        // Verificar que exista el asociado
        const userSql = `
          SELECT ID_USUARIO

          FROM usuario

          WHERE ID_USUARIO = ?
        `;


        database.query(
          userSql,
          [usuarioId],
          (userError, userResults) => {

            if (userError) {

              console.error(
                "Error al verificar asociado:",
                userError
              );

              return res.status(500).json({
                message:
                  "Error al verificar el asociado"
              });
            }


            if (
              userResults.length === 0
            ) {

              return res.status(404).json({
                message:
                  "Asociado no encontrado"
              });
            }


            const sql = `
              INSERT INTO beneficio_asociado_evento
              (
                ID_EVENTO,
                ID_USUARIO,
                VALOR_ASOCIADO,
                MAX_ACOMPANANTES_EXCEPCION,
                OBSERVACION
              )

              VALUES (?, ?, ?, ?, ?)

              ON DUPLICATE KEY UPDATE

                VALOR_ASOCIADO =
                  VALUES(VALOR_ASOCIADO),

                MAX_ACOMPANANTES_EXCEPCION =
                  VALUES(MAX_ACOMPANANTES_EXCEPCION),

                OBSERVACION =
                  VALUES(OBSERVACION)
            `;


            database.query(
              sql,
              [
                eventoId,
                usuarioId,
                valorAsociado,
                maxExcepcion,
                observacion
                  ? String(
                      observacion
                    ).trim()
                  : null
              ],
              (error) => {

                if (error) {

                  console.error(
                    "Error al guardar beneficio:",
                    error
                  );

                  return res.status(500).json({
                    message:
                      "Error al guardar el beneficio del asociado"
                  });
                }


                return res.json({
                  message:
                    "Beneficio del asociado guardado correctamente"
                });
              }
            );
          }
        );
      }
    );
  };


// ==========================================
// EXPORTAR FUNCIONES
// ==========================================

module.exports = {
  getBillingConfig,
  saveBillingConfig,
  getEventInstallments,
  saveEventInstallments,
  searchAssociates,
  getAssociateBenefit,
  saveAssociateBenefit,
  getMyEventBenefit
};