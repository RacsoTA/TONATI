import React, { useState, useEffect } from "react";
import api from "./api/axios";
import BandejasDisponibles from "./components/BandejasDisponibles";
import BandejaPendiente from "./components/BandejaPendiente";
import BandejasActivas from "./components/BandejasActivas";

function App() {
  const [bandejas, setBandejas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBandeja, setSelectedBandeja] = useState(null);
  const [step, setStep] = useState("disponibles"); // disponibles, pendiente, activas

  const fetchBandejas = async () => {
    try {
      const response = await api.get("/bandejas/");
      setBandejas(
        response.data.filter((bandeja) => bandeja.estatus === "disponible")
      );
      setLoading(false);
    } catch (err) {
      setError("Error al cargar las bandejas");
      setLoading(false);
    }
  };

  const handleBandejaSelected = (id_bandeja) => {
    setSelectedBandeja(id_bandeja);
    setStep("pendiente");
  };

  const handleBandejaActivated = () => {
    setStep("activas");
    setSelectedBandeja(null);
  };

  const handleStopAllBandejas = async () => {
    try {
      setLoading(true);
      // Get all bandejas first
      const response = await api.get("/bandejas/");
      const allBandejas = response.data;

      // Update each bandeja
      const updatePromises = allBandejas.map((bandeja) =>
        api.put(`/bandejas/update/${bandeja.id}`, {
          motor: 0,
          resistencia: 0,
          estatus: "disponible",
          ultimaActualizacion: new Date(),
        })
      );

      await Promise.all(updatePromises);

      // Refresh the view
      await fetchBandejas();
      setStep("disponibles");
    } catch (error) {
      console.error("Error al detener las bandejas:", error);
      alert("Error al detener las bandejas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBandejas();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Cargando bandejas...</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center">Sistema de Bandejas</h1>
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleStopAllBandejas}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Detener Todas las Bandejas
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {step === "disponibles" && (
          <>
            <h2 className="text-2xl font-semibold mb-6">
              Bandejas Disponibles
            </h2>
            <BandejasDisponibles
              bandejas={bandejas}
              onBandejaSelected={handleBandejaSelected}
              refreshBandejas={fetchBandejas}
            />
          </>
        )}

        {step === "pendiente" && selectedBandeja && (
          <BandejaPendiente
            bandeja_id={selectedBandeja}
            onBandejaActivated={handleBandejaActivated}
            refreshBandejas={fetchBandejas}
          />
        )}

        {step === "activas" && (
          <>
            <div className="mb-6">
              <button
                onClick={() => setStep("disponibles")}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Ver Bandejas Disponibles
              </button>
            </div>
            <BandejasActivas />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
