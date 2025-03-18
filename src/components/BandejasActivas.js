import React, { useState, useEffect } from "react";
import api from "../api/axios";

const BandejasActivas = () => {
  const [bandejasActivas, setBandejasActivas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBandejasActivas = async () => {
    try {
      const response = await api.get("/bandejas/activas");
      console.log("Complete API Response:", response.data);
      console.log("First bandeja complete object:", response.data.bandejas[0]);
      setBandejasActivas(response.data.bandejas);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener bandejas activas:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBandejasActivas();
    const interval = setInterval(fetchBandejasActivas, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-center">Cargando procesos activos...</div>;
  }

  if (bandejasActivas.length === 0) {
    return (
      <div className="text-center text-gray-400">No hay procesos activos</div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Procesos Activos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bandejasActivas.map((bandeja) => {
          console.log("Complete bandeja object:", bandeja);
          console.log(
            `Bandeja ${bandeja.id_bandeja} - Motor:`,
            bandeja.motor,
            "Type:",
            typeof bandeja.motor
          );
          console.log(
            `Bandeja ${bandeja.id_bandeja} - Resistencia:`,
            bandeja.resistencia,
            "Type:",
            typeof bandeja.resistencia
          );
          return (
            <div
              key={bandeja.bandeja_id}
              className="bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-green-500"
            >
              <h3 className="text-xl font-semibold mb-4">
                Bandeja {bandeja.id_bandeja}
              </h3>
              <div className="space-y-2">
                <p>Temperatura: {bandeja.temperaturaActual}°C</p>
                <p>Humedad: {bandeja.humedadActual}%</p>
                <div className="mt-4 flex gap-2">
                  <div
                    className={`flex-1 p-2 rounded ${
                      Number(bandeja.motor) === 1
                        ? "bg-green-900/50 text-green-400"
                        : "bg-red-900/50 text-red-400"
                    }`}
                  >
                    Motor:{" "}
                    {Number(bandeja.motor) === 1 ? "Encendido" : "Apagado"}
                  </div>
                  <div
                    className={`flex-1 p-2 rounded ${
                      Number(bandeja.resistencia) === 1
                        ? "bg-green-900/50 text-green-400"
                        : "bg-red-900/50 text-red-400"
                    }`}
                  >
                    Resistencia:{" "}
                    {Number(bandeja.resistencia) === 1
                      ? "Encendida"
                      : "Apagada"}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  Última actualización:{" "}
                  {new Date(bandeja.ultimaActualizacion).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BandejasActivas;
