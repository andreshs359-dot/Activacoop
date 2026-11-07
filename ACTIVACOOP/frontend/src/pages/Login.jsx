// pagina de inicio de sesion

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../services/api";

function Login() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    numeroDocumento: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  // =========================================================
  // CAMBIAR CAMPOS
  // =========================================================

  const handleChange = (event) => {

    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

  };


  // =========================================================
  // INICIAR SESIÓN
  // =========================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");
    setLoading(true);

    try {

      const data = await loginUser(
        formData.numeroDocumento,
        formData.password
      );

      // Guardar token
      localStorage.setItem(
        "token",
        data.token
      );

      // Guardar información del usuario
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Guardar si es primer ingreso
      localStorage.setItem(
        "primerIngreso",
        String(data.primerIngreso)
      );

      // Ir al inicio
      navigate("/");

    } catch (error) {

      setError(
        error.message ||
        "No fue posible iniciar sesión."
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <main className="form-page">

      <section className="form-card">

        <h1>
          Iniciar sesión
        </h1>

        <p>
          Ingresa al módulo de eventos de Activacoop
        </p>


        {error && (
          <div className="form-error">
            {error}
          </div>
        )}


        <form onSubmit={handleSubmit}>

          {/* NÚMERO DE DOCUMENTO */}

          <label>
            Número de documento

            <input
              type="text"
              inputMode="numeric"
              name="numeroDocumento"
              placeholder="Ingresa tu número de documento"
              value={formData.numeroDocumento}
              onChange={handleChange}
              required
            />

          </label>


          {/* CONTRASEÑA */}

          <label>
            Contraseña

            <input
              type="password"
              name="password"
              placeholder="Ingresa tu contraseña"
              value={formData.password}
              onChange={handleChange}
              required
            />

          </label>


          {/* BOTÓN */}

          <button
            type="submit"
            disabled={loading}
          >

            {loading
              ? "Ingresando..."
              : "Iniciar sesión"}

          </button>

        </form>


        <div className="form-footer">

          <p>
            Si es tu primer ingreso, utiliza como contraseña
            inicial los últimos 4 dígitos de tu documento.
          </p>

        </div>

      </section>

    </main>

  );
}

export default Login;
