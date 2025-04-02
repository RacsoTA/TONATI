import api from "./axios";

export const getBandejasDisponibles = async () => {
  try {
    const response = await api.get("/bandejas/disponibles");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBandejasActivas = async () => {
  try {
    const response = await api.get("/bandejas/activas");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const activarBandeja = async (id_bandeja, tipo) => {
  try {
    const response = await api.put("/bandejas/activar", {
      id_bandeja,
      tipo,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const finalizarBandeja = async (id_bandeja) => {
  try {
    const response = await api.put("/bandejas/finalizar", {
      id_bandeja,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateBandeja = async (id, data) => {
  try {
    const response = await api.put(`/bandejas/update/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBandejaPendiente = async () => {
  try {
    const response = await api.get("/bandejas/pendiente");
    return response.data;
  } catch (error) {
    throw error;
  }
};
