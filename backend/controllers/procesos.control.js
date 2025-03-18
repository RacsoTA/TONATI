import firebase from "../firebase.js";
import Bandeja from "../models/bandeja.models.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  where,
  query,
  serverTimestamp,
  limit,
  Timestamp,
} from "firebase/firestore";

const db = getFirestore(firebase);

export const terminarProceso = async (req, res, next) => {
  try {
    const { id_bandeja, id_proceso } = req.body;
    const horaFinal = new Date().toLocaleTimeString();
    // Validación de datos
    if (id_bandeja === undefined) {
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos" });
    }

    // Actualizando el documento en Firestore
    await updateDoc(doc(db, "procesos", id_proceso), {
      horaFinal,

      estatus: "finalizado",
    });

    res.status(200).json({ message: "Proceso finalizado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ESP32 API methods
export const getPendingProcess = async (req, res) => {
  try {
    // Create a query to get one pending process
    const q = query(
      collection(db, "procesos"),
      where("estatus", "==", "pendiente"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "No hay procesos pendientes" });
    }

    // Get the first document and only return bandeja_ID
    const doc = querySnapshot.docs[0];
    const data = doc.data();

    res.status(200).json({
      bandeja_ID: data.bandeja_ID,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActiveProcessOver12Hours = async (req, res) => {
  try {
    // Get current time
    const currentTime = new Date();

    // Calculate time 12 hours ago
    const twelveHoursAgo = new Date(
      currentTime.getTime() - 12 * 60 * 60 * 1000
    );

    // Get all active processes
    const q = query(
      collection(db, "procesos"),
      where("estatus", "==", "activo")
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "No hay procesos activos" });
    }

    // Filter processes with horaInicio more than 12 hours ago
    const filteredProcesses = [];
    querySnapshot.forEach((document) => {
      const data = document.data();
      const horaInicio = data.horaInicio;

      // Check if horaInicio is more than 12 hours old
      if (horaInicio) {
        // Parse the time string or handle timestamp based on how horaInicio is stored
        let startTime;
        if (horaInicio instanceof Timestamp) {
          // If it's a Firestore Timestamp
          startTime = horaInicio.toDate();
        } else if (typeof horaInicio === "string") {
          // If it's stored as a string, parse it
          // Assuming format is from toLocaleTimeString - adjust parsing as needed
          const today = new Date().toLocaleDateString();
          startTime = new Date(`${today} ${horaInicio}`);
        }

        if (startTime && startTime < twelveHoursAgo) {
          filteredProcesses.push({
            bandeja_ID: data.bandeja_ID,
          });
        }
      }
    });

    if (filteredProcesses.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay procesos activos con más de 12 horas" });
    }

    // Return the first matching process
    res.status(200).json(filteredProcesses[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
