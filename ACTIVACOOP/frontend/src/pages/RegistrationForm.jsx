import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createRegistration, getMyEventBenefit } from "../services/api";

const createEmptyGuest = () => ({
  numero_documento: "",
  nombres: "",
  apellidos: "",
  edad: "",
  parentesco: ""
});

function RegistrationForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?.id;

  const [guestCount, setGuestCount] = useState(0);
  const [guests, setGuests] = useState([]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [message, setMessage] = useState("");
  const [maxGuests, setMaxGuests] = useState(2);
  const [benefit, setBenefit] = useState(null);
  const [loadingBenefit, setLoadingBenefit] = useState(true);
  const [benefitError, setBenefitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Consultar el beneficio del usuario autenticado para este evento.
  useEffect(() => {
    let active = true;

    const loadBenefit = async () => {
      // Las actualizaciones se realizan en una tarea asíncrona,
      // no directamente en el cuerpo del efecto.
      await Promise.resolve();
      if (!active) return;

      setLoadingBenefit(true);
      setBenefitError("");
      setBenefit(null);
      setMaxGuests(2);
      setGuestCount(0);
      setGuests([]);

      if (!userId) {
        setLoadingBenefit(false);
        return;
      }

      try {
        const data = await getMyEventBenefit(id);
        if (!active) return;

        const exception = data.tiene_beneficio
          ? data.max_acompanantes_excepcion
          : null;
        const parsedMax = Number(exception);
        const allowedMax = exception !== null && exception !== undefined &&
          exception !== "" && Number.isInteger(parsedMax) && parsedMax >= 0
          ? parsedMax
          : 2;

        setMaxGuests(allowedMax);
        setBenefit(data.tiene_beneficio ? data : null);
      } catch (error) {
        if (!active) return;
        setBenefitError(
          error.message || "No fue posible consultar las condiciones de inscripción."
        );
      } finally {
        if (active) setLoadingBenefit(false);
      }
    };

    loadBenefit();
    return () => { active = false; };
  }, [id, userId]);

  const handleGuestCountChange = (event) => {
    const count = Number(event.target.value);
    if (!Number.isInteger(count) || count < 0 || count > maxGuests) return;

    setGuestCount(count);
    setGuests((previous) =>
      Array.from({ length: count }, (_, index) =>
        previous[index] || createEmptyGuest()
      )
    );
  };

  const handleGuestChange = (index, event) => {
    const { name, value } = event.target;
    setGuests((previous) =>
      previous.map((guest, guestIndex) =>
        guestIndex === index ? { ...guest, [name]: value } : guest
      )
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (loadingBenefit || benefitError) {
      setMessage("Es necesario consultar las condiciones del evento antes de inscribirse.");
      return;
    }

    if (!acceptTerms) {
      setMessage("Debes aceptar los términos y condiciones.");
      return;
    }

    if (!Number.isInteger(guestCount) || guestCount < 0 ||
        guestCount > maxGuests || guestCount !== guests.length) {
      setMessage("La cantidad de acompañantes no es válida.");
      return;
    }

    for (let index = 0; index < guests.length; index++) {
      const guest = guests[index];
      if (!guest.numero_documento.trim() || !guest.nombres.trim() ||
          !guest.apellidos.trim() || !String(guest.edad).trim() ||
          !guest.parentesco.trim()) {
        setMessage(`Completa todos los datos del acompañante ${index + 1}.`);
        return;
      }

      const age = Number(guest.edad);
      if (!Number.isInteger(age) || age < 15) {
        setMessage(`El acompañante ${index + 1} debe tener una edad válida de mínimo 15 años.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const data = await createRegistration({
        evento_id: Number(id),
        cantidad_acompanantes: guestCount,
        acompanantes: guests
      });
      setMessage(data.message || "Inscripción realizada correctamente.");
      setTimeout(() => navigate("/mis-inscripciones"), 1500);
    } catch (error) {
      setMessage(error.message || "No fue posible realizar la inscripción.");
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <main className="registration-form-page">
        <div className="container">
          <div className="registration-form-card">
            <h2>Debes iniciar sesión</h2>
            <button onClick={() => navigate("/login")}>Ir al inicio de sesión</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="registration-form-page">
      <section className="section">
        <div className="container">
          <div className="registration-form-card">
            <h1>Formulario de inscripción</h1>
            <p>Completa la información para realizar tu inscripción al evento.</p>

            {message && <div className="event-message" role="status">{message}</div>}
            {loadingBenefit && <p>Consultando condiciones de inscripción...</p>}
            {benefitError && (
              <div className="event-message" role="alert">
                No fue posible consultar tu beneficio: {benefitError}
                <p>Por seguridad, la inscripción está deshabilitada hasta poder consultar las condiciones.</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h2>Datos del asociado</h2>
                <div className="form-grid">
                  <label>Número de documento
                    <input type="text" value={user.numeroDocumento || ""} disabled />
                  </label>
                  <label>Nombres
                    <input type="text" value={user.nombres || ""} disabled />
                  </label>
                  <label>Apellidos
                    <input type="text" value={user.apellidos || ""} disabled />
                  </label>
                  <label>Correo electrónico
                    <input type="text" value={user.correo || ""} disabled />
                  </label>
                </div>
              </div>

              {!loadingBenefit && !benefitError && (
                <div className="form-section">
                  <h2>Condiciones del evento</h2>
                  <p>Máximo de acompañantes autorizados: {maxGuests}</p>
                  {benefit && benefit.valor_asociado !== null &&
                    benefit.valor_asociado !== undefined && (
                    <p>
                      Valor especial autorizado para el asociado: {new Intl.NumberFormat(
                        "es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }
                      ).format(Number(benefit.valor_asociado))}
                    </p>
                  )}
                  <p>Los valores de los acompañantes se determinan por separado según las condiciones del evento.</p>
                </div>
              )}

              <div className="form-section">
                <h2>Acompañantes</h2>
                <label>Cantidad de acompañantes
                  <select
                    value={guestCount}
                    onChange={handleGuestCountChange}
                    disabled={loadingBenefit || Boolean(benefitError) || submitting}
                  >
                    {Array.from({ length: maxGuests + 1 }, (_, count) => (
                      <option key={count} value={count}>
                        {count} {count === 1 ? "acompañante" : "acompañantes"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {guests.map((guest, index) => (
                <div className="form-section" key={index}>
                  <h2>Acompañante {index + 1}</h2>
                  <div className="form-grid">
                    <label>Número de documento
                      <input type="text" name="numero_documento"
                        value={guest.numero_documento}
                        onChange={(event) => handleGuestChange(index, event)} />
                    </label>
                    <label>Nombres
                      <input type="text" name="nombres" value={guest.nombres}
                        onChange={(event) => handleGuestChange(index, event)} />
                    </label>
                    <label>Apellidos
                      <input type="text" name="apellidos" value={guest.apellidos}
                        onChange={(event) => handleGuestChange(index, event)} />
                    </label>
                    <label>Edad
                      <input type="number" name="edad" min="15" step="1"
                        value={guest.edad}
                        onChange={(event) => handleGuestChange(index, event)} />
                    </label>
                    <label>Parentesco
                      <input type="text" name="parentesco"
                        placeholder="Ej: esposa, hijo, amigo" value={guest.parentesco}
                        onChange={(event) => handleGuestChange(index, event)} />
                    </label>
                  </div>
                </div>
              ))}

              <label className="terms-checkbox">
                <input type="checkbox" checked={acceptTerms}
                  onChange={(event) => setAcceptTerms(event.target.checked)} />
                Acepto los términos y condiciones de la inscripción.
              </label>

              <div className="form-actions">
                <button type="submit"
                  disabled={loadingBenefit || Boolean(benefitError) || submitting}>
                  {submitting ? "Enviando inscripción..." : "Enviar inscripción"}
                </button>
                <button type="button" onClick={() => navigate(`/eventos/${id}`)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default RegistrationForm;
