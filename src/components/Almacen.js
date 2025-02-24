import React from "react";

function Almacen({ temperaturaPromedio, humedadPromedio }) {
  return (
    <div className="almacen border border-gray-700 bg-gray-800 mt-5 p-4 w-screen text-center">
      <h2 className="text-xl">Almacén</h2>
      <div className="flex flex-row w-full gap-8">
        <div className="flex flex-col w-1/2 gap-6">
          <p>Temperatura Promedio: {temperaturaPromedio}°C</p>
          <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
            <div
              className="bg-red-500 h-4 rounded-full"
              style={{ width: `${temperaturaPromedio}%` }}
            ></div>
          </div>
        </div>
        <div className="flex flex-col w-1/2 gap-6">
          <p>Humedad Promedio: {humedadPromedio}%</p>
          <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
            <div
              className="bg-blue-500 h-4 rounded-full"
              style={{ width: `${humedadPromedio}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Almacen;
