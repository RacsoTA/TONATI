import React, { useState, useEffect } from "react";
import api from "./api/axios";
import BandejasDisponibles from "./components/BandejasDisponibles";
import BandejaPendiente from "./components/BandejaPendiente";
import BandejasActivas from "./components/BandejasActivas";
import Parametros from "./components/Parametros";
import { getParametros } from "./api/parametros";

function App() {
  const [bandejas, setBandejas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBandeja, setSelectedBandeja] = useState(null);
  const [showParametros, setShowParametros] = useState(true);
  const [showActivas, setShowActivas] = useState(true);
  const [showDisponibles, setShowDisponibles] = useState(true);
  const [showAlmacen, setShowAlmacen] = useState(true);
  const [almacen, setAlmacen] = useState(null);

  // New state for the "Nuevo Proceso" modal
  const [showNuevoProcesoModal, setShowNuevoProcesoModal] = useState(false);
  const [availableBandejas, setAvailableBandejas] = useState([]);
  const [loadingBandejas, setLoadingBandejas] = useState(false);
  const [selectedBandejaId, setSelectedBandejaId] = useState("");
  const [newBandejaType, setNewBandejaType] = useState("");
  const [creating, setCreating] = useState(false);
  const [parametros, setParametros] = useState(null);

  const fetchBandejas = async () => {
    try {
      const response = await api.get("/bandejas/");
      setBandejas(response.data);
      setLoading(false);
    } catch (err) {
      setError("Error al cargar las bandejas");
      setLoading(false);
    }
  };

  const handleBandejaSelected = (id_bandeja) => {
    setSelectedBandeja(id_bandeja);
  };

  const handleBandejaActivated = () => {
    setSelectedBandeja(null);
    fetchBandejas();
  };

  const handleStopAllBandejas = async () => {
    try {
      setLoading(true);
      // Get all bandejas first
      const response = await api.get("/bandejas/");
      const allBandejas = response.data;

      // Update each bandeja
      const regularBandejas = allBandejas.filter(
        (bandeja) => bandeja.id_bandeja !== 11
      );
      const updatePromises = regularBandejas.map((bandeja) =>
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
    } catch (error) {
      console.error("Error al detener las bandejas:", error);
      alert("Error al detener las bandejas");
    } finally {
      setLoading(false);
    }
  };

  // New function to load parameter data
  const loadParametros = async () => {
    try {
      const data = await getParametros();
      setParametros(data);
    } catch (error) {
      console.error("Error al cargar parámetros:", error);
    }
  };

  // New function to fetch available bandejas
  const fetchBandejasDisponibles = async () => {
    setLoadingBandejas(true);
    try {
      console.log("====== FETCHING AVAILABLE BANDEJAS ======");
      console.log("API endpoint: GET /bandejas");

      const response = await api.get("/bandejas");
      console.log("GET /bandejas response:", response);

      // Filter for bandejas with status "disponible"
      let availableBandejas = [];
      if (response.data && Array.isArray(response.data)) {
        console.log("Data is direct array, filtering...");
        availableBandejas = response.data.filter(
          (bandeja) => bandeja.estatus === "disponible"
        );
      } else if (response.data && Array.isArray(response.data.bandejas)) {
        console.log("Data is nested in bandejas property, filtering...");
        availableBandejas = response.data.bandejas.filter(
          (bandeja) => bandeja.estatus === "disponible"
        );
      }

      console.log("Available bandejas after filtering:", availableBandejas);
      console.log("Available bandejas count:", availableBandejas.length);

      if (availableBandejas.length > 0) {
        console.log("First available bandeja:", availableBandejas[0]);
      }

      setAvailableBandejas(availableBandejas);
    } catch (error) {
      console.error("Error fetching available bandejas:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        request: error.request ? "Request exists" : "No request",
      });
      setAvailableBandejas([]);
    } finally {
      setLoadingBandejas(false);
    }
  };

  // New function to handle opening the Nuevo Proceso modal
  const handleOpenNuevoProcesoModal = () => {
    fetchBandejasDisponibles();
    setShowNuevoProcesoModal(true);
  };

  // New function to handle creating a new process
  const handleNewBandeja = async () => {
    if (!newBandejaType || !selectedBandejaId) return;

    setCreating(true);
    try {
      console.log("====== STARTING NEW PROCESS FLOW ======");
      console.log("Data to send:", {
        id_bandeja: selectedBandejaId,
        tipo: newBandejaType,
      });

      // Step 1: Mark bandeja as pending using the PUT /bandejas/comenzarProceso endpoint
      console.log("Step 1: Marking bandeja as pending...");
      console.log("Endpoint: PUT /bandejas/comenzarProceso/");
      const pendingResponse = await api.put("/bandejas/comenzarProceso/", {
        id_bandeja: selectedBandejaId,
      });
      console.log(
        "✅ Successfully marked bandeja as pending:",
        pendingResponse.data
      );

      // Step 2: Activate bandeja with food type using PUT /bandejas/activar
      console.log("Step 2: Activating bandeja with food type...");
      console.log("Endpoint: PUT /bandejas/activar/");
      const activateResponse = await api.put("/bandejas/activar/", {
        id_bandeja: selectedBandejaId,
        tipo: newBandejaType,
      });
      console.log("✅ Successfully activated bandeja:", activateResponse.data);

      console.log("✅ Process completed successfully");

      // Close the modal and reset form
      setShowNuevoProcesoModal(false);
      setNewBandejaType("");
      setSelectedBandejaId("");

      // Refresh the bandejas list
      fetchBandejas();
    } catch (error) {
      console.error("❌ Error creating new process:", error);

      // Detailed error logging
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
        console.error("Response data:", error.response.data);
      } else if (error.request) {
        console.error("Request was made but no response received");
        console.error("Request details:", error.request);
      } else {
        console.error("Error message:", error.message);
      }

      // Display a more useful error message (console only for now)
      console.error(
        "PROCESS FAILED: Please check server implementation and routes"
      );
    } finally {
      setCreating(false);
    }
  };

  // Add new function to fetch almacén data
  const fetchAlmacen = async () => {
    try {
      const response = await api.get("/almacen");
      if (response.data && response.data.length > 0) {
        setAlmacen(response.data[0]); // Assuming we only have one almacén
      }
    } catch (error) {
      console.error("Error fetching almacén:", error);
    }
  };

  // Add handler for updating almacén state
  const handleUpdateAlmacenState = async (
    newEstadoMotor,
    newEstadoResistencia
  ) => {
    try {
      await api.post("/almacen/state", {
        estadoMotor: newEstadoMotor,
        estadoResistencia: newEstadoResistencia,
      });
      // Refresh almacén data
      fetchAlmacen();
    } catch (error) {
      console.error("Error updating almacén state:", error);
      alert("Error al actualizar el estado del almacén");
    }
  };

  useEffect(() => {
    fetchBandejas();
    loadParametros();
    fetchAlmacen();
    // Set up interval to fetch almacén data every 5 seconds
    const interval = setInterval(fetchAlmacen, 5000);
    return () => clearInterval(interval);
  }, []);

  const ToggleButton = ({ isOpen, onClick, children }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );

  const SectionHeader = ({ title, isOpen, onToggle }) => (
    <div className="flex items-center gap-3 mb-6">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <ToggleButton isOpen={isOpen} onClick={onToggle} />
    </div>
  );

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
        <div className="mt-4 flex justify-center space-x-4">
          <button
            onClick={handleOpenNuevoProcesoModal}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Nuevo Proceso
          </button>
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

      <main className="max-w-7xl mx-auto space-y-8">
        {/* Almacén Section */}
        <section>
          <SectionHeader
            title="Estado del Almacén"
            isOpen={showAlmacen}
            onToggle={() => setShowAlmacen(!showAlmacen)}
          />
          {showAlmacen && almacen && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-sm text-gray-400 mb-1">Temperatura</h3>
                  <p className="text-2xl font-semibold">
                    {almacen.temperaturaActual !== null
                      ? `${almacen.temperaturaActual}°C`
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-sm text-gray-400 mb-1">Humedad</h3>
                  <p className="text-2xl font-semibold">
                    {almacen.humedadActual !== null
                      ? `${almacen.humedadActual}%`
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-sm text-gray-400 mb-1">Estado Motor</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-semibold">
                      {almacen.estadoMotor ? (
                        <span className="text-green-500">Activo</span>
                      ) : (
                        <span className="text-red-500">Inactivo</span>
                      )}
                    </p>
                    <button
                      onClick={() =>
                        handleUpdateAlmacenState(
                          !almacen.estadoMotor,
                          almacen.estadoResistencia
                        )
                      }
                      className={`px-3 py-1 rounded text-sm ${
                        almacen.estadoMotor
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                    >
                      {almacen.estadoMotor ? "Apagar" : "Encender"}
                    </button>
                  </div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-sm text-gray-400 mb-1">
                    Estado Resistencia
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-semibold">
                      {almacen.estadoResistencia ? (
                        <span className="text-green-500">Activa</span>
                      ) : (
                        <span className="text-red-500">Inactiva</span>
                      )}
                    </p>
                    <button
                      onClick={() =>
                        handleUpdateAlmacenState(
                          almacen.estadoMotor,
                          !almacen.estadoResistencia
                        )
                      }
                      className={`px-3 py-1 rounded text-sm ${
                        almacen.estadoResistencia
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                    >
                      {almacen.estadoResistencia ? "Apagar" : "Encender"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                Última actualización:{" "}
                {almacen.ultimaActualizacion
                  ? new Date(
                      almacen.ultimaActualizacion.seconds * 1000
                    ).toLocaleString()
                  : "N/A"}
              </div>
            </div>
          )}
        </section>

        {/* Parameters Section */}
        <section>
          <SectionHeader
            title="Parámetros de Temperatura"
            isOpen={showParametros}
            onToggle={() => setShowParametros(!showParametros)}
          />
          {showParametros && (
            <div className="">
              <Parametros />
            </div>
          )}
        </section>

        {/* Bandejas Activas Section */}
        <section>
          <SectionHeader
            title="Bandejas Activas"
            isOpen={showActivas}
            onToggle={() => setShowActivas(!showActivas)}
          />
          {showActivas && <BandejasActivas />}
        </section>

        {/* Bandejas Disponibles Section */}
        <section>
          <SectionHeader
            title="Bandejas Disponibles"
            isOpen={showDisponibles}
            onToggle={() => setShowDisponibles(!showDisponibles)}
          />
          {showDisponibles && (
            <BandejasDisponibles
              bandejas={bandejas.filter(
                (bandeja) => bandeja.estatus === "disponible"
              )}
              onBandejaSelected={handleBandejaSelected}
              refreshBandejas={fetchBandejas}
            />
          )}
        </section>

        {/* Modal for Bandeja Pendiente */}
        {selectedBandeja && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <BandejaPendiente
                bandeja_id={selectedBandeja}
                onBandejaActivated={handleBandejaActivated}
                refreshBandejas={fetchBandejas}
              />
            </div>
          </div>
        )}

        {/* Modal for Nuevo Proceso */}
        {showNuevoProcesoModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
              <h3 className="text-xl font-semibold mb-4">
                Crear Nuevo Proceso
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Bandeja Disponible
                </label>
                {loadingBandejas ? (
                  <div className="text-sm text-gray-400">
                    Cargando bandejas...
                  </div>
                ) : availableBandejas.length === 0 ? (
                  <div className="text-sm text-red-400">
                    No hay bandejas disponibles.{" "}
                    <button
                      onClick={fetchBandejasDisponibles}
                      className="underline"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedBandejaId}
                    onChange={(e) => setSelectedBandejaId(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar bandeja</option>
                    {availableBandejas.map((bandeja) => (
                      <option
                        key={bandeja.id_bandeja || bandeja.id}
                        value={bandeja.id_bandeja || bandeja.id}
                      >
                        Bandeja {bandeja.id_bandeja || bandeja.id}
                        {bandeja.estatus && ` (${bandeja.estatus})`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Tipo de Alimento
                </label>
                <select
                  value={newBandejaType}
                  onChange={(e) => setNewBandejaType(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar tipo</option>
                  {parametros &&
                    Object.keys(parametros).map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowNuevoProcesoModal(false);
                    setNewBandejaType("");
                    setSelectedBandejaId("");
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleNewBandeja}
                  disabled={!newBandejaType || !selectedBandejaId || creating}
                  className={`px-4 py-2 bg-green-500 rounded ${
                    !newBandejaType || !selectedBandejaId || creating
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-green-600"
                  }`}
                >
                  {creating ? "Creando..." : "Crear"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
