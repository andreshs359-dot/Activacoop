//====================================
//    Controlador de estadísticas
//====================================

const database = require("../config/database");

const getStatistics = (req, res) => {

  const queries = {

    // Total de eventos
    events: `
      SELECT COUNT(*) AS total
      FROM evento
    `,

    // Total de categorías
    categories: `
      SELECT COUNT(*) AS total
      FROM categoria_evento
    `,

    // Total de inscripciones activas
    registrations: `
      SELECT COUNT(*) AS total
      FROM inscripcion
      WHERE ESTADO_INSCRIPCION = 'ACTIVA'
    `,

    // Total de asistencias marcadas como asistió
    attended: `
      SELECT COUNT(*) AS total
      FROM asistencia
      WHERE ASISTIO = 1
    `
  };


  database.query(
    queries.events,
    (errorEvents, eventsResult) => {

      if (errorEvents) {

        console.error(
          "Error estadísticas - eventos:",
          errorEvents
        );

        return res.status(500).json({
          message:
            "Error al consultar los eventos"
        });
      }


      database.query(
        queries.categories,
        (errorCategories, categoriesResult) => {

          if (errorCategories) {

            console.error(
              "Error estadísticas - categorías:",
              errorCategories
            );

            return res.status(500).json({
              message:
                "Error al consultar las categorías"
            });
          }


          database.query(
            queries.registrations,
            (
              errorRegistrations,
              registrationsResult
            ) => {

              if (errorRegistrations) {

                console.error(
                  "Error estadísticas - inscripciones:",
                  errorRegistrations
                );

                return res.status(500).json({
                  message:
                    "Error al consultar las inscripciones"
                });
              }


              database.query(
                queries.attended,
                (
                  errorAttended,
                  attendedResult
                ) => {

                  if (errorAttended) {

                    console.error(
                      "Error estadísticas - asistencias:",
                      errorAttended
                    );

                    return res.status(500).json({
                      message:
                        "Error al consultar las asistencias"
                    });
                  }


                  return res.json({

                    totalEventos:
                      Number(
                        eventsResult[0].total
                      ),

                    totalCategorias:
                      Number(
                        categoriesResult[0].total
                      ),

                    totalInscripciones:
                      Number(
                        registrationsResult[0].total
                      ),

                    totalAsistencias:
                      Number(
                        attendedResult[0].total
                      )
                  });
                }
              );
            }
          );
        }
      );
    }
  );
};


module.exports = {
  getStatistics
};