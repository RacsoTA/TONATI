import React from "react";

function Almacen({ temperaturaPromedio, humedadPromedio }) {
  return (
    <div className="almacen border border-gray-700  bg-gray-800 mt-5 p-4 w-screen text-center">
      <h2 className="text-xl">Almacén</h2>
      <p>Temperatura Promedio: {temperaturaPromedio}°C</p>
      <p>Humedad Promedio: {humedadPromedio}%</p>
    </div>
  );
}

export default Almacen;
