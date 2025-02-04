import React, { useState } from "react";
import Horno from "./components/Horno";
import Almacen from "./components/Almacen";

function App() {
  const initialHornos = [
    {
      id: 1,
      temperatura: 200,
      humedad: 30,
      estado: true,
      horaInicio: "10:00",
      horaPrediccion: "12:00",
      alimento: "Carne",
    },
    {
      id: 2,
      temperatura: 180,
      humedad: 40,
      estado: false,
      horaInicio: "11:00",
      horaPrediccion: "13:00",
      alimento: "Carne",
    },
    {
      id: 3,
      temperatura: 220,
      humedad: 35,
      estado: true,
      horaInicio: "09:00",
      horaPrediccion: "11:00",
      alimento: "Manzana",
    },
    {
      id: 4,
      temperatura: 190,
      humedad: 45,
      estado: false,
      horaInicio: "08:00",
      horaPrediccion: "10:00",
      alimento: "Tomate",
    },
    {
      id: 5,
      temperatura: 210,
      humedad: 50,
      estado: true,
      horaInicio: "07:00",
      horaPrediccion: "09:00",
      alimento: "Carne",
    },
    {
      id: 6,
      temperatura: 170,
      humedad: 25,
      estado: false,
      horaInicio: "06:00",
      horaPrediccion: "08:00",
      alimento: "Carne",
    },
    {
      id: 7,
      temperatura: 230,
      humedad: 55,
      estado: true,
      horaInicio: "05:00",
      horaPrediccion: "07:00",
      alimento: "Manzana",
    },
    {
      id: 8,
      temperatura: 160,
      humedad: 20,
      estado: false,
      horaInicio: "04:00",
      horaPrediccion: "06:00",
      alimento: "Tomate",
    },
    {
      id: 9,
      temperatura: 240,
      humedad: 60,
      estado: true,
      horaInicio: "03:00",
      horaPrediccion: "05:00",
      alimento: "Tomate",
    },
    {
      id: 10,
      temperatura: 150,
      humedad: 15,
      estado: false,
      horaInicio: "02:00",
      horaPrediccion: "04:00",
      alimento: "Carne",
    },
  ];

  const [hornos, setHornos] = useState(initialHornos);

  const temperaturaPromedio =
    hornos.reduce((acc, horno) => acc + horno.temperatura, 0) / hornos.length;
  const humedadPromedio =
    hornos.reduce((acc, horno) => acc + horno.humedad, 0) / hornos.length;

  const detenerTodosLosHornos = () => {
    const hornosActualizados = hornos.map((horno) => ({
      ...horno,
      estado: false,
    }));
    setHornos(hornosActualizados);
  };

  return (
    <div className="App text-center bg-gray-900 min-h-screen text-white py-20">
      <header className="App-header bg-gray-800 p-4 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Dashboard de Hornos</h1>
      </header>
      <Almacen
        temperaturaPromedio={temperaturaPromedio}
        humedadPromedio={humedadPromedio}
      />
      <div className="dashboard flex flex-col flex-wrap justify-center gap-4 px-14 py-5">
        {hornos.map((horno) => (
          <Horno key={horno.id} {...horno} totalHornos={hornos.length} />
        ))}
      </div>
      <button
        className="mt-4 px-6 py-3 bg-red-600 text-white rounded hover:bg-red-800"
        onClick={detenerTodosLosHornos}
      >
        Detener Todos los Hornos
      </button>
    </div>
  );
}

export default App;
