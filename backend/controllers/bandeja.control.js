import firebase from "../firebase.js";
import { Bandeja } from "../models/bandeja.model.js";
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
} from "firebase/firestore";

const db = getFirestore(firebase);

export const createBandeja = async (req, res, next) => {
  try {
    const { id_bandeja, temperatura, humedad, cantidadProcesos, estatus } =
      req.body;

    // Validación de datos
    if (
      id_bandeja === undefined ||
      temperatura === undefined ||
      humedad === undefined ||
      cantidadProcesos === undefined ||
      estatus === undefined
    ) {
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos" });
    }

    // Creando el documento en Firestore
    const docRef = await addDoc(collection(db, "bandejas"), {
      id_bandeja,
      temperatura,
      humedad,
      cantidadProcesos,
      estatus,
    });

    res.status(201).json({ message: "Bandeja creada", id: docRef.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBandejas = async (req, res, next) => {
  try {
    const bandejas = await getDocs(collection(db, "bandejas"));
    const bandejasArray = [];

    if (bandejas.empty) {
      res.status(400).send("No hay bandejas");
    } else {
      bandejas.forEach((doc) => {
        const bandeja = new Bandeja(
          doc.id,
          doc.data().id_bandeja,
          doc.data().temperatura,
          doc.data().humedad,
          doc.data().cantidadProcesos,
          doc.data().estatus
        );
        bandejasArray.push(bandeja);
      });

      res.status(200).send(bandejasArray);
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const getBandeja = async (req, res, next) => {
  try {
    const id = req.params.id;
    const id_bandeja = req.params.id_bandeja;
    const bandeja = doc(db, "bandejas", id);
    const data = await getDoc(bandeja);
    if (data.exists()) {
      res.status(200).send(data.data());
    } else {
      res.status(404).send("bandeja not found");
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const updateBandeja = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const bandeja = doc(db, "bandejas", id);
    await updateDoc(bandeja, data);
    res.status(200).send("bandeja updated successfully");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const deleteBandeja = async (req, res, next) => {
  try {
    const id = req.params.id;
    await deleteDoc(doc(db, "bandejas", id));
    res.status(200).send("bandeja deleted successfully");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const bandejaDisponible = async (req, res, next) => {
  try {
    const { id_bandeja, alimento } = req.body;

    if (id_bandeja === undefined || !alimento) {
      return res
        .status(400)
        .json({ message: "El id de la bandeja y el alimento son requeridos" });
    }

    // 🔍 Buscar bandeja con id_bandeja
    const bandejasRef = collection(db, "bandejas");
    const q = query(bandejasRef, where("id_bandeja", "==", id_bandeja));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "Bandeja no encontrada" });
    }

    // 📌 Tomar el primer documento coincidente
    const bandejaDoc = querySnapshot.docs[0];
    const bandejaRef = doc(db, "bandejas", bandejaDoc.id);
    const bandejaData = bandejaDoc.data();

    if (bandejaData.estatus === "disponible") {
      // ⏳ Crear un nuevo proceso
      const procesoRef = collection(db, "procesos");
      const nuevoProceso = {
        estatus: "pendiente", // Nuevo proceso comienza activo
        alimento: alimento,
        bandeja_ID: id_bandeja, // Se guarda el ID de la bandeja
        horaInicio: serverTimestamp(), // Marca de tiempo automática
        horaFinal: null, // Se actualizará cuando termine el proceso
        humedades: [], // Se llenarán con mediciones futuras
        temperaturas: [], // Se llenarán con mediciones futuras
      };

      const procesoCreado = await addDoc(procesoRef, nuevoProceso);

      // 📝 Actualizar la bandeja a 'pendiente'
      await updateDoc(bandejaRef, { estatus: "pendiente" });

      return res.status(200).json({
        message: "Bandeja pendiente de comenzar proceso",
        procesoID: procesoCreado.id, // Devolver el ID del proceso creado
      });
    } else {
      return res.status(400).json({ message: "Bandeja no disponible" });
    }
  } catch (error) {
    console.error("Error en bandejaDisponible:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const obtenerBandejaPendiente = async (req, res) => {
  try {
    console.log("[FIREBASE-DEBUG] Starting obtenerBandejaPendiente function");

    // Log all 'procesos' collection contents for debugging
    console.log("[FIREBASE-DEBUG] Getting all processes to verify data:");
    const allProcesosSnap = await getDocs(collection(db, "procesos"));
    allProcesosSnap.forEach((doc) => {
      console.log(
        `[FIREBASE-DEBUG] Process ID: ${doc.id}, Status: ${
          doc.data().estatus
        }, Data:`,
        doc.data()
      );
    });

    // Run the query for pending processes
    const procesosRef = collection(db, "procesos");
    console.log(
      "[FIREBASE-DEBUG] Running query for processes with status 'pendiente'"
    );
    const q = query(procesosRef, where("estatus", "==", "pendiente"));
    const querySnapshot = await getDocs(q);

    console.log(
      `[FIREBASE-DEBUG] Query results: Found ${querySnapshot.size} pending processes`
    );

    if (querySnapshot.empty) {
      console.log("[FIREBASE-DEBUG] No pending processes found in Firestore");
      return res
        .status(200)
        .json({ message: "No hay bandejas pendientes", bandeja_ID: null });
    }

    const docSnap = querySnapshot.docs[0];
    const procesoPendiente = docSnap.data();

    console.log(
      "[FIREBASE-DEBUG] Found pending process:",
      JSON.stringify(procesoPendiente)
    );
    console.log("[FIREBASE-DEBUG] Document ID:", docSnap.id);

    // Validate that bandeja_ID exists in the document
    if (!procesoPendiente.bandeja_ID) {
      console.log(
        "[FIREBASE-ERROR] Process is missing bandeja_ID field:",
        procesoPendiente
      );
      return res.status(200).json({
        message: "Proceso pendiente encontrado pero falta bandeja_ID",
        bandeja_ID: null,
      });
    }

    return res.status(200).json({
      bandeja_ID: procesoPendiente.bandeja_ID,
      alimento: procesoPendiente.alimento,
      proceso_ID: docSnap.id,
    });
  } catch (error) {
    console.error("[FIREBASE-ERROR] Error in obtenerBandejaPendiente:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getBandejasDisponibles = async (req, res) => {
  try {
    const bandejasRef = collection(db, "bandejas");
    const q = query(bandejasRef, where("estatus", "==", "disponible"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res
        .status(200)
        .json({ message: "No hay bandejas disponibles", bandejas: [] });
    }

    const bandejas = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      message: "Bandejas disponibles encontradas",
      bandejas,
    });
  } catch (error) {
    console.error("Error en getBandejasDisponibles:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const prepararNuevoProceso = async (req, res) => {
  try {
    const { alimento } = req.body;

    if (!alimento) {
      return res.status(400).json({ message: "El alimento es requerido" });
    }

    // Get available bandeja
    const bandejasRef = collection(db, "bandejas");
    const q = query(bandejasRef, where("estatus", "==", "disponible"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "No hay bandejas disponibles" });
    }

    // Take the first available bandeja
    const bandejaDoc = querySnapshot.docs[0];
    const bandejaRef = doc(db, "bandejas", bandejaDoc.id);
    const bandejaData = bandejaDoc.data();

    // Create new process
    const procesoRef = collection(db, "procesos");
    const nuevoProceso = {
      estatus: "preparado",
      alimento: alimento,
      bandeja_ID: bandejaData.id_bandeja,
      horaInicio: null,
      horaFinal: null,
      humedades: [],
      temperaturas: [],
    };

    const procesoCreado = await addDoc(procesoRef, nuevoProceso);

    // Update bandeja status to pending
    await updateDoc(bandejaRef, { estatus: "pendiente" });

    return res.status(200).json({
      message: "Proceso preparado correctamente",
      procesoID: procesoCreado.id,
      bandeja: {
        id: bandejaDoc.id,
        ...bandejaData,
      },
    });
  } catch (error) {
    console.error("Error en prepararNuevoProceso:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const iniciarProceso = async (req, res) => {
  try {
    const { procesoID } = req.body;

    if (!procesoID) {
      return res
        .status(400)
        .json({ message: "El ID del proceso es requerido" });
    }

    // Get the process
    const procesoRef = doc(db, "procesos", procesoID);
    const procesoDoc = await getDoc(procesoRef);

    if (!procesoDoc.exists()) {
      return res.status(404).json({ message: "Proceso no encontrado" });
    }

    const procesoData = procesoDoc.data();

    if (procesoData.estatus !== "preparado") {
      return res
        .status(400)
        .json({ message: "El proceso no está preparado para iniciar" });
    }

    // Update process status and start time
    await updateDoc(procesoRef, {
      estatus: "en_proceso",
      horaInicio: serverTimestamp(),
    });

    return res.status(200).json({
      message: "Proceso iniciado correctamente",
      proceso: {
        id: procesoDoc.id,
        ...procesoData,
        horaInicio: new Date(),
      },
    });
  } catch (error) {
    console.error("Error en iniciarProceso:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const checkPendingProcess = async (req, res) => {
  try {
    console.log("[ESP32-REQUEST] Received request to check pending processes");

    // Find any bandeja with status "pendiente"
    const bandejasRef = collection(db, "bandejas");
    const q = query(bandejasRef, where("estatus", "==", "pendiente"));
    console.log("[ESP32-QUERY] Querying for bandejas with status 'pendiente'");

    const querySnapshot = await getDocs(q);
    console.log("[ESP32-RESULT] Found", querySnapshot.size, "pending bandejas");

    if (querySnapshot.empty) {
      console.log(
        "[ESP32-RESPONSE] No pending bandejas found, sending null response"
      );
      return res.status(200).json({
        message: "No hay bandejas pendientes",
        bandeja: null,
      });
    }

    // Get the first pending bandeja
    const bandejaDoc = querySnapshot.docs[0];
    const bandejaData = bandejaDoc.data();
    console.log(
      "[ESP32-DATA] Bandeja found:",
      JSON.stringify({
        id: bandejaDoc.id,
        ...bandejaData,
      })
    );

    // Update bandeja status to "en_proceso"
    console.log(
      "[ESP32-UPDATE] Updating bandeja",
      bandejaDoc.id,
      "status to 'en_proceso'"
    );
    await updateDoc(doc(db, "bandejas", bandejaDoc.id), {
      estatus: "en_proceso",
      horaInicio: serverTimestamp(),
    });

    const responseData = {
      message: "Bandeja pendiente encontrada",
      bandeja: {
        id: bandejaDoc.id,
        ...bandejaData,
      },
    };
    console.log(
      "[ESP32-RESPONSE] Sending response to ESP32:",
      JSON.stringify(responseData)
    );

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("[ESP32-ERROR] Error in checkPendingProcess:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const checkTimeoutProcesses = async (req, res) => {
  try {
    console.log(
      "[ESP32-TIMEOUT-REQUEST] Received request to check timeout processes"
    );

    // Find bandejas with status "en_proceso"
    const bandejasRef = collection(db, "bandejas");
    const q = query(bandejasRef, where("estatus", "==", "en_proceso"));
    console.log(
      "[ESP32-TIMEOUT-QUERY] Querying for bandejas with status 'en_proceso'"
    );

    const querySnapshot = await getDocs(q);
    console.log(
      "[ESP32-TIMEOUT-RESULT] Found",
      querySnapshot.size,
      "active processes"
    );

    if (querySnapshot.empty) {
      console.log(
        "[ESP32-TIMEOUT-RESPONSE] No active processes found, sending null response"
      );
      return res.status(200).json({
        message: "No hay procesos activos",
        bandeja: null,
      });
    }

    const currentTime = new Date();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    console.log(
      "[ESP32-TIMEOUT-CHECK] Checking",
      querySnapshot.size,
      "processes for timeout"
    );

    // Check each process
    for (const doc of querySnapshot.docs) {
      const bandejaData = doc.data();
      const startTime = bandejaData.horaInicio?.toDate();

      if (startTime) {
        const elapsedTime = currentTime - startTime;
        const elapsedHours = elapsedTime / (60 * 60 * 1000);
        console.log(
          "[ESP32-TIMEOUT-PROCESS] Bandeja",
          bandejaData.id_bandeja,
          "elapsed time:",
          elapsedHours.toFixed(2),
          "hours"
        );

        if (elapsedTime > TWELVE_HOURS) {
          console.log(
            "[ESP32-TIMEOUT-UPDATE] Process timed out after",
            elapsedHours.toFixed(2),
            "hours. Updating bandeja",
            doc.id
          );
          // Update bandeja status to "disponible"
          await updateDoc(doc.ref, {
            estatus: "disponible",
            horaInicio: null,
          });

          const responseData = {
            message: "Proceso completado por timeout",
            bandeja: {
              id: doc.id,
              ...bandejaData,
            },
          };
          console.log(
            "[ESP32-TIMEOUT-RESPONSE] Sending timeout response:",
            JSON.stringify(responseData)
          );
          return res.status(200).json(responseData);
        }
      } else {
        console.log(
          "[ESP32-TIMEOUT-WARN] Bandeja",
          bandejaData.id_bandeja,
          "has no start time recorded"
        );
      }
    }

    console.log("[ESP32-TIMEOUT-RESPONSE] No processes need to be stopped");
    return res.status(200).json({
      message: "No hay procesos que necesiten detenerse",
      bandeja: null,
    });
  } catch (error) {
    console.error(
      "[ESP32-TIMEOUT-ERROR] Error in checkTimeoutProcesses:",
      error
    );
    return res.status(500).json({ message: error.message });
  }
};

// export const bandeja
