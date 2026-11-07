// ruta principal de la aplicacion

import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import RegistrationForm from "./pages/RegistrationForm";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyRegistrations from "./pages/MyRegistrations";
import Admin from "./pages/Admin";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <Navbar />

      <main>
        <Routes>

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/eventos"
            element={<Events />}
          />

          <Route
            path="/eventos/:id"
            element={<EventDetail />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/registro"
            element={<Register />}
          />

          {/* RUTAS PROTEGIDAS PARA USUARIO AUTENTICADO */}

          <Route element={<ProtectedRoute />}>

            <Route
              path="/eventos/:id/inscripcion"
              element={<RegistrationForm />}
            />

            <Route
              path="/mis-inscripciones"
              element={<MyRegistrations />}
            />

          </Route>

          {/* RUTAS SOLO PARA ADMINISTRADOR */}

          <Route element={<ProtectedRoute adminOnly />}>

            <Route
              path="/administrador"
              element={<Admin />}
            />

          </Route>

        </Routes>
      </main>
    </>
  );
}

export default App;