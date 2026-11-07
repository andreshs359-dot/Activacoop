import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute({ adminOnly = false }) {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  // Verificar si existe un token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Obtener los datos del usuario
  let user;

  try {
    user = userData ? JSON.parse(userData) : null;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace />;
  }

  // Verificar que existan datos del usuario
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar si el usuario tiene permisos de administrador
  if (
    adminOnly &&
    Number(user.rol) !== 2
  ) {
    return <Navigate to="/" replace />;
  }

  // Permitir acceso a la ruta
  return <Outlet />;
}

export default ProtectedRoute;