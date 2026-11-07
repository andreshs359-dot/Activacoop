// servicio de api de react

const API_URL =
"http://localhost:3000/api";

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

const getAuthHeaders = () => {

const token = localStorage.getItem("token");

return {

"Content-Type":
  "application/json",

Authorization:
  `Bearer ${token}`

};

};

// ==========================================
// EVENTOS
// ==========================================

// Obtener todos los eventos

export const getEvents =
async () => {


const response =
  await fetch(
    `${API_URL}/eventos`
  );


return response.json();

};


// Obtener evento por ID

export const getEventById =
async (id) => {


const response =
  await fetch(
    `${API_URL}/eventos/${id}`
  );


if (
  !response.ok
) {

  throw new Error(
    "Evento no encontrado"
  );

}


return response.json();


};

// Crear evento

export const createEvent =
async (eventData) => {

const response =
  await fetch(

    `${API_URL}/eventos`,

    {

      method:
        "POST",

      headers:
        getAuthHeaders(),

      body:
        JSON.stringify(
          eventData
        )

    }

  );


const data =
  await response.json();


if (
  !response.ok
) {

  throw new Error(
    data.message ||
    "Error al crear el evento"
  );

}


return data;


};

// Actualizar evento

export const updateEvent =
async (
id,
eventData
) => {


const response =
  await fetch(

    `${API_URL}/eventos/${id}`,

    {

      method:
        "PUT",

      headers:
        getAuthHeaders(),

      body:
        JSON.stringify(
          eventData
        )

    }

  );


const data =
  await response.json();


if (
  !response.ok
) {

  throw new Error(
    data.message ||
    "Error al actualizar el evento"
  );

}


return data;


};

// Eliminar evento

export const deleteEvent =
async (id) => {


const response =
  await fetch(

    `${API_URL}/eventos/${id}`,

    {

      method:
        "DELETE",

      headers:
        getAuthHeaders()

    }

  );


const data =
  await response.json();


if (
  !response.ok
) {

  throw new Error(
    data.message ||
    "Error al eliminar el evento"
  );

}


return data;


};

// ==========================================
// AUTENTICACIÓN
// ==========================================

export const registerUser =
async (userData) => {


const response =
  await fetch(

    `${API_URL}/auth/registro`,

    {

      method:
        "POST",

      headers: {

        "Content-Type":
          "application/json"

      },

      body:
        JSON.stringify(
          userData
        )

    }

  );


const data =
  await response.json();


if (
  !response.ok
) {

  throw new Error(
    data.message ||
    "Error al registrar usuario"
  );

}


return data;


};

export const loginUser =
async (numeroDocumento, password) => {

  const response =
    await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          numeroDocumento,
          password
        })
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Error al iniciar sesión"
    );
  }

  return data;
};


//==========//=========//=============//
//===================//==============//

export const getProfile =
async () => {


const token =
  localStorage.getItem(
    "token"
  );


const response =
  await fetch(

    `${API_URL}/auth/perfil`,

    {

      headers: {

        Authorization:
          `Bearer ${token}`

      }

    }

  );


const data =
  await response.json();


return data;


};


// ==========================================
// INSCRIPCIONES
// ==========================================

// Crear inscripción

export const createRegistration = async (registrationData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/inscripciones`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(registrationData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Error al realizar la inscripción"
    );
  }

  return data;
};

/**
 * Obtener mis inscripciones
 */

export const getMyRegistrations = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/inscripciones/mis-inscripciones`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Error al consultar las inscripciones"
    );
  }

  return data;
};

// ==========================================
// ELIMINAR INSCRIPCIÓN - ADMINISTRADOR
// ==========================================

export const deleteRegistration =
async (id) => {

  const response =
    await fetch(
      `${API_URL}/inscripciones/${id}`,
      {
        method: "DELETE",

        headers:
          getAuthHeaders()
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.message ||
      "Error al eliminar la inscripción"
    );
  }

  return data;
};


//===================================
// funciones de categorias en api.js
//===================================
export const getCategories =
async () => {


const response =
  await fetch(
    `${API_URL}/categorias`
  );


const data =
  await response.json();


if (
  !response.ok
) {

  throw new Error(
    "Error al obtener categorías"
  );

}


return data;


};

export const createCategory =
async (
categoryData
) => {


const response =
  await fetch(

    `${API_URL}/categorias`,

    {

      method:
        "POST",

      headers:
        getAuthHeaders(),

      body:
        JSON.stringify(
          categoryData
        )
    }
  );


const data =
  await response.json();


if (
  !response.ok
) {

  throw new Error(
    data.message ||
    "Error al crear categoría"
  );

}


return data;


};

export const deleteCategory =
async (
id
) => {


const response =
  await fetch(

    `${API_URL}/categorias/${id}`,

    {

      method:
        "DELETE",

      headers:
        getAuthHeaders()

    }
  );


const data =
  await response.json();


if (
  !response.ok
) {

  throw new Error(
    data.message ||
    "Error al eliminar categoría"
  );
}

return data;
};

//===================================
// funciones administración de participantes
//===================================



export const getEventParticipants =
async (
eventoId
) => {


const response =
  await fetch(

    `${API_URL}/inscripciones/evento/${eventoId}/participantes`,

    {

      headers:
        getAuthHeaders()

    }

  );


const data =
  await response.json();


if (
  !response.ok
) {

  throw new Error(
    data.message ||
    "Error al obtener participantes"
  );

}


return data;


};

export const updateAttendance =
async (


registrationId,

asistencia


) => {


const response =
  await fetch(

    `${API_URL}/inscripciones/${registrationId}/asistencia`,

    {

      method:
        "PUT",

      headers:
        getAuthHeaders(),

      body:
        JSON.stringify({

          asistencia

        })

    }

  );


const data =
  await response.json();

if (
  !response.ok
) {

  throw new Error(
    data.message ||
    "Error al actualizar asistencia"
  );

}

return data;

};


export const getStatistics = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/estadisticas`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Error al consultar las estadísticas"
    );
  }

  return data;
};

// ==========================================
// CONFIGURACIÓN DE COBROS
// ==========================================


// Obtener configuración de cobro de un evento
export const getBillingConfig =
async (eventoId) => {

  const response =
    await fetch(
      `${API_URL}/cobros/evento/${eventoId}/configuracion`,
      {
        headers:
          getAuthHeaders()
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.message ||
      "Error al consultar la configuración de cobro"
    );
  }


  return data;
};


// Guardar o actualizar configuración de cobro
export const saveBillingConfig =
async (
  eventoId,
  configData
) => {

  const response =
    await fetch(
      `${API_URL}/cobros/evento/${eventoId}/configuracion`,
      {
        method:
          "PUT",

        headers:
          getAuthHeaders(),

        body:
          JSON.stringify(
            configData
          )
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.message ||
      "Error al guardar la configuración de cobro"
    );
  }


  return data;
};


// ==========================================
// CUOTAS DEL EVENTO
// ==========================================


// Consultar cuotas del evento
export const getEventInstallments =
async (eventoId) => {

  const response =
    await fetch(
      `${API_URL}/cobros/evento/${eventoId}/cuotas`,
      {
        headers:
          getAuthHeaders()
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.message ||
      "Error al consultar las cuotas del evento"
    );
  }


  return data;
};


// Guardar cuotas del evento
export const saveEventInstallments =
async (
  eventoId,
  cuotas
) => {

  const response =
    await fetch(
      `${API_URL}/cobros/evento/${eventoId}/cuotas`,
      {
        method:
          "PUT",

        headers:
          getAuthHeaders(),

        body:
          JSON.stringify({
            cuotas
          })
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.message ||
      "Error al guardar las cuotas del evento"
    );
  }


  return data;
};
// ==========================================
// BENEFICIOS DE ASOCIADOS
// ==========================================


// Buscar asociados
export const searchAssociates =
async (searchText) => {

  const response =
    await fetch(
      `${API_URL}/cobros/asociados/buscar?q=${encodeURIComponent(
        searchText
      )}`,
      {
        headers:
          getAuthHeaders()
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.message ||
      "Error al buscar asociados"
    );
  }


  return data;
};


// Consultar beneficio del asociado
export const getAssociateBenefit =
async (
  eventoId,
  usuarioId
) => {

  const response =
    await fetch(
      `${API_URL}/cobros/evento/${eventoId}/asociado/${usuarioId}/beneficio`,
      {
        headers:
          getAuthHeaders()
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.message ||
      "Error al consultar el beneficio del asociado"
    );
  }


  return data;
};
// ==========================================
// CONSULTAR MI BENEFICIO PARA UN EVENTO
// ==========================================

export const getMyEventBenefit = async (eventoId) => {

  const response = await fetch(
    `${API_URL}/cobros/evento/${eventoId}/mi-beneficio`,
    {
      method: "GET",
      headers: getAuthHeaders()
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Error al consultar mi beneficio para el evento"
    );
  }

  return data;
};

// Guardar o actualizar beneficio
export const saveAssociateBenefit =
async (
  eventoId,
  usuarioId,
  benefitData
) => {

  const response =
    await fetch(
      `${API_URL}/cobros/evento/${eventoId}/asociado/${usuarioId}/beneficio`,
      {
        method:
          "PUT",

        headers:
          getAuthHeaders(),

        body:
          JSON.stringify(
            benefitData
          )
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.message ||
      "Error al guardar el beneficio del asociado"
    );
  }


  return data;
};