import React, { useState, useEffect } from "react";

function Horno({
  id,
  temperatura,
  humedad,
  estado,
  horaInicio,
  horaPrediccion,
  totalHornos,
  alimento,
}) {
  const [isOn, setIsOn] = useState(estado);

  useEffect(() => {
    setIsOn(estado);
  }, [estado]);

  const toggleHorno = () => {
    setIsOn(!isOn);
  };

  const widthClass = `w-${Math.floor(100 / totalHornos)}/10`;

  // Calcula el porcentaje de tiempo transcurrido
  const calculateTimePercentage = (horaInicio, horaPrediccion) => {
    const [startHour, startMinute] = horaInicio.split(":").map(Number);
    const [endHour, endMinute] = horaPrediccion.split(":").map(Number);
    const startTime = new Date();
    startTime.setHours(startHour, startMinute, 0);
    const endTime = new Date();
    endTime.setHours(endHour, endMinute, 0);
    const currentTime = new Date();
    const totalDuration = endTime - startTime;
    const elapsedDuration = currentTime - startTime;
    return Math.min((elapsedDuration / totalDuration) * 100, 100);
  };

  const timePercentage = calculateTimePercentage(horaInicio, horaPrediccion);

  return (
    <div
      className={`horno border border-gray-700 rounded-lg p-4 text-left bg-gray-800 shadow-lg ${widthClass} flex flex-col gap-4`}
    >
      <h2 className="text-xl font-semibold">Horno {id}</h2>
      <p>Tipo de alimento: {alimento}</p>
      <div className="flex flex-row w-full gap-8">
        <div className="flex flex-col w-1/2 gap-6">
          <p>Temperatura: {temperatura}°C</p>
          <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
            <div
              className="bg-red-500 h-4 rounded-full"
              style={{ width: `${temperatura}%` }}
            ></div>
          </div>
        </div>
        <div className="flex flex-col w-1/2 gap-6">
          <p>Humedad: {humedad}%</p>
          <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
            <div
              className="bg-blue-500 h-4 rounded-full"
              style={{ width: `${humedad}%` }}
            ></div>
          </div>
        </div>
      </div>
      <div className="flex flex-row gap-4 items-center">
        {" "}
        <button
          className=" px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          onClick={toggleHorno}
        >
          {isOn ? "Apagar" : "Prender"}
        </button>
        <p>Estado: {isOn ? "Prendido" : "Apagado"}</p>
      </div>
      <div className="">
        <p>Hora de inicio: {horaInicio}</p>
        <p>Hora de predicción de finalizado: {horaPrediccion}</p>
        <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
          <div
            className="bg-green-500 h-4 rounded-full"
            style={{ width: `${timePercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default Horno;
