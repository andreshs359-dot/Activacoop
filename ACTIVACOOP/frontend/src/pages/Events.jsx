// pagina de eventos 

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getEvents,
  getCategories,
} from "../services/api";

function Events() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortOrder, setSortOrder] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 6;

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  

  // =========================================================
  // CARGAR EVENTOS Y CATEGORÍAS
  // =========================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [eventsData, categoriesData] = await Promise.all([
          getEvents(),
          getCategories(),
        ]);

        setEvents(eventsData);
        setCategories(categoriesData);
      } catch (error) {
        setError(
          error.message ||
            "No fue posible cargar los eventos."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // =========================================================
  // FILTRAR EVENTOS
  // =========================================================

 const filteredEvents = events
  .filter((event) => {
    const searchText = search.toLowerCase().trim();

    const title = event.titulo?.toLowerCase() || "";
    const description = event.descripcion?.toLowerCase() || "";
    const place = event.lugar?.toLowerCase() || "";

    const matchesSearch =
      title.includes(searchText) ||
      description.includes(searchText) ||
      place.includes(searchText);

    const matchesCategory =
      selectedCategory === "" ||
      String(event.categoria_id) === String(selectedCategory);

    return matchesSearch && matchesCategory;
  })
  .sort((a, b) => {
    const dateA = new Date(a.fecha);
    const dateB = new Date(b.fecha);

    return sortOrder === "asc"
      ? dateA - dateB
      : dateB - dateA;
  });


  // =========================================================
// PAGINACIÓN
// =========================================================

 const totalPages = Math.ceil(
  filteredEvents.length / eventsPerPage
  );

 const startIndex = (currentPage - 1) * eventsPerPage;

 const paginatedEvents = filteredEvents.slice(
  startIndex, startIndex + eventsPerPage
  );




  // =========================================================
  // FORMATEAR FECHA
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "Fecha no disponible";
    }

    const dateOnly = String(date).slice(0, 10);

    const [year, month, day] = dateOnly.split("-");

    if (!year || !month || !day) {
      return dateOnly;
    }

    return `${day}/${month}/${year}`;
  };

  // =========================================================
  // RENDERIZADO
  // =========================================================

  return (
    <main className="events-page">

      {/* ENCABEZADO */}

      <section className="events-header">

        <div className="container">

          <span className="events-badge">
            Actividades de la cooperativa
          </span>

          <h1>
            Eventos Activacoop
          </h1>

          <p>
            Encuentra actividades, capacitaciones y
            encuentros para participar con nuestra comunidad.
          </p>

        </div>

      </section>


      {/* FILTROS */}

      <section className="events-filters-section">

        <div className="container">

          <div className="events-filters">

            <div className="search-wrapper">

              <label htmlFor="event-search">
                Buscar evento
              </label>

              <input
                id="event-search"
                type="search"
                placeholder="Buscar por nombre, lugar..."
                value={search}
                onChange={(event) =>{
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
              />

            </div>


            <div className="category-filter">

              <label htmlFor="category-filter">
                Categoría
              </label>

              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(event) =>{
                  setSelectedCategory(event.target.value);
                  setCurrentPage(1);
                }}
              >

                <option value="">
                  Todas las categorías
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.nombre}
                  </option>
                ))}

              </select>

            </div>

            <div className="sort-filter">
              <label htmlFor="sort-order">
                Ordenar por fecha
              </label>

              <select
                id="sort-order"
                value={sortOrder}
                onChange={(event) =>{
                  setSortOrder(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="asc">
                  Más próximos primero
                </option>

                <option value="desc">
                  Más lejanos primero
                </option>
              </select>
            </div>

          </div>
        </div>
      </section>


      {/* LISTADO */}

      <section className="section events-list-section">

        <div className="container">

            {/* estado de carga */}

          {loading && (
            <div className="events-loading">
            <div className="loading-spinner"></div>

            <p>
              Cargando eventos, por favor espera...
            </p>
        </div>
        )}

        {/* mensaje de error */}
          {!loading && error && (
          <div className="events-error">

            <div className="error-icon">
              ⚠️
            </div>

            <h2>
             No pudimos cargar los eventos
            </h2>

            <p>
              {error}
            </p>

            <button
            type="button"
            className="btn-primary"
            onClick={() => window.location.reload()}
            >
              Intentar nuevamente
              </button>

          </div>
          )}


          {!loading &&
            !error &&
            filteredEvents.length === 0 && (
              <div className="events-empty">
                <div className="empty-icon"> 
                  🔍
                </div>

                <h2>
                  No se encontraron eventos
                </h2>

                <p>
                  No hay eventos que coincidan con los filtros
                  seleccionados.
                </p>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("");
                    setSortOrder("asc");
                    setCurrentPage(1)
                  }}
                >
                  Limpiar filtros
                </button>

              </div>
          )}


          {!loading && !error && filteredEvents.length > 0 && (

            <div className="events-grid">

              {paginatedEvents.map((event) => {

                const availableSlots =
  Number(event.cupos_disponibles || 0);

const isUnlimited =
  Number(event.cupo_ilimitado) === 1;

const hasAvailableSlots =
  isUnlimited || availableSlots > 0;

                return (

                  <article
                    key={event.id}
                    className="event-card"
                  >

                    {/* ENCABEZADO DE TARJETA */}

                    <div className="event-card-top">

                      <span className="event-category">

                        {event.categoria_nombre || "Actividad"}

                      </span>

                      <span
                        className={
                          hasAvailableSlots
                            ? "event-status available"
                            : "event-status full"
                        }
                      >

                        {hasAvailableSlots
                          ? "Disponible"
                          : "Sin cupos"}

                      </span>

                    </div>


                    {/* INFORMACIÓN */}

                    <div className="event-card-body">

                      <h2>
                        {event.titulo}
                      </h2>

                      <p className="event-description">

                        {event.descripcion ||
                          "No hay una descripción disponible."}

                      </p>


                      <div className="event-details">

                        <p>
                          <span>📅</span>
                          <strong>Fecha:</strong>{" "}
                          {formatDate(event.fecha)}
                        </p>

                        <p>
                          <span>⏰</span>
                          <strong>Hora:</strong>{" "}
                          {event.hora
                            ? String(event.hora).slice(0, 5)
                            : "No definida"}
                        </p>

                        <p>
                          <span>📍</span>
                          <strong>Lugar:</strong>{" "}
                          {event.lugar || "Por confirmar"}
                        </p>

                        <p>
  <span>👥</span>
  <strong>Cupos:</strong>{" "}
  {isUnlimited ? "Ilimitados" : availableSlots}
</p>

                      </div>

                    </div>


                    {/* PIE DE TARJETA */}

                    <div className="event-card-footer">

                      <Link
                        to={`/eventos/${event.id}`}
                        className="btn-primary event-details-button"
                      >
                        Ver detalles
                      </Link>

                    </div>

                  </article>

                );
              })}

            </div>

            )}

        {/* CONTROLES DE PAGINACIÓN */}

        {totalPages > 1 && (
          <div className="pagination">

            <button
              type="button"
              className="pagination-button"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((page) => page - 1)
              }
            >
              Anterior
            </button>

            <span className="pagination-info">
              Página {currentPage} de {totalPages}
            </span>

            <button
              type="button"
              className="pagination-button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => page + 1)
              }
            >
              Siguiente
            </button>

          </div>
        )}

        </div>
      </section>
    </main>
  );
}

export default Events;