import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { getParametros } from "../api/parametros";

const BandejasActivas = () => {
  const [bandejasActivas, setBandejasActivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parametros, setParametros] = useState(null);

  const fetchBandejasActivas = async () => {
    try {
      const response = await api.get("/bandejas/activas");
      console.log("==== FETCH BANDEJAS ACTIVAS RESPONSE ====");
      console.log("Complete API Response:", response.data);

      if (response.data.bandejas && response.data.bandejas.length > 0) {
        console.log(
          "First bandeja complete object:",
          response.data.bandejas[0]
        );
        console.log(
          "Bandeja types available:",
          response.data.bandejas.map((b) => b.tipo || "No tipo").join(", ")
        );
        console.log(
          "Temperature readings:",
          response.data.bandejas
            .map(
              (b) =>
                `Bandeja ${b.id_bandeja} (${b.tipo || "No tipo"}): ${
                  b.temperaturaActual
                }°C`
            )
            .join(", ")
        );
      }

      setBandejasActivas(response.data.bandejas);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener bandejas activas:", error);
      setLoading(false);
    }
  };

  const loadParametros = async () => {
    try {
      const data = await getParametros();
      console.log("==== PARAMETROS LOADED ====");
      console.log("All parameters:", data);

      // Log details of each food type parameter
      Object.entries(data).forEach(([tipo, valores]) => {
        console.log(
          `${tipo} - Max Temp: ${valores.maxTemp}°C, Min Temp: ${valores.minTemp}°C`
        );
      });

      setParametros(data);
    } catch (error) {
      console.error("Error al cargar parámetros:", error);
    }
  };

  useEffect(() => {
    console.log("==== COMPONENT MOUNTED ====");
    fetchBandejasActivas();
    loadParametros();
    const interval = setInterval(fetchBandejasActivas, 5000); // Refresh every 5 seconds
    return () => {
      console.log("==== COMPONENT UNMOUNTED ====");
      clearInterval(interval);
    };
  }, []);

  // When bandejas or parametros update, log relationship info
  useEffect(() => {
    if (bandejasActivas.length > 0 && parametros) {
      console.log("==== MATCHING BANDEJAS WITH PARAMETERS ====");
      bandejasActivas.forEach((bandeja) => {
        const tipoParams = parametros[bandeja.tipo];
        if (tipoParams) {
          console.log(`Bandeja ${bandeja.id_bandeja} (${bandeja.tipo}): 
            Current temp: ${bandeja.temperaturaActual}°C, 
            Min: ${tipoParams.minTemp}°C, 
            Max: ${tipoParams.maxTemp}°C, 
            Status: ${
              bandeja.temperaturaActual >= tipoParams.minTemp &&
              bandeja.temperaturaActual <= tipoParams.maxTemp
                ? "Optimal"
                : bandeja.temperaturaActual < tipoParams.minTemp
                ? "Too Cold"
                : "Too Hot"
            }`);
        } else {
          console.log(
            `Bandeja ${bandeja.id_bandeja}: No matching parameters for type "${bandeja.tipo}"`
          );
        }
      });
    }
  }, [bandejasActivas, parametros]);

  const getTempColorClass = (actual, min, max) => {
    if (!min || !max) return "bg-red-500";

    // All red color scheme with varying intensities
    if (actual <= min - 10) return "bg-red-300"; // Coolest (lighter red)
    if (actual < min) return "bg-red-400";
    if (actual > max + 5) return "bg-red-900"; // Hottest (darkest red)
    if (actual > max) return "bg-red-700";

    // Within range - gradient from lighter to darker red as it approaches max
    const rangePosition = (actual - min) / (max - min);
    if (rangePosition < 0.33) return "bg-red-500";
    if (rangePosition < 0.66) return "bg-red-600";
    return "bg-red-700"; // Approaching hot
  };

  const getTempPercentage = (actual, min, max) => {
    if (!min || !max) return 50;

    // Calculate based on range from (min-15) to max
    const adjustedMin = min - 15;
    const totalRange = max - adjustedMin + 10; // Add 10 degrees to max for better visualization

    if (actual <= adjustedMin) return 0;
    if (actual >= max + 10) return 100;

    return Math.round(((actual - adjustedMin) / totalRange) * 100);
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bandejasActivas.map((bandeja) => {
          const tipoParametros = parametros && parametros[bandeja.tipo];
          const minTemp = tipoParametros ? tipoParametros.minTemp : null;
          const maxTemp = tipoParametros ? tipoParametros.maxTemp : null;
          const temperaturaActual = bandeja.temperaturaActual;

          console.log(
            `Rendering bandeja ${bandeja.id_bandeja} - Type: ${bandeja.tipo}, Current temp: ${temperaturaActual}°C, Max temp: ${maxTemp}°C`
          );

          const tempPercentage = getTempPercentage(
            temperaturaActual,
            minTemp,
            maxTemp
          );
          const tempColorClass = getTempColorClass(
            temperaturaActual,
            minTemp,
            maxTemp
          );

          return (
            <div
              key={bandeja.bandeja_id}
              className="bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-green-500"
            >
              <h3 className="text-xl font-semibold mb-4">
                Bandeja {bandeja.id_bandeja}
                {bandeja.tipo && (
                  <span className="text-sm ml-2 text-gray-400">
                    ({bandeja.tipo})
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span>Temperatura Actual:</span>
                    <span
                      className={`font-semibold ${
                        temperaturaActual > maxTemp
                          ? "text-red-400"
                          : temperaturaActual < minTemp
                          ? "text-blue-400"
                          : "text-green-400"
                      }`}
                    >
                      {temperaturaActual}°C / {maxTemp ? `${maxTemp}°C` : "??"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-6 rounded-full transition-all duration-500 ${tempColorClass} relative`}
                      style={{ width: `${tempPercentage}%` }}
                    >
                      {tempPercentage > 15 && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white shadow-sm">
                          {maxTemp ? `${maxTemp}°C máx` : "??"}
                        </span>
                      )}
                    </div>
                  </div>
                  {tipoParametros && (
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span className="text-blue-400">{minTemp - 15}°C</span>
                      <span className="text-green-400">{minTemp}°C</span>
                      <span className="text-red-400">{maxTemp}°C</span>
                    </div>
                  )}
                </div>

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
