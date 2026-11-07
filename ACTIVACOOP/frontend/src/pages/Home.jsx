// pagina de inicio
import { Link } from "react-router-dom";

function Home() {

  return (

    <main className="home-page">

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="home-hero">

        <div className="container home-hero-content">

          <div className="home-hero-text">

            <span className="home-badge">
              Cooperativa Activacoop
            </span>

            <h1>
              Bienvenido a
              <span> Activacoop</span>
            </h1>

            <p>
              Consulta, participa y gestiona los eventos
              organizados por nuestra cooperativa.
            </p>

            <div className="home-actions">

              <Link
                to="/eventos"
                className="btn-primary"
              >
                Ver eventos
              </Link>

             

            </div>

          </div>


        <div className="home-hero-decoration">

          <div className="hero-logo-container">

          <img
            src="images/activacoop-logo.png"
            alt="Logo de la Cooperativa Activacoop"
            className="hero-logo"
          />

         </div>

        </div>

        </div>

      </section>


      {/* =====================================================
          FUNCIONALIDADES
      ====================================================== */}

      <section className="section home-features">

        <div className="container">

          <div className="section-heading">

            <h2 className="section-title">
              Todo en un solo lugar
            </h2>

            <p className="section-subtitle">
              Activacoop facilita la organización y
              participación en los eventos.
            </p>

          </div>


          <div className="features-grid">

            <article className="feature-card">

              <div className="feature-icon">
                📅
              </div>

              <h3>
                Consulta eventos
              </h3>

              <p>
                Explora los eventos disponibles,
                sus fechas, horarios, lugares y cupos.
              </p>

            </article>


            <article className="feature-card">

              <div className="feature-icon">
                👥
              </div>

              <h3>
                Participa
              </h3>

              <p>
                Regístrate fácilmente en los eventos
                que sean de tu interés.
              </p>

            </article>


            <article className="feature-card">

              <div className="feature-icon">
                ✅
              </div>

              <h3>
                Consulta tus inscripciones
              </h3>

              <p>
                Revisa tus eventos registrados y
                administra tus inscripciones.
              </p>

            </article>

          </div>

        </div>

      </section>


      {/* =====================================================
          LLAMADO A LA ACCIÓN
      ====================================================== */}

      <section className="home-cta">

        <div className="container home-cta-content">

          <div>

            <h2>
              ¿Quieres conocer nuestros eventos?
            </h2>

            <p>
              Descubre las próximas actividades
              de Activacoop.
            </p>

          </div>

          <Link
            to="/eventos"
            className="btn-primary"
          >
            Explorar eventos
          </Link>

        </div>

      </section>

    </main>

  );
}

export default Home;