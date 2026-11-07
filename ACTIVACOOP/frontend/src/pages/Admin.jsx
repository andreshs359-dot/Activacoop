import { useEffect, useState } from "react";

import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getCategories,
  createCategory,
  deleteCategory,
  getEventParticipants,
  updateAttendance,
  deleteRegistration,
  getStatistics,
  getBillingConfig,
  saveBillingConfig,
  getEventInstallments,
  saveEventInstallments,
  searchAssociates,
  getAssociateBenefit,
  saveAssociateBenefit
} from "../services/api";

import Reportes from "../components/Reportes";


function Admin() {

  // =========================================================
  // ESTADOS GENERALES
  // =========================================================

  const [events, setEvents] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [participants, setParticipants] =
    useState([]);

  const [selectedEvent, setSelectedEvent] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [editingId, setEditingId] =
    useState(null);

  const [participantSearch, setParticipantSearch] =
    useState("");


  // =========================================================
  // CONFIGURACIÓN DE COBRO
  // =========================================================

  const [
    selectedBillingEvent,
    setSelectedBillingEvent
  ] = useState(null);


  const [billingForm, setBillingForm] =
    useState({
      valor_asociado: "",
      valor_acompanante: "",
      max_acompanantes: 2,
      numero_cuotas: 3
    });


  const [installments, setInstallments] =
    useState([
      {
        numero_cuota: 1,
        fecha_cobro: "",
        descripcion: "Cuota 1"
      },
      {
        numero_cuota: 2,
        fecha_cobro: "",
        descripcion: "Cuota 2"
      },
      {
        numero_cuota: 3,
        fecha_cobro: "",
        descripcion: "Cuota 3"
      }
    ]);



  // =========================================================
  // BENEFICIOS DE ASOCIADOS
  // =========================================================

  const [
    selectedBenefitEvent,
    setSelectedBenefitEvent
  ] = useState(null);

  const [
    associateSearch,
    setAssociateSearch
  ] = useState("");

  const [
    associateResults,
    setAssociateResults
  ] = useState([]);

  const [
    selectedAssociate,
    setSelectedAssociate
  ] = useState(null);

  const [benefitForm, setBenefitForm] =
    useState({
      valor_asociado: "",
      max_acompanantes_excepcion: "",
      observacion: ""
    });
// Mensaje de confirmación de beneficios
const [benefitMessage, setBenefitMessage] = useState("");

  // =========================================================
  // FORMULARIO DE CATEGORÍAS
  // =========================================================

  const [categoryForm, setCategoryForm] =
    useState({
      nombre: "",
      descripcion: ""
    });


  // =========================================================
  // FORMULARIO DE EVENTOS
  // =========================================================

  const [formData, setFormData] =
    useState({
      titulo: "",
      descripcion: "",
      fecha: "",
      hora: "",
      hora_fin: "",
      lugar: "",
      cupos_disponibles: "",
      cupo_ilimitado: false,
      categoria_id: ""
    });


  // =========================================================
  // ESTADÍSTICAS
  // =========================================================

  const [statistics, setStatistics] =
    useState({
      totalEventos: 0,
      totalCategorias: 0,
      totalInscripciones: 0,
      totalAsistencias: 0
    });


  // =========================================================
  // FUNCIÓN AUXILIAR PARA CREAR CUOTAS
  // =========================================================

  const buildInstallments = (
    amount,
    previous = []
  ) => {

    return Array.from(
      {
        length: amount
      },
      (_, index) => {

        const existing =
          previous[index];

        return {
          numero_cuota:
            index + 1,

          fecha_cobro:
            existing?.fecha_cobro || "",

          descripcion:
            existing?.descripcion ||
            `Cuota ${index + 1}`
        };
      }
    );
  };


  // =========================================================
  // CARGAR EVENTOS
  // =========================================================

  const loadEvents = async () => {

    const data =
      await getEvents();

    setEvents(data);
  };


  // =========================================================
  // CARGAR CATEGORÍAS
  // =========================================================

  const loadCategories = async () => {

    const data =
      await getCategories();

    setCategories(data);
  };


  // =========================================================
  // CARGAR ESTADÍSTICAS
  // =========================================================

  const loadStatistics = async () => {

    try {

      const data =
        await getStatistics();

      setStatistics(data);

    } catch (error) {

      setMessage(
        error.message ||
        "Error al cargar las estadísticas."
      );
    }
  };


  // =========================================================
  // CARGA INICIAL
  // =========================================================

  useEffect(() => {

    const loadInitialData = async () => {

      setLoading(true);

      try {

        await Promise.all([
          loadEvents(),
          loadCategories(),
          loadStatistics()
        ]);

      } catch (error) {

        console.error(
          "Error al cargar los datos iniciales:",
          error
        );

        setMessage(
          error.message ||
          "Error al cargar la información inicial."
        );

      } finally {

        setLoading(false);
      }
    };


    loadInitialData();

  }, []);


  // =========================================================
  // CAMBIAR FORMULARIO DE EVENTO
  // =========================================================

  const handleChange = (event) => {

    const {
      name,
      value,
      type,
      checked
    } = event.target;


    setFormData(
      (previousData) => ({
        ...previousData,

        [name]:
          type === "checkbox"
            ? checked
            : value
      })
    );
  };


  // =========================================================
  // LIMPIAR FORMULARIO DE EVENTO
  // =========================================================

  const resetEventForm = () => {

    setFormData({
      titulo: "",
      descripcion: "",
      fecha: "",
      hora: "",
      hora_fin: "",
      lugar: "",
      cupos_disponibles: "",
      cupo_ilimitado: false,
      categoria_id: ""
    });

    setEditingId(null);
  };


  // =========================================================
  // VALIDAR EVENTO
  // =========================================================

  const validateEventForm = () => {

    const title =
      formData.titulo.trim();

    const description =
      formData.descripcion.trim();

    const date =
      formData.fecha;

    const startTime =
      formData.hora;

    const endTime =
      formData.hora_fin;

    const place =
      formData.lugar.trim();

    const availableSlots =
      Number(
        formData.cupos_disponibles
      );


    if (!title) {
      return (
        "El título del evento es obligatorio"
      );
    }


    if (title.length < 5) {
      return (
        "El título debe tener al menos 5 caracteres"
      );
    }


    if (!description) {
      return (
        "La descripción es obligatoria"
      );
    }


    if (!date) {
      return (
        "La fecha del evento es obligatoria"
      );
    }


    if (!startTime) {
      return (
        "La hora de inicio es obligatoria"
      );
    }


    if (!endTime) {
      return (
        "La hora de finalización es obligatoria"
      );
    }


    if (endTime <= startTime) {
      return (
        "La hora de finalización debe ser posterior a la hora de inicio"
      );
    }


    if (place.length < 3) {
      return (
        "El lugar debe tener al menos 3 caracteres"
      );
    }


    if (!formData.cupo_ilimitado) {

      if (
        !Number.isInteger(
          availableSlots
        ) ||
        availableSlots <= 0
      ) {

        return (
          "Los cupos deben ser un número mayor que cero"
        );
      }
    }


    if (!formData.categoria_id) {
      return (
        "Debes seleccionar una categoría"
      );
    }


    return null;
  };


  // =========================================================
  // CREAR O ACTUALIZAR EVENTO
  // =========================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    const validationError =
      validateEventForm();


    if (validationError) {

      setMessage(
        validationError
      );

      return;
    }


    try {

      const eventData = {

        ...formData,

        cupo_ilimitado:
          formData.cupo_ilimitado
            ? 1
            : 0,

        cupos_disponibles:
          formData.cupo_ilimitado
            ? 0
            : Number(
                formData.cupos_disponibles
              )
      };


      if (editingId !== null) {

        await updateEvent(
          editingId,
          eventData
        );


        setMessage(
          "Evento actualizado correctamente."
        );

      } else {

        await createEvent(
          eventData
        );


        setMessage(
          "Evento creado correctamente."
        );
      }


      resetEventForm();

      await loadEvents();

      await loadStatistics();


    } catch (error) {

      setMessage(
        error.message ||
        "Error al guardar el evento."
      );
    }
  };


  // =========================================================
  // EDITAR EVENTO
  // =========================================================

  const handleEdit = (event) => {

    setEditingId(
      event.id
    );


    setFormData({

      titulo:
        event.titulo || "",

      descripcion:
        event.descripcion || "",

      fecha:
        event.fecha
          ? String(
              event.fecha
            ).slice(0, 10)
          : "",

      hora:
        event.hora
          ? String(
              event.hora
            ).slice(0, 5)
          : "",

      hora_fin:
        event.hora_fin
          ? String(
              event.hora_fin
            ).slice(0, 5)
          : "",

      lugar:
        event.lugar || "",

      cupos_disponibles:
        event.cupos_disponibles ?? "",

      cupo_ilimitado:
        Number(
          event.cupo_ilimitado
        ) === 1,

      categoria_id:
        event.categoria_id ?? ""
    });


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };


  // =========================================================
  // CANCELAR EDICIÓN
  // =========================================================

  const handleCancelEdit = () => {

    resetEventForm();

    setMessage("");
  };


  // =========================================================
  // ELIMINAR EVENTO
  // =========================================================

  const handleDelete = async (id) => {

    const confirmation =
      window.confirm(
        "¿Deseas eliminar este evento?"
      );


    if (!confirmation) {
      return;
    }


    try {

      await deleteEvent(id);


      setMessage(
        "Evento eliminado correctamente."
      );


      if (
        selectedEvent === id
      ) {

        setSelectedEvent(null);

        setParticipants([]);
      }


      if (
        selectedBillingEvent?.id === id
      ) {

        setSelectedBillingEvent(null);
      }


      if (
        selectedBenefitEvent?.id === id
      ) {

        setSelectedBenefitEvent(null);
        setSelectedAssociate(null);
        setAssociateResults([]);
      }


      await loadEvents();

      await loadStatistics();


    } catch (error) {

      setMessage(
        error.message ||
        "Error al eliminar el evento."
      );
    }
  };


  // =========================================================
  // CAMBIAR FORMULARIO DE CATEGORÍA
  // =========================================================

  const handleCategoryChange =
    (event) => {

      const {
        name,
        value
      } = event.target;


      setCategoryForm(
        (previousData) => ({
          ...previousData,
          [name]: value
        })
      );
    };


  // =========================================================
  // CREAR CATEGORÍA
  // =========================================================

  const handleCreateCategory =
    async (event) => {

      event.preventDefault();


      const categoryName =
        categoryForm.nombre.trim();


      const categoryDescription =
        categoryForm.descripcion.trim();


      if (!categoryName) {

        setMessage(
          "El nombre de la categoría es obligatorio"
        );

        return;
      }


      if (
        categoryName.length < 3
      ) {

        setMessage(
          "El nombre debe tener al menos 3 caracteres"
        );

        return;
      }


      if (
        categoryDescription.length < 5
      ) {

        setMessage(
          "La descripción debe tener al menos 5 caracteres"
        );

        return;
      }


      try {

        await createCategory({
          nombre:
            categoryName,

          descripcion:
            categoryDescription
        });


        setMessage(
          "Categoría creada correctamente"
        );


        setCategoryForm({
          nombre: "",
          descripcion: ""
        });


        await loadCategories();

        await loadStatistics();


      } catch (error) {

        setMessage(
          error.message ||
          "Error al crear la categoría"
        );
      }
    };


  // =========================================================
  // ELIMINAR CATEGORÍA
  // =========================================================

  const handleDeleteCategory =
    async (id) => {

      const confirmation =
        window.confirm(
          "¿Deseas eliminar esta categoría?"
        );


      if (!confirmation) {
        return;
      }


      try {

        await deleteCategory(id);


        setMessage(
          "Categoría eliminada correctamente."
        );


        await loadCategories();

        await loadStatistics();


      } catch (error) {

        setMessage(
          error.message ||
          "No se pudo eliminar la categoría. Puede estar relacionada con un evento."
        );
      }
    };


  // =========================================================
  // CONSULTAR PARTICIPANTES
  // =========================================================

  const handleParticipants =
    async (eventId) => {

      try {

        const data =
          await getEventParticipants(
            eventId
          );


        setParticipants(
          data
        );


        setSelectedEvent(
          eventId
        );


        setParticipantSearch("");

        setMessage("");


      } catch (error) {

        setMessage(
          error.message ||
          "Error al cargar los participantes."
        );
      }
    };


  // =========================================================
  // CERRAR PARTICIPANTES
  // =========================================================

  const handleCloseParticipants = () => {

    setSelectedEvent(null);

    setParticipants([]);

    setParticipantSearch("");
  };


  // =========================================================
  // ACTUALIZAR ASISTENCIA
  // =========================================================

  const handleAttendance = async (
    registrationId,
    asistencia
  ) => {

    try {

      await updateAttendance(
        registrationId,
        asistencia
      );


      setParticipants(
        (previousParticipants) =>
          previousParticipants.map(
            (participant) => {

              if (
                participant.inscripcion_id ===
                registrationId
              ) {

                return {
                  ...participant,
                  asistencia
                };
              }


              return participant;
            }
          )
      );


      if (
        asistencia === "asistio"
      ) {

        setMessage(
          "Asistencia registrada correctamente."
        );

      } else {

        setMessage(
          "La asistencia fue retirada correctamente."
        );
      }


      await loadStatistics();


    } catch (error) {

      setMessage(
        error.message ||
        "Error al actualizar la asistencia."
      );
    }
  };


  // =========================================================
  // MARCAR ASISTENCIA
  // =========================================================

  const handleMarkAttendance =
    async (registrationId) => {

      await handleAttendance(
        registrationId,
        "asistio"
      );
    };


  // =========================================================
  // QUITAR ASISTENCIA
  // =========================================================

  const handleRemoveAttendance =
    async (registrationId) => {

      const confirmation =
        window.confirm(
          "¿Deseas quitar la asistencia registrada para este asociado?"
        );


      if (!confirmation) {
        return;
      }


      await handleAttendance(
        registrationId,
        "pendiente"
      );
    };


  // =========================================================
  // ELIMINAR INSCRIPCIÓN
  // =========================================================

  const handleDeleteRegistration =
    async (participant) => {

      const nombre =
        `${participant.nombres || ""} ${
          participant.apellidos || ""
        }`.trim();


      const confirmation =
        window.confirm(
          `¿Seguro que deseas eliminar la inscripción de ${nombre || "este asociado"}?\n\n` +
          "También se eliminarán sus acompañantes y la asistencia registrada.\n\n" +
          "Si el evento tiene cupos limitados, los cupos serán devueltos."
        );


      if (!confirmation) {
        return;
      }


      try {

        await deleteRegistration(
          participant.inscripcion_id
        );


        setMessage(
          "Inscripción eliminada correctamente."
        );


        if (
          selectedEvent !== null
        ) {

          const updatedParticipants =
            await getEventParticipants(
              selectedEvent
            );


          setParticipants(
            updatedParticipants
          );
        }


        await loadEvents();

        await loadStatistics();


      } catch (error) {

        setMessage(
          error.message ||
          "Error al eliminar la inscripción."
        );
      }
    };


  // =========================================================
  // FILTRAR PARTICIPANTES
  // =========================================================

  const filteredParticipants =
    participants.filter(
      (participant) => {

        const search =
          participantSearch
            .trim()
            .toLowerCase();


        if (!search) {
          return true;
        }


        const fullName =
          `${participant.nombres || ""} ${
            participant.apellidos || ""
          }`
            .toLowerCase();


        const documentNumber =
          String(
            participant.numero_documento ||
            ""
          ).toLowerCase();


        return (
          fullName.includes(search) ||
          documentNumber.includes(search)
        );
      }
    );


  // =========================================================
  // ABRIR CONFIGURACIÓN DE COBRO
  // =========================================================

  const handleOpenBilling =
    async (event) => {

      setSelectedBillingEvent(
        event
      );

      setMessage("");


      let config = null;


      try {

        config =
          await getBillingConfig(
            event.id
          );

      } catch {

        // Es normal que todavía no exista
        // configuración para un evento nuevo.
      }


      const numeroCuotas =
        config
          ? Number(
              config.numero_cuotas
            ) || 3
          : 3;


      setBillingForm({

        valor_asociado:
          config?.valor_asociado ?? "",

        valor_acompanante:
          config?.valor_acompanante ?? "",

        max_acompanantes:
          config
            ? Number(
                config.max_acompanantes
              ) || 2
            : 2,

        numero_cuotas:
          numeroCuotas
      });


      try {

        const cuotas =
          await getEventInstallments(
            event.id
          );


        if (
          Array.isArray(cuotas) &&
          cuotas.length > 0
        ) {

          setInstallments(
            cuotas.map(
              (cuota) => ({
                numero_cuota:
                  Number(
                    cuota.numero_cuota
                  ),

                fecha_cobro:
                  cuota.fecha_cobro
                    ? String(
                        cuota.fecha_cobro
                      ).slice(0, 10)
                    : "",

                descripcion:
                  cuota.descripcion ||
                  `Cuota ${cuota.numero_cuota}`
              })
            )
          );

        } else {

          setInstallments(
            buildInstallments(
              numeroCuotas
            )
          );
        }


      } catch {

        setInstallments(
          buildInstallments(
            numeroCuotas
          )
        );
      }
    };


  // =========================================================
  // CERRAR CONFIGURACIÓN DE COBRO
  // =========================================================

  const handleCloseBilling = () => {

    setSelectedBillingEvent(null);


    setBillingForm({
      valor_asociado: "",
      valor_acompanante: "",
      max_acompanantes: 2,
      numero_cuotas: 3
    });


    setInstallments(
      buildInstallments(3)
    );
  };


  // =========================================================
  // CAMBIAR CONFIGURACIÓN DE COBRO
  // =========================================================

  const handleBillingChange =
    (event) => {

      const {
        name,
        value
      } = event.target;


      if (
        name === "numero_cuotas"
      ) {

        const cantidad =
          Number(value);


        setBillingForm(
          (previousData) => ({
            ...previousData,
            numero_cuotas:
              value
          })
        );


        if (
          Number.isInteger(
            cantidad
          ) &&
          cantidad > 0 &&
          cantidad <= 12
        ) {

          setInstallments(
            (previousInstallments) =>
              buildInstallments(
                cantidad,
                previousInstallments
              )
          );
        }


        return;
      }


      setBillingForm(
        (previousData) => ({
          ...previousData,
          [name]: value
        })
      );
    };


  // =========================================================
  // CAMBIAR FECHA DE CUOTA
  // =========================================================

  const handleInstallmentChange = (
    index,
    field,
    value
  ) => {

    setInstallments(
      (previousInstallments) => {

        const updated =
          [
            ...previousInstallments
          ];


        updated[index] = {
          ...updated[index],
          [field]: value
        };


        return updated;
      }
    );
  };


  // =========================================================
  // GUARDAR CONFIGURACIÓN DE COBRO
  // =========================================================

  const handleSaveBilling =
    async (event) => {

      event.preventDefault();


      if (!selectedBillingEvent) {
        return;
      }


      const valorAsociado =
        Number(billingForm.valor_asociado);

      if (
        billingForm.valor_asociado === "" ||
        !Number.isFinite(valorAsociado) ||
        valorAsociado < 0
      ) {
        setMessage("El valor normal del asociado no es válido.");
        return;
      }

      const valorAcompanante =
        Number(
          billingForm.valor_acompanante
        );


      const maxAcompanantes =
        Number(
          billingForm.max_acompanantes
        );


      const numeroCuotas =
        Number(
          billingForm.numero_cuotas
        );


      if (
        Number.isNaN(
          valorAcompanante
        ) ||
        valorAcompanante < 0
      ) {

        setMessage(
          "El valor del acompañante no es válido."
        );

        return;
      }


      if (
        !Number.isInteger(
          maxAcompanantes
        ) ||
        maxAcompanantes < 0
      ) {

        setMessage(
          "La cantidad máxima de acompañantes no es válida."
        );

        return;
      }


      if (
        !Number.isInteger(
          numeroCuotas
        ) ||
        numeroCuotas <= 0
      ) {

        setMessage(
          "El número de cuotas debe ser mayor que cero."
        );

        return;
      }


      if (
        installments.length !==
        numeroCuotas
      ) {

        setMessage(
          "La cantidad de fechas no coincide con el número de cuotas."
        );

        return;
      }


      const cuotasIncompletas =
        installments.some(
          (cuota) =>
            !cuota.fecha_cobro
        );


      if (cuotasIncompletas) {

        setMessage(
          "Debes seleccionar la fecha de todas las cuotas."
        );

        return;
      }


      try {

        await saveBillingConfig(
          selectedBillingEvent.id,
          {
            valor_asociado:
              valorAsociado,

            valor_acompanante:
              valorAcompanante,

            max_acompanantes:
              maxAcompanantes,

            numero_cuotas:
              numeroCuotas
          }
        );


        await saveEventInstallments(
          selectedBillingEvent.id,
          installments
        );


        setMessage(
          "Configuración de cobro guardada correctamente."
        );
setSelectedBillingEvent(null);

setBillingForm({
  valor_asociado: "",
  valor_acompanante: "",
  max_acompanantes: 2,
  numero_cuotas: 3
});

setInstallments(
  buildInstallments(3)
);

      } catch (error) {

        setMessage(
          error.message ||
          "Error al guardar la configuración de cobro."
        );
      }
    };



  // =========================================================
  // ABRIR BENEFICIOS DE ASOCIADOS
  // =========================================================

  const handleOpenBenefits = (event) => {

    setSelectedBenefitEvent(
      event
    );

    setAssociateSearch("");

    setAssociateResults([]);

    setSelectedAssociate(null);

    setBenefitForm({
      valor_asociado: "",
      max_acompanantes_excepcion: "",
      observacion: ""
    });

    setMessage("");
    setBenefitMessage("");
  };


  // =========================================================
  // CERRAR BENEFICIOS
  // =========================================================

  const handleCloseBenefits = () => {

    setBenefitMessage("");

    setSelectedBenefitEvent(null);

    setAssociateSearch("");

    setAssociateResults([]);

    setSelectedAssociate(null);

    setBenefitForm({
      valor_asociado: "",
      max_acompanantes_excepcion: "",
      observacion: ""
    });
  };


  // =========================================================
  // BUSCAR ASOCIADOS
  // =========================================================

  const handleAssociateSearch =
    async (event) => {

      event.preventDefault();
      setBenefitMessage("");

      const searchText =
        associateSearch.trim();


      if (
        searchText.length < 2
      ) {

        setMessage(
          "Escribe al menos 2 caracteres para buscar."
        );

        return;
      }


      try {

        const data =
          await searchAssociates(
            searchText
          );


        setAssociateResults(
          Array.isArray(data)
            ? data
            : []
        );

        setSelectedAssociate(null);

        setBenefitForm({
          valor_asociado: "",
          max_acompanantes_excepcion: "",
          observacion: ""
        });

        setMessage("");


      } catch (error) {

        setMessage(
          error.message ||
          "Error al buscar asociados."
        );
      }
    };


  // =========================================================
  // SELECCIONAR ASOCIADO
  // =========================================================

  const handleSelectAssociate =
    async (associate) => {

      setBenefitMessage("");
      setSelectedAssociate(
        associate
      );

      setBenefitForm({
        valor_asociado: "",
        max_acompanantes_excepcion: "",
        observacion: ""
      });


      if (!selectedBenefitEvent) {
        return;
      }


      try {

        const benefit =
          await getAssociateBenefit(
            selectedBenefitEvent.id,
            associate.id
          );


        setBenefitForm({
          valor_asociado:
            benefit.valor_asociado ?? "",

          max_acompanantes_excepcion:
            benefit.max_acompanantes_excepcion ?? "",

          observacion:
            benefit.observacion ?? ""
        });


      } catch {

        // Si todavía no existe beneficio,
        // se deja el formulario vacío.
      }
    };


  // =========================================================
  // CAMBIAR FORMULARIO DE BENEFICIO
  // =========================================================

  const handleBenefitChange =
    (event) => {

      const {
        name,
        value
      } = event.target;


      setBenefitForm(
        (previousData) => ({
          ...previousData,
          [name]: value
        })
      );
    };


  // =========================================================
  // GUARDAR BENEFICIO
  // =========================================================

  const handleSaveBenefit = async (event) => {
  event.preventDefault();

  // Limpiar mensajes anteriores
  setBenefitMessage("");

  if (!selectedBenefitEvent || !selectedAssociate) {
    setBenefitMessage("Debes seleccionar un asociado.");
    return;
  }

  if (benefitForm.valor_asociado.trim() === "") {
    setBenefitMessage("Debes ingresar el valor del asociado.");
    return;
  }

  const valorAsociado = Number(benefitForm.valor_asociado);

  if (!Number.isFinite(valorAsociado) || valorAsociado < 0) {
    setBenefitMessage("El valor del asociado no es válido.");
    return;
  }

  let maxExcepcion = "";

  if (benefitForm.max_acompanantes_excepcion !== "") {
    maxExcepcion = Number(
      benefitForm.max_acompanantes_excepcion
    );

    if (
      !Number.isInteger(maxExcepcion) ||
      maxExcepcion < 0 ||
      maxExcepcion > 10
    ) {
      setBenefitMessage("La excepción de acompañantes no es válida.");
      return;
    }
  }

  try {
    await saveAssociateBenefit(
      selectedBenefitEvent.id,
      selectedAssociate.id,
      {
        valor_asociado: valorAsociado,
        max_acompanantes_excepcion: maxExcepcion,
        observacion: benefitForm.observacion.trim()
      }
    );

    // Limpiar los campos después de guardar
    setBenefitForm({
      valor_asociado: "",
      max_acompanantes_excepcion: "",
      observacion: ""
    });

    // Quitar el asociado seleccionado
    setSelectedAssociate(null);

    // Limpiar los resultados de búsqueda
    setAssociateResults([]);

    // Limpiar el buscador
    setAssociateSearch("");

    // Mostrar mensaje de confirmación
setBenefitMessage(
  "Beneficio del asociado guardado correctamente."
);

  } catch (error) {
    setBenefitMessage(
      error.message || "Error al guardar el beneficio."
    );
  }
};


  // =========================================================
  // PANTALLA DE CARGA
  // =========================================================

  if (loading) {

    return (

      <main className="admin-page">

        <div className="container">

          <div className="admin-section">

            <p>
              Cargando panel administrativo...
            </p>

          </div>

        </div>

      </main>
    );
  }


  // =========================================================
  // RENDERIZADO
  // =========================================================

  return (

    <main className="admin-page">


      {/* =====================================================
          ENCABEZADO
      ====================================================== */}

      <header className="admin-header">

        <div className="container">

          <h1>
            Panel administrativo
          </h1>

          <p>
            Gestiona los eventos, categorías,
            participantes y cobros de Activacoop.
          </p>

        </div>

      </header>


      <div className="container">


        {/* =====================================================
            MENSAJE
        ====================================================== */}

        {message && (

          <div className="admin-message">
            {message}
          </div>

        )}


        {/* =====================================================
            CATEGORÍAS
        ====================================================== */}

        <section className="admin-section">

          <h2>
            Gestión de categorías
          </h2>


          <form
            onSubmit={
              handleCreateCategory
            }
            className="category-form"
          >

            <input
              type="text"
              name="nombre"
              placeholder="Nombre de categoría"
              value={
                categoryForm.nombre
              }
              onChange={
                handleCategoryChange
              }
              required
            />


            <input
              type="text"
              name="descripcion"
              placeholder="Descripción"
              value={
                categoryForm.descripcion
              }
              onChange={
                handleCategoryChange
              }
              required
            />


            <button
              type="submit"
              className="admin-button admin-button-primary"
            >
              Crear categoría
            </button>

          </form>


          <div className="category-list">

            {categories.length === 0 ? (

              <p>
                No hay categorías registradas.
              </p>

            ) : (

              categories.map(
                (category) => (

                  <div
                    key={
                      category.id
                    }
                    className="category-item"
                  >

                    <div>

                      <strong>
                        {category.nombre}
                      </strong>

                      <p>
                        {category.descripcion ||
                          "Sin descripción"}
                      </p>

                    </div>


                    <button
                      type="button"
                      className="admin-button admin-button-danger"
                      onClick={() =>
                        handleDeleteCategory(
                          category.id
                        )
                      }
                    >
                      Eliminar
                    </button>

                  </div>

                )
              )

            )}

          </div>

        </section>


        {/* =====================================================
            ESTADÍSTICAS
        ====================================================== */}

        <section className="statistics-section">

          <h2>
            Resumen general
          </h2>


          <div className="statistics-grid">


            <div className="stat-card">

              <h3>
                Eventos
              </h3>

              <p>
                {statistics.totalEventos}
              </p>

            </div>


            <div className="stat-card">

              <h3>
                Categorías
              </h3>

              <p>
                {statistics.totalCategorias}
              </p>

            </div>


            <div className="stat-card">

              <h3>
                Inscripciones
              </h3>

              <p>
                {statistics.totalInscripciones}
              </p>

            </div>


            <div className="stat-card">

              <h3>
                Asistencias
              </h3>

              <p>
                {statistics.totalAsistencias}
              </p>

            </div>


          </div>

        </section>


        {/* =====================================================
            CREAR / EDITAR EVENTO
        ====================================================== */}

        <section className="admin-section">


          <h2>

            {editingId !== null
              ? "Editar evento"
              : "Crear evento"}

          </h2>


          <form
            className="admin-form"
            onSubmit={
              handleSubmit
            }
          >


            <div className="admin-form-group">

              <label htmlFor="titulo">
                Título del evento
              </label>

              <input
                id="titulo"
                type="text"
                name="titulo"
                value={
                  formData.titulo
                }
                onChange={
                  handleChange
                }
                minLength={5}
                maxLength={150}
                required
              />

            </div>


            <div className="admin-form-group">

              <label htmlFor="lugar">
                Lugar
              </label>

              <input
                id="lugar"
                type="text"
                name="lugar"
                value={
                  formData.lugar
                }
                onChange={
                  handleChange
                }
                required
              />

            </div>


            <div className="admin-form-group full-width">

              <label htmlFor="descripcion">
                Descripción
              </label>

              <textarea
                id="descripcion"
                name="descripcion"
                value={
                  formData.descripcion
                }
                onChange={
                  handleChange
                }
                minLength={5}
                required
              />

            </div>


            <div className="admin-form-group">

              <label htmlFor="fecha">
                Fecha
              </label>

              <input
                id="fecha"
                type="date"
                name="fecha"
                value={
                  formData.fecha
                }
                onChange={
                  handleChange
                }
                min={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                required
              />

            </div>


            <div className="admin-form-group">

              <label htmlFor="hora">
                Hora de inicio
              </label>

              <input
                id="hora"
                type="time"
                name="hora"
                value={
                  formData.hora
                }
                onChange={
                  handleChange
                }
                required
              />

            </div>


            <div className="admin-form-group">

              <label htmlFor="hora_fin">
                Hora de finalización
              </label>

              <input
                id="hora_fin"
                type="time"
                name="hora_fin"
                value={
                  formData.hora_fin
                }
                onChange={
                  handleChange
                }
                required
              />

            </div>


            <div className="admin-form-group">

              <label>
                Tipo de cupo
              </label>


              <label className="admin-checkbox">

                <input
                  type="checkbox"
                  name="cupo_ilimitado"
                  checked={
                    formData.cupo_ilimitado
                  }
                  onChange={
                    handleChange
                  }
                />

                Evento con cupos ilimitados

              </label>

            </div>


            <div className="admin-form-group">

              <label htmlFor="cupos_disponibles">
                Cupos disponibles
              </label>


              <input
                id="cupos_disponibles"
                type="number"
                name="cupos_disponibles"
                value={
                  formData.cupo_ilimitado
                    ? ""
                    : formData.cupos_disponibles
                }
                onChange={
                  handleChange
                }
                min="1"
                max="10000"
                disabled={
                  formData.cupo_ilimitado
                }
                required={
                  !formData.cupo_ilimitado
                }
              />


              {formData.cupo_ilimitado && (

                <small>
                  Este evento no tendrá límite
                  de cupos.
                </small>

              )}

            </div>


            <div className="admin-form-group">

              <label htmlFor="categoria_id">
                Categoría
              </label>


              <select
                id="categoria_id"
                name="categoria_id"
                value={
                  formData.categoria_id
                }
                onChange={
                  handleChange
                }
                required
              >

                <option value="">
                  Selecciona una categoría
                </option>


                {categories.map(
                  (category) => (

                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      {category.nombre}
                    </option>

                  )
                )}

              </select>

            </div>


            <div className="admin-actions">


              <button
                type="submit"
                className="admin-button admin-button-primary"
              >

                {editingId !== null
                  ? "Actualizar evento"
                  : "Crear evento"}

              </button>


              {editingId !== null && (

                <button
                  type="button"
                  className="admin-button admin-button-secondary"
                  onClick={
                    handleCancelEdit
                  }
                >
                  Cancelar edición
                </button>

              )}


            </div>


          </form>

        </section>


        {/* =====================================================
            EVENTOS REGISTRADOS
        ====================================================== */}

        <section className="admin-section">

          <h2>
            Eventos registrados
          </h2>


          {events.length === 0 ? (

            <p>
              No hay eventos registrados.
            </p>

          ) : (

            <div className="admin-events-grid">


              {events.map(
                (event) => (

                  <article
                    key={
                      event.id
                    }
                    className="admin-event-card"
                  >

                    <h3>
                      {event.titulo}
                    </h3>


                    <p>
                      {event.descripcion ||
                        "Sin descripción"}
                    </p>


                    <p>
                      <strong>
                        Fecha:
                      </strong>{" "}
                      {event.fecha
                        ? String(
                            event.fecha
                          ).slice(0, 10)
                        : "Sin fecha"}
                    </p>


                    <p>
                      <strong>
                        Hora de inicio:
                      </strong>{" "}
                      {event.hora
                        ? String(
                            event.hora
                          ).slice(0, 5)
                        : "Sin hora"}
                    </p>


                    <p>
                      <strong>
                        Hora de finalización:
                      </strong>{" "}
                      {event.hora_fin
                        ? String(
                            event.hora_fin
                          ).slice(0, 5)
                        : "Sin hora"}
                    </p>


                    <p>
                      <strong>
                        Lugar:
                      </strong>{" "}
                      {event.lugar ||
                        "Sin lugar"}
                    </p>


                    <p>
                      <strong>
                        Estado:
                      </strong>{" "}
                      {event.estado ||
                        "ACTIVO"}
                    </p>


                    <p>
                      <strong>
                        Cupos:
                      </strong>{" "}
                      {Number(
                        event.cupo_ilimitado
                      ) === 1
                        ? "Ilimitados"
                        : event.cupos_disponibles}
                    </p>


                    <p>
                      <strong>
                        Categoría:
                      </strong>{" "}
                      {event.categoria_nombre ||
                        "Sin categoría"}
                    </p>


                    <div className="admin-actions">


                      <button
                        type="button"
                        className="admin-button admin-button-secondary"
                        onClick={() =>
                          handleEdit(
                            event
                          )
                        }
                      >
                        Editar
                      </button>


                      <button
                        type="button"
                        className="admin-button admin-button-danger"
                        onClick={() =>
                          handleDelete(
                            event.id
                          )
                        }
                      >
                        Eliminar
                      </button>


                      <button
                        type="button"
                        className="admin-button admin-button-primary"
                        onClick={() =>
                          handleParticipants(
                            event.id
                          )
                        }
                      >
                        Participantes
                      </button>


                      <button
                        type="button"
                        className="admin-button admin-button-primary"
                        onClick={() =>
                          handleOpenBilling(
                            event
                          )
                        }
                      >
                        Configurar cobro
                      </button>


                      <button
                        type="button"
                        className="admin-button admin-button-primary"
                        onClick={() =>
                          handleOpenBenefits(
                            event
                          )
                        }
                      >
                        Beneficios
                      </button>


                    </div>


                  </article>

                )
              )}


            </div>

          )}

        </section>


        {/* =====================================================
            CONFIGURACIÓN DE COBRO
        ====================================================== */}

        {selectedBillingEvent && (

          <section className="admin-section">


            <div className="participants-header">


              <div>

                <h2>
                  Configuración de cobro
                </h2>

                <p>
                  Evento:{" "}
                  <strong>
                    {selectedBillingEvent.titulo}
                  </strong>
                </p>

              </div>


              <button
                type="button"
                className="admin-button admin-button-secondary"
                onClick={
                  handleCloseBilling
                }
              >
                Cerrar
              </button>


            </div>


            <form
              className="admin-form"
              onSubmit={
                handleSaveBilling
              }
            >

              <div className="admin-form-group">
                <label htmlFor="valor_asociado_normal">
                  Valor normal del asociado
                </label>
                <input
                  id="valor_asociado_normal"
                  type="number"
                  name="valor_asociado"
                  min="0"
                  step="1"
                  placeholder="Ejemplo: 30000"
                  value={billingForm.valor_asociado}
                  onChange={handleBillingChange}
                  required
                />
                <small>
                  Tarifa general del asociado para este evento.
                  Los beneficios individuales pueden modificarla.
                </small>
              </div>

              <div className="admin-form-group">

                <label htmlFor="valor_acompanante">
                  Valor por acompañante
                </label>

                <input
                  id="valor_acompanante"
                  type="number"
                  name="valor_acompanante"
                  min="0"
                  step="1"
                  placeholder="Ejemplo: 46000"
                  value={
                    billingForm.valor_acompanante
                  }
                  onChange={
                    handleBillingChange
                  }
                  required
                />

              </div>


              <div className="admin-form-group">

                <label htmlFor="max_acompanantes">
                  Máximo normal de acompañantes
                </label>

                <input
                  id="max_acompanantes"
                  type="number"
                  name="max_acompanantes"
                  min="0"
                  max="10"
                  value={
                    billingForm.max_acompanantes
                  }
                  onChange={
                    handleBillingChange
                  }
                  required
                />

                <small>
                  El valor normal para Activacoop es 2.
                  Las excepciones se asignarán
                  individualmente al asociado.
                </small>

              </div>


              <div className="admin-form-group">

                <label htmlFor="numero_cuotas">
                  Número de cuotas
                </label>

                <input
                  id="numero_cuotas"
                  type="number"
                  name="numero_cuotas"
                  min="1"
                  max="12"
                  value={
                    billingForm.numero_cuotas
                  }
                  onChange={
                    handleBillingChange
                  }
                  required
                />

                <small>
                  Normalmente se utilizan 3 cuotas,
                  pero el administrador puede modificarlo.
                </small>

              </div>


              <div className="admin-form-group full-width">

                <h3>
                  Fechas de cobro
                </h3>


                {installments.map(
                  (
                    installment,
                    index
                  ) => (

                    <div
                      key={
                        installment.numero_cuota
                      }
                      style={{
                        marginBottom: "15px"
                      }}
                    >

                      <label
                        htmlFor={
                          `cuota-${installment.numero_cuota}`
                        }
                      >
                        Cuota{" "}
                        {installment.numero_cuota}
                      </label>


                      <input
                        id={
                          `cuota-${installment.numero_cuota}`
                        }
                        type="date"
                        value={
                          installment.fecha_cobro
                        }
                        onChange={
                          (event) =>
                            handleInstallmentChange(
                              index,
                              "fecha_cobro",
                              event.target.value
                            )
                        }
                        required
                      />

                    </div>

                  )
                )}


              </div>


              <div className="admin-actions">

                <button
                  type="submit"
                  className="admin-button admin-button-primary"
                >
                  Guardar configuración de cobro
                </button>

              </div>


            </form>


          </section>

        )}



        {/* =====================================================
            BENEFICIOS DE ASOCIADOS
        ====================================================== */}

        {selectedBenefitEvent && (

          <section className="admin-section">


            <div className="participants-header">


              <div>

                <h2>
                  Beneficios de asociados
                </h2>

                <p>
                  Evento:{" "}
                  <strong>
                    {selectedBenefitEvent.titulo}
                  </strong>
                </p>

              </div>


              <button
                type="button"
                className="admin-button admin-button-secondary"
                onClick={
                  handleCloseBenefits
                }
              >
                Cerrar
              </button>


            </div>


            <form
              onSubmit={
                handleAssociateSearch
              }
              className="category-form"
            >

              <input
                type="text"
                placeholder="Nombre, apellido o documento"
                value={
                  associateSearch
                }
                onChange={
                  (event) =>
                    setAssociateSearch(
                      event.target.value
                    )
                }
                required
              />


              <button
                type="submit"
                className="admin-button admin-button-primary"
              >
                Buscar asociado
              </button>

            </form>


            {associateResults.length === 0 ? (

              associateSearch.trim().length >= 2 && (

                <p>
                  Realiza la búsqueda para consultar
                  los asociados disponibles.
                </p>

              )

            ) : (

              <div className="category-list">


                {associateResults.map(
                  (associate) => (

                    <div
                      key={
                        associate.id
                      }
                      className="category-item"
                    >

                      <div>

                        <strong>
                          {associate.nombres}{" "}
                          {associate.apellidos}
                        </strong>

                        <p>
                          Documento:{" "}
                          {associate.numero_documento}
                        </p>

                        <p>
                          Correo:{" "}
                          {associate.correo ||
                            "No disponible"}
                        </p>

                      </div>


                      <button
                        type="button"
                        className="admin-button admin-button-primary"
                        onClick={() =>
                          handleSelectAssociate(
                            associate
                          )
                        }
                      >
                        Seleccionar
                      </button>

                    </div>

                  )
                )}


              </div>

            )}


            {selectedAssociate && (

              <form
                className="admin-form"
                onSubmit={
                  handleSaveBenefit
                }
              >


                <div className="admin-form-group full-width">

                  <h3>
                    Asociado seleccionado
                  </h3>

                  <p>
                    <strong>
                      Nombre:
                    </strong>{" "}
                    {selectedAssociate.nombres}{" "}
                    {selectedAssociate.apellidos}
                  </p>

                  <p>
                    <strong>
                      Documento:
                    </strong>{" "}
                    {selectedAssociate.numero_documento}
                  </p>

                  <p>
                    <strong>
                      Correo:
                    </strong>{" "}
                    {selectedAssociate.correo ||
                      "No disponible"}
                  </p>

                </div>


                <div className="admin-form-group">

                  <label htmlFor="valor_asociado">
                    Valor aprobado para el asociado
                  </label>

                  <input
                    id="valor_asociado"
                    type="number"
                    name="valor_asociado"
                    min="0"
                    step="1"
                    placeholder="Ejemplo: 20000"
                    value={
                      benefitForm.valor_asociado
                    }
                    onChange={
                      handleBenefitChange
                    }
                    required
                  />

                  <small>
                    Este es el valor definido para
                    el asociado en este evento.
                  </small>

                </div>


                <div className="admin-form-group">

                  <label htmlFor="max_acompanantes_excepcion">
                    Excepción de acompañantes
                  </label>

                  <input
                    id="max_acompanantes_excepcion"
                    type="number"
                    name="max_acompanantes_excepcion"
                    min="0"
                    max="10"
                    placeholder="Ejemplo: 3"
                    value={
                      benefitForm.max_acompanantes_excepcion
                    }
                    onChange={
                      handleBenefitChange
                    }
                  />

                  <small>
                    Déjalo vacío si conserva el máximo
                    normal configurado para el evento.
                  </small>

                </div>


                <div className="admin-form-group full-width">

                  <label htmlFor="observacion">
                    Observación
                  </label>

                  <textarea
                    id="observacion"
                    name="observacion"
                    placeholder="Ejemplo: beneficio aprobado por el consejo"
                    value={
                      benefitForm.observacion
                    }
                    onChange={
                      handleBenefitChange
                    }
                  />

                </div>


                <div className="admin-actions">

                  <button
                    type="submit"
                    className="admin-button admin-button-primary"
                  >
                    Guardar beneficio
                  </button>

                </div>


              </form>

            )}

            {/* Confirmación visible incluso después de limpiar el formulario */}
            {benefitMessage && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  backgroundColor: benefitMessage.includes("correctamente") ? "#d1fae5" : "#fee2e2",
                  color: benefitMessage.includes("correctamente") ? "#065f46" : "#991b1b",
                  border: `1px solid ${benefitMessage.includes("correctamente") ? "#10b981" : "#f87171"}`,
                  borderRadius: "8px",
                  fontWeight: "bold"
                }}
              >
                {benefitMessage}
              </div>
            )}

          </section>

        )}


        {/* =====================================================
            PARTICIPANTES
        ====================================================== */}

        {selectedEvent !== null && (

          <section className="admin-section participants-section">


            <div className="participants-header">


              <h2>
                Participantes del evento
              </h2>


              <button
                type="button"
                className="admin-button admin-button-secondary"
                onClick={
                  handleCloseParticipants
                }
              >
                Cerrar
              </button>


            </div>


            <div
              className="admin-form-group"
              style={{
                marginBottom: "20px"
              }}
            >

              <label htmlFor="participant-search">
                Buscar asociado
              </label>

              <input
                id="participant-search"
                type="text"
                placeholder="Nombre, apellido o número de documento"
                value={
                  participantSearch
                }
                onChange={
                  (event) =>
                    setParticipantSearch(
                      event.target.value
                    )
                }
              />

            </div>


            {participants.length === 0 ? (

              <p>
                No hay participantes registrados.
              </p>

            ) : filteredParticipants.length === 0 ? (

              <p>
                No se encontró ningún asociado
                con ese criterio de búsqueda.
              </p>

            ) : (

              <div className="participants-list">


                {filteredParticipants.map(
                  (participant) => {

                    const attended =
                      participant.asistencia ===
                      "asistio" ||
                      Number(
                        participant.asistio
                      ) === 1;


                    return (

                      <article
                        key={
                          participant.inscripcion_id
                        }
                        className="participant-card"
                      >


                        <div>


                          <strong>
                            {participant.nombres ||
                              participant.nombre ||
                              "Sin nombre"}{" "}
                            {participant.apellidos ||
                              ""}
                          </strong>


                          <p>
                            <strong>
                              Documento:
                            </strong>{" "}
                            {participant.numero_documento ||
                              "No disponible"}
                          </p>


                          <p>
                            <strong>
                              Correo:
                            </strong>{" "}
                            {participant.correo ||
                              participant.email ||
                              "No disponible"}
                          </p>


                          <p>
                            <strong>
                              Estado:
                            </strong>{" "}
                            {participant.estado ||
                              "ACTIVA"}
                          </p>


                          <p>
                            <strong>
                              Acompañantes:
                            </strong>{" "}
                            {participant.acompanantes ||
                              0}
                          </p>


                          {participant.lista_acompanantes &&
                            participant.lista_acompanantes.length > 0 && (

                              <div className="admin-companions-list">

                                <strong>
                                  Datos de acompañantes:
                                </strong>


                                {participant.lista_acompanantes.map(
                                  (companion) => (

                                    <div
                                      key={
                                        companion.id
                                      }
                                      className="admin-companion-card"
                                    >

                                      <p>
                                        <strong>
                                          Nombre:
                                        </strong>{" "}
                                        {companion.nombres}{" "}
                                        {companion.apellidos ||
                                          ""}
                                      </p>


                                      <p>
                                        <strong>
                                          Documento:
                                        </strong>{" "}
                                        {companion.numero_documento}
                                      </p>


                                      <p>
                                        <strong>
                                          Edad:
                                        </strong>{" "}
                                        {companion.edad}
                                      </p>


                                      <p>
                                        <strong>
                                          Parentesco:
                                        </strong>{" "}
                                        {companion.parentesco}
                                      </p>


                                    </div>

                                  )
                                )}


                              </div>

                          )}


                          <p>
                            <strong>
                              Fecha de inscripción:
                            </strong>{" "}
                            {participant.fecha_inscripcion
                              ? new Date(
                                  participant.fecha_inscripcion
                                ).toLocaleDateString(
                                  "es-CO"
                                )
                              : "No disponible"}
                          </p>


                        </div>


                        <div className="attendance-control">


                          {attended ? (

                            <>

                              <p>
                                <strong>
                                  ✓ Asistió
                                </strong>
                              </p>


                              <button
                                type="button"
                                className="admin-button admin-button-secondary"
                                onClick={() =>
                                  handleRemoveAttendance(
                                    participant.inscripcion_id
                                  )
                                }
                              >
                                Quitar asistencia
                              </button>

                            </>

                          ) : (

                            <>

                              <p>
                                <strong>
                                  Asistencia pendiente
                                </strong>
                              </p>


                              <button
                                type="button"
                                className="admin-button admin-button-primary"
                                onClick={() =>
                                  handleMarkAttendance(
                                    participant.inscripcion_id
                                  )
                                }
                              >
                                Marcar como asistió
                              </button>

                            </>

                          )}


                          <button
                            type="button"
                            className="admin-button admin-button-danger"
                            style={{
                              marginTop: "10px"
                            }}
                            onClick={() =>
                              handleDeleteRegistration(
                                participant
                              )
                            }
                          >
                            Eliminar inscripción
                          </button>


                        </div>


                      </article>

                    );
                  }
                )}


              </div>

            )}


          </section>

        )}


      </div>


      {/* =====================================================
          REPORTES
      ====================================================== */}

      <Reportes />


    </main>
  );
}


export default Admin;