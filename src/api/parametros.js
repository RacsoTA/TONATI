import api from "./axios";

export const getParametros = async () => {
  try {
    const response = await api.get("/parametros");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getParametro = async (tipo) => {
  try {
    const response = await api.get(`/parametros/${tipo}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateParametro = async (tipo, data) => {
  try {
    const response = await api.put(`/parametros/${tipo}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const initializeParametros = async () => {
  try {
    const response = await api.post("/parametros/initialize");
    return response.data;
  } catch (error) {
    throw error;
  }
};
