// barra de navegacion

import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const getNavLinkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");

  let user = null;

  try {
    if (userString) {
      user = JSON.parse(userString);
    }
  } catch (error) {
    console.error(
      "Error al leer usuario:",
      error
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("primerIngreso");

    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* LOGOTIPO */}

        <Link
          to="/"
          className="navbar-logo"
        >
          ACTIVACOOP
        </Link>

        {/* MENÚ DE NAVEGACIÓN */}

        <div className="navbar-links">

          <NavLink
            to="/"
            className={getNavLinkClass}
            end
          >
            Inicio
          </NavLink>

          <NavLink
            to="/eventos"
            className={getNavLinkClass}
          >
            Eventos
          </NavLink>

          {token && (
            <NavLink
              to="/mis-inscripciones"
              className={getNavLinkClass}
            >
              Mis inscripciones
            </NavLink>
          )}

          {token &&
            Number(user?.rol) === 2 && (
              <NavLink
                to="/administrador"
                className={getNavLinkClass}
              >
                Administración
              </NavLink>
            )}

        </div>

        {/* ACCIONES DE USUARIO */}

        <div className="navbar-actions">

          {token ? (
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          ) : (
            <Link
              to="/login"
              className="navbar-login"
            >
              Iniciar sesión
            </Link>
          )}

        </div>

      </div>
    </nav>
  );
}

export default Navbar;