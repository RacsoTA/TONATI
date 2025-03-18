import React from "react";
import api from "../api/axios";

const BandejaPendiente = ({
  bandeja_id,
  onBandejaActivated,
  refreshBandejas,
}) => {
  const handleActivarBandeja = async () => {
    try {
      // First, get the bandeja to obtain its document ID
      const bandejasResponse = await api.get("/bandejas/");
      const bandeja = bandejasResponse.data.find(
        (b) => b.id_bandeja === bandeja_id
      );

      if (!bandeja) {
        throw new Error("Bandeja no encontrada");
      }

      // First activate the bandeja
      await api.put("/bandejas/activar/", {
        id_bandeja: bandeja_id,
      });

      // Then update the motor and resistencia states with numeric values
      await api.put(`/bandejas/update/${bandeja.id}`, {
        motor: 1, // 1 for on
        resistencia: 1, // 1 for on
        ultimaActualizacion: new Date(),
      });

      refreshBandejas();
      onBandejaActivated();
    } catch (error) {
      console.error("Error al activar bandeja:", error);
      alert("Error al activar la bandeja");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Bandeja {bandeja_id} Seleccionada
      </h2>

      <div className="space-y-6">
        <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded">
          <h3 className="text-xl font-semibold mb-2 text-yellow-400">
            Instrucciones:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-100">
            <li>Verifique que la bandeja esté limpia</li>
            <li>Coloque el alimento en la bandeja de manera uniforme</li>
            <li>Asegúrese de que la bandeja esté correctamente posicionada</li>
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
            <li>El proceso de secado comenzará inmediatamente</li>
          </ul>
        </div>

        <button
          onClick={handleActivarBandeja}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          Confirmar y Activar Proceso
        </button>
      </div>
    </div>
  );
};

export default BandejaPendiente;
