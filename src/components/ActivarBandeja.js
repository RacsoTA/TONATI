import React, { useState, useEffect } from "react";
import { activarBandeja, updateBandeja } from "../api/bandejas";
import { getParametros } from "../api/parametros";

const ActivarBandeja = ({
  bandeja_id,
  onBandejaActivated,
  refreshBandejas,
}) => {
  const [selectedTipo, setSelectedTipo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parametros, setParametros] = useState(null);

  // Fetch parameter data to show temperature ranges
  useEffect(() => {
    const loadParametros = async () => {
      try {
        const data = await getParametros();
        setParametros(data);
      } catch (err) {
        console.error("Error al cargar parámetros:", err);
      }
    };

    loadParametros();
  }, []);

  const handleTipoChange = (e) => {
    setSelectedTipo(e.target.value);
  };

  const handleActivarBandeja = async () => {
    if (!selectedTipo) {
      setError("Debe seleccionar un tipo de alimento");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Activando bandeja ${bandeja_id} con tipo: ${selectedTipo}`);

      // First, activate the bandeja with the selected tipo
      await activarBandeja(bandeja_id, selectedTipo);

      // Then update the motor and resistencia states
      await updateBandeja(bandeja_id, {
        estadoMotor: true,
        estadoResistencia: true,
        ultimaActualizacion: new Date(),
      });

      console.log("Bandeja activada exitosamente");
      refreshBandejas();
      onBandejaActivated();
    } catch (err) {
      console.error("Error al activar bandeja:", err);
      setError(`Error al activar la bandeja: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Activar Bandeja {bandeja_id}
      </h2>

      <div className="space-y-6">
        <div className="bg-gray-700 p-6 rounded-lg">
          <label className="block text-lg font-medium mb-2">
            Seleccione el tipo de alimento:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {["Carne", "Fruta", "Verdura"].map((tipo) => (
              <div
                key={tipo}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTipo === tipo
                    ? "border-green-500 bg-green-900/30"
                    : "border-gray-600 hover:border-gray-400"
                }`}
                onClick={() => setSelectedTipo(tipo)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{tipo}</span>
                  <input
                    type="radio"
                    name="tipoAlimento"
                    value={tipo}
                    checked={selectedTipo === tipo}
                    onChange={handleTipoChange}
                    className="form-radio h-5 w-5 text-green-500"
                  />
                </div>
                {parametros && parametros[tipo] && (
                  <div className="mt-2 text-sm text-gray-400">
                    <div>Temp. Min: {parametros[tipo].minTemp}°C</div>
                    <div>Temp. Max: {parametros[tipo].maxTemp}°C</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
          <h3 className="text-xl font-semibold mb-2 text-yellow-400">
            Instrucciones:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-100">
            <li>Verifique que la bandeja esté limpia</li>
            <li>Coloque el alimento en la bandeja de manera uniforme</li>
            <li>Asegúrese de que la bandeja esté correctamente posicionada</li>
            <li>Seleccione el tipo de alimento adecuado</li>
            <li>Confirme cuando esté listo para iniciar el proceso</li>
          </ol>
        </div>

        <div className="bg-blue-900/30 border border-blue-700 p-4 rounded mb-4">
          <h3 className="text-xl font-semibold mb-2 text-blue-400">
            Al activar el proceso:
          </h3>
          <ul className="list-disc list-inside space-y-2 text-blue-100">
            <li>El motor se activará automáticamente</li>
            <li>La resistencia se activará automáticamente</li>
            <li>
              El proceso seguirá los parámetros de temperatura para{" "}
              {selectedTipo || "[seleccione un tipo]"}
            </li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 p-4 rounded text-red-100">
            {error}
          </div>
        )}

        <button
          onClick={handleActivarBandeja}
          disabled={loading || !selectedTipo}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
            loading || !selectedTipo
              ? "bg-gray-600 text-gray-300 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {loading ? "Activando..." : "Confirmar y Activar Proceso"}
        </button>
      </div>
    </div>
  );
};

export default ActivarBandeja;
