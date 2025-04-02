import React, { useState, useEffect } from "react";
import {
  getParametros,
  updateParametro,
  initializeParametros,
} from "../api/parametros";

const Parametros = () => {
  const [parametros, setParametros] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTipo, setEditingTipo] = useState(null);
  const [tempValues, setTempValues] = useState({
    maxTemp: "",
    minTemp: "",
  });

  useEffect(() => {
    loadParametros();
  }, []);

  const loadParametros = async () => {
    try {
      setLoading(true);
      const data = await getParametros();
      setParametros(data);
      setError(null);
    } catch (err) {
      setError("Error al cargar los parámetros");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async () => {
    try {
      await initializeParametros();
      await loadParametros();
    } catch (err) {
      setError("Error al inicializar los parámetros");
      console.error(err);
    }
  };

  const handleEdit = (tipo, valores) => {
    setEditingTipo(tipo);
    setTempValues({
      maxTemp: valores.maxTemp,
      minTemp: valores.minTemp,
    });
  };

  const handleSave = async () => {
    try {
      await updateParametro(editingTipo, tempValues);
      setEditingTipo(null);
      await loadParametros();
    } catch (err) {
      setError("Error al actualizar los parámetros");
      console.error(err);
    }
  };

  const handleCancel = () => {
    setEditingTipo(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempValues((prev) => ({
      ...prev,
      [name]: parseFloat(value),
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-16">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-900 border border-red-700 text-red-100 px-3 py-2 rounded relative"
        role="alert"
      >
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-start mb-3">
        <button
          onClick={handleInitialize}
          className="bg-gray-600 transition-all duration-300  hover:bg-green-700 text-white font-medium py-1 px-3 rounded text-sm"
        >
          Reiniciar Parámetros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-800 rounded-lg p-6 shadow-lg">
        {parametros &&
          Object.entries(parametros).map(([tipo, valores]) => (
            <div
              key={tipo}
              className="bg-gray-800 rounded-lg shadow-md p-3 border border-gray-700"
            >
              <h3 className="text-lg font-semibold mb-2 text-white">{tipo}</h3>

              {editingTipo === tipo ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-medium text-gray-300 w-24">
                      Temp. Máxima (°C)
                    </label>
                    <input
                      type="number"
                      name="maxTemp"
                      value={tempValues.maxTemp}
                      onChange={handleInputChange}
                      className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1 px-2 text-sm"
                      step="0.1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-medium text-gray-300 w-24">
                      Temp. Mínima (°C)
                    </label>
                    <input
                      type="number"
                      name="minTemp"
                      value={tempValues.minTemp}
                      onChange={handleInputChange}
                      className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1 px-2 text-sm"
                      step="0.1"
                    />
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={handleSave}
                      className="bg-blue-600 transition-all duration-300 hover:animate-pulse hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-sm"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-1 px-3 rounded text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400">
                      Temp. Máxima ⬆︎
                    </span>
                    <span className="text-sm font-medium text-white">
                      {valores.maxTemp}°C
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-gray-400">
                      Temp. Mínima ⬇︎
                    </span>
                    <span className="text-sm font-medium text-white">
                      {valores.minTemp}°C
                    </span>
                  </div>
                  <button
                    onClick={() => handleEdit(tipo, valores)}
                    className="bg-blue-600 transition-all duration-300  hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-sm w-full"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default Parametros;
