// pagina de detalle del evento

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getEventById,
  getMyRegistrations
} from "../services/api";

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [alreadyRegistered, setAlreadyRegistered] =
    useState(false);

  // =========================================================
  // CARGAR EVENTO
  // =========================================================

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError("");

        // Cargar información del evento
        const data = await getEventById(id);

        setEvent(data);

        // Revisar si el usuario ya está inscrito
        const token = localStorage.getItem("token");

        if (token) {
          const registrations =
            await getMyRegistrations();

          const registered =
            registrations.some(
              (registration) =>
                Number(registration.evento_id) ===
                Number(id)
            );

          setAlreadyRegistered(registered);
        } else {
          setAlreadyRegistered(false);
        }

      } catch (error) {
        setError(
          error.message ||
            "No fue posible cargar el evento."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id]);

  // =========================================================
  // FORMATEAR FECHA
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "No definida";
    }

    const dateOnly = String(date).slice(0, 10);
    const [year, month, day] = dateOnly.split("-");

    if (!year || !month || !day) {
      return dateOnly;
    }

    return `${day}/${month}/${year}`;
  };

  // =========================================================
  // IR AL FORMULARIO DE INSCRIPCIÓN
  // =========================================================

  const handleRegistration = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage(
        "Debes iniciar sesión para inscribirte"
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);

      return;
    }

    if (alreadyRegistered) {
      setMessage(
        "Ya estás inscrito en este evento"
      );

      return;
    }

    const isUnlimited =
      Number(event.cupo_ilimitado) === 1;

    const availableSlots =
      Number(event.cupos_disponibles || 0);

    if (
      !isUnlimited &&
      availableSlots <= 0
    ) {
      setMessage(
        "No hay cupos disponibles"
      );

      return;
    }

    navigate(
      `/eventos/${event.id}/inscripcion`
    );
  };

  // =========================================================
  // ESTADO DE CARGA
  // =========================================================

  if (loading) {
    return (
      <main className="event-detail-page">
        <div className="container">
          <div className="event-detail-status">
            Cargando información del evento...
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // ESTADO DE ERROR
  // =========================================================

  if (error || !event) {
    return (
      <main className="event-detail-page">

        <div className="container">

          <div className="event-detail-error">

            <h2>
              No se pudo cargar el evento
            </h2>

            <p>
              {error || "El evento no existe."}
            </p>

            <Link
              to="/eventos"
              className="btn-primary"
            >
              Volver a eventos
            </Link>

          </div>

        </div>

      </main>
    );
  }

  // =========================================================
  // DISPONIBILIDAD
  // =========================================================

  const availableSlots =
    Number(
      event.cupos_disponibles || 0
    );

  const isUnlimited =
    Number(event.cupo_ilimitado) === 1;

  const hasAvailableSlots =
    isUnlimited || availableSlots > 0;

  // =========================================================
  // VISTA PRINCIPAL
  // =========================================================

  return (
    <main className="event-detail-page">

      {/* ENCABEZADO */}

      <section className="event-detail-header">

        <div className="container">

          <Link
            to="/eventos"
            className="back-to-events"
          >
            ← Volver a eventos
          </Link>

          <span className="event-detail-category">
            {event.categoria_nombre ||
              "Actividad"}
          </span>

          <h1>
            {event.titulo}
          </h1>

          <p>
            Conoce todos los detalles de esta
            actividad de Activacoop.
          </p>

        </div>

      </section>

      {/* CONTENIDO */}

      <section className="section">

        <div className="container event-detail-layout">

          {/* INFORMACIÓN */}

          <article className="event-detail-card">

            <h2>
              Información del evento
            </h2>

            <div className="event-detail-description">

              <h3>
                Descripción
              </h3>

              <p>
                {event.descripcion ||
                  "No hay una descripción disponible."}
              </p>

            </div>

            <div className="event-detail-information">

              {/* FECHA */}

              <div className="detail-information-item">

                <span className="detail-icon">
                  📅
                </span>

                <div>

                  <strong>
                    Fecha
                  </strong>

                  <p>
                    {formatDate(event.fecha)}
                  </p>

                </div>

              </div>

              {/* HORA */}

              <div className="detail-information-item">

                <span className="detail-icon">
                  ⏰
                </span>

                <div>

                  <strong>
                    Hora
                  </strong>

                  <p>
                    {event.hora
                      ? String(event.hora).slice(
                          0,
                          5
                        )
                      : "No definida"}
                  </p>

                </div>

              </div>

              {/* LUGAR */}

              <div className="detail-information-item">

                <span className="detail-icon">
                  📍
                </span>

                <div>

                  <strong>
                    Lugar
                  </strong>

                  <p>
                    {event.lugar ||
                      "Por confirmar"}
                  </p>

                </div>

              </div>

            </div>

          </article>

          {/* TARJETA DE INSCRIPCIÓN */}

          <aside className="event-registration-card">

            <span className="registration-card-label">
              Disponibilidad
            </span>

            <div className="registration-slots">

              {isUnlimited ? (
                <strong>
                  Ilimitados
                </strong>
              ) : (
                <>
                  <strong>
                    {availableSlots}
                  </strong>

                  <span>
                    cupos disponibles
                  </span>
                </>
              )}

            </div>

            <div
              className={
                hasAvailableSlots
                  ? "detail-availability available"
                  : "detail-availability full"
              }
            >

              {isUnlimited
                ? "✓ Inscripciones disponibles"
                : hasAvailableSlots
                  ? "✓ Hay cupos disponibles"
                  : "✕ No hay cupos disponibles"}

            </div>

            {/* MENSAJE */}

            {message && (
              <div className="event-message error">
                {message}
              </div>
            )}

            {/* ESTADO DE INSCRIPCIÓN */}

            {alreadyRegistered ? (

              <div className="already-registered-box">

                <strong>
                  ✓ Ya estás inscrito en este evento
                </strong>

                <button
                  type="button"
                  className="view-registration-button"
                  onClick={() =>
                    navigate("/mis-inscripciones")
                  }
                >
                  Ver mis inscripciones
                </button>

              </div>

            ) : (

              <button
                type="button"
                className="registration-button"
                onClick={handleRegistration}
                disabled={!hasAvailableSlots}
              >
                {hasAvailableSlots
                  ? "Inscribirme al evento"
                  : "Sin cupos disponibles"}
              </button>

            )}

          </aside>

        </div>

      </section>

    </main>
  );
}

export default EventDetail;