import React from "react";
import api from "../api/axios";

const BandejasDisponibles = ({
  bandejas,
  onBandejaSelected,
  refreshBandejas,
}) => {
  const handleSeleccionarBandeja = async (id_bandeja) => {
    try {
      await api.put("/bandejas/comenzarProceso/", { id_bandeja });
      refreshBandejas();
      onBandejaSelected(id_bandeja);
    } catch (error) {
      console.error("Error al seleccionar bandeja:", error);
      alert("Error al seleccionar la bandeja");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bandejas.map((bandeja) => (
        <div key={bandeja.id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">
            Bandeja {bandeja.id_bandeja}
          </h3>
          <div className="space-y-2">
            <p>Temperatura: {bandeja.temperaturaActual}°C</p>
            <p>Humedad: {bandeja.humedadActual}%</p>
            <button
              onClick={() => handleSeleccionarBandeja(bandeja.id_bandeja)}
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Seleccionar Bandeja
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BandejasDisponibles;
