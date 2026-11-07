// pagina de mis inscripciones

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getMyRegistrations
} from "../services/api";

function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // CARGAR INSCRIPCIONES
  // =========================================================

  useEffect(() => {
    const loadRegistrations = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMyRegistrations();

        setRegistrations(data);

      } catch (error) {
        setError(
          error.message ||
            "No fue posible cargar tus inscripciones."
        );

      } finally {
        setLoading(false);
      }
    };

    loadRegistrations();

  }, []);

  // =========================================================
  // FORMATEAR FECHA
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "No definida";
    }

    const dateOnly = String(date).slice(0, 10);

    const [year, month, day] =
      dateOnly.split("-");

    if (!year || !month || !day) {
      return dateOnly;
    }

    return `${day}/${month}/${year}`;
  };

  // =========================================================
  // ESTADO DE CARGA
  // =========================================================

  if (loading) {
    return (
      <main className="registrations-page">

        <div className="container">

          <div className="registration-status">
            Cargando tus inscripciones...
          </div>

        </div>

      </main>
    );
  }

  // =========================================================
  // VISTA PRINCIPAL
  // =========================================================

  return (
    <main className="registrations-page">

      {/* ENCABEZADO */}

      <section className="registrations-header">

        <div className="container">

          <span className="registrations-badge">
            Mi actividad
          </span>

          <h1>
            Mis inscripciones
          </h1>

          <p>
            Consulta los eventos en los que estás
            inscrito y revisa la información de
            tu participación.
          </p>

        </div>

      </section>

      {/* CONTENIDO */}

      <section className="section">

        <div className="container">

          {/* ERROR */}

          {error && (
            <div className="registration-error">
              {error}
            </div>
          )}

          {/* SIN INSCRIPCIONES */}

          {!error &&
            registrations.length === 0 && (

            <div className="registrations-empty">

              <h2>
                No tienes inscripciones
              </h2>

              <p>
                Explora nuestros eventos y participa
                en las actividades de la cooperativa.
              </p>

              <Link
                to="/eventos"
                className="btn-primary"
              >
                Explorar eventos
              </Link>

            </div>

          )}

          {/* LISTA DE INSCRIPCIONES */}

          {registrations.length > 0 && (

            <div className="registrations-grid">

              {registrations.map(
                (registration) => (

                <article
                  key={registration.inscripcion_id}
                  className="registration-card"
                >

                  {/* ENCABEZADO TARJETA */}

                  <div className="registration-card-header">

                    <span className="registration-card-icon">
                      📅
                    </span>

                    <span className="registration-state">
                      {registration.estado ||
                        "Confirmada"}
                    </span>

                  </div>

                  {/* INFORMACIÓN */}

                  <div className="registration-card-body">

                    <h2>
                      {registration.titulo}
                    </h2>

                    <p className="registration-description">
                      {registration.descripcion ||
                        "Sin descripción disponible."}
                    </p>

                    <div className="registration-details">

                      <p>
                        <strong>
                          Fecha:
                        </strong>{" "}
                        {formatDate(
                          registration.fecha
                        )}
                      </p>

                      <p>
                        <strong>
                          Hora:
                        </strong>{" "}
                        {registration.hora
                          ? String(
                              registration.hora
                            ).slice(0, 5)
                          : "No definida"}
                      </p>

                      <p>
                        <strong>
                          Lugar:
                        </strong>{" "}
                        {registration.lugar ||
                          "Por confirmar"}
                      </p>

                      <p>
                        <strong>
                          Inscripción:
                        </strong>{" "}
                        {formatDate(
                          registration.fecha_inscripcion
                        )}
                      </p>

                      <p>
                        <strong>
                          Acompañantes:
                        </strong>{" "}
                        {registration.acompanantes || 0}
                      </p>

                      {/* DATOS DE LOS ACOMPAÑANTES */}

                      {registration.lista_acompanantes &&
                        registration.lista_acompanantes.length > 0 && (

                        <div className="companions-list">

                          <h3>
                            Datos de los acompañantes
                          </h3>

                          {registration.lista_acompanantes.map(
                            (companion, index) => (

                            <div
                              key={companion.id}
                              className="companion-card"
                            >

                              <strong>
                                Acompañante {index + 1}
                              </strong>

                              <p>
                                <strong>Nombre:</strong>{" "}
                                {companion.nombres}{" "}
                                {companion.apellidos}
                              </p>

                              <p>
                                <strong>Documento:</strong>{" "}
                                {companion.numero_documento}
                              </p>

                              <p>
                                <strong>Edad:</strong>{" "}
                                {companion.edad}
                              </p>

                              <p>
                                <strong>Parentesco:</strong>{" "}
                                {companion.parentesco}
                              </p>

                            </div>

                          ))}

                        </div>

                      )}

                    </div>

                  </div>

                  {/* ACCIONES */}

                  <div className="registration-card-footer">

                    <Link
                      to={`/eventos/${registration.evento_id}`}
                      className="btn-secondary"
                    >
                      Ver evento
                    </Link>

                  </div>

                </article>

              ))}

            </div>

          )}

        </div>

      </section>

    </main>
  );
}

export default MyRegistrations;