import React, { useState } from "react";
import Horno from "./components/Horno";
import Almacen from "./components/Almacen";

function App() {
  const initialHornos = [
    {
      id: 1,
      temperatura: 80,
      humedad: 30,
      estado: true,
      horaInicio: "10:00",
      horaPrediccion: "12:00",
      alimento: "Carne",
    },
    {
      id: 2,
      temperatura: 70,
      humedad: 40,
      estado: true,
      horaInicio: "11:00",
      horaPrediccion: "13:00",
      alimento: "Carne",
    },
    {
      id: 3,
      temperatura: 90,
      humedad: 35,
      estado: true,
      horaInicio: "09:00",
      horaPrediccion: "11:00",
      alimento: "Manzana",
    },
    {
      id: 4,
      temperatura: 60,
      humedad: 15,
      estado: true,
      horaInicio: "02:00",
      horaPrediccion: "04:00",
      alimento: "Carne",
    },
    {
      id: 5,
      temperatura: 50,
      humedad: 50,
      estado: true,
      horaInicio: "07:00",
      horaPrediccion: "09:00",
      alimento: "Carne",
    },
    {
      id: 6,
      temperatura: 70,
      humedad: 25,
      estado: true,
      horaInicio: "06:00",
      horaPrediccion: "08:00",
      alimento: "Carne",
    },
    {
      id: 7,
      temperatura: 30,
      humedad: 55,
      estado: true,
      horaInicio: "05:00",
      horaPrediccion: "07:00",
      alimento: "Manzana",
    },
    {
      id: 8,
      temperatura: 60,
      humedad: 20,
      estado: true,
      horaInicio: "04:00",
      horaPrediccion: "06:00",
      alimento: "Tomate",
    },
    {
      id: 9,
      temperatura: 40,
      humedad: 60,
      estado: true,
      horaInicio: "03:00",
      horaPrediccion: "05:00",
      alimento: "Tomate",
    },
    {
      id: 10,
      temperatura: 50,
      humedad: 15,
      estado: true,
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
    console.log("Detener todos los hornos");
    console.log("Estado antes:", hornos);
    const hornosActualizados = hornos.map((horno) => ({
      ...horno,
      estado: false,
    }));
    setHornos(hornosActualizados);
    console.log("Estado después:", hornosActualizados);
  };

  return (
    <div className="App text-center bg-gray-900 min-h-screen text-white py-20">
      <header className="App-header bg-gray-800 p-4 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Dashboard de Bandejas.</h1>
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
