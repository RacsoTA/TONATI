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
          doc.data().temperaturaActual,
          doc.data().humedadActual,
          doc.data().estadoMotor,
          doc.data().estadoResistencia,
          doc.data().estatus,
          doc.data().ultimaActualizacion
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
    const { id_bandeja } = req.body;

    if (!id_bandeja) {
      return res
        .status(400)
        .json({ message: "El id de la bandeja es requerido" });
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
      // 📝 Actualizar la bandeja a 'pendiente'
      await updateDoc(bandejaRef, {
        estatus: "pendiente",
        ultimaActualizacion: serverTimestamp(),
      });

      return res.status(200).json({
        message: "Bandeja marcada como pendiente",
        bandeja_id: bandejaDoc.id,
      });
    } else {
      return res.status(400).json({ message: "Bandeja no disponible" });
    }
  } catch (error) {
    console.error("Error en bandejaDisponible:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const activarBandeja = async (req, res) => {
  try {
    const { id_bandeja } = req.body;

    if (!id_bandeja) {
      return res
        .status(400)
        .json({ message: "El id de la bandeja es requerido" });
    }

    const bandejasRef = collection(db, "bandejas");
    const q = query(bandejasRef, where("id_bandeja", "==", id_bandeja));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "Bandeja no encontrada" });
    }

    const bandejaDoc = querySnapshot.docs[0];
    const bandejaData = bandejaDoc.data();

    if (bandejaData.estatus !== "pendiente") {
      return res.status(400).json({
        message: "La bandeja debe estar en estado pendiente para ser activada",
      });
    }

    await updateDoc(doc(db, "bandejas", bandejaDoc.id), {
      estatus: "activo",
      horaInicio: serverTimestamp(),
      ultimaActualizacion: serverTimestamp(),
    });

    return res.status(200).json({ message: "Bandeja activada exitosamente" });
  } catch (error) {
    console.error("Error en activarBandeja:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const finalizarBandeja = async (req, res) => {
  try {
    const { id_bandeja } = req.body;

    if (!id_bandeja) {
      return res
        .status(400)
        .json({ message: "El id de la bandeja es requerido" });
    }

    const bandejasRef = collection(db, "bandejas");
    const q = query(bandejasRef, where("id_bandeja", "==", id_bandeja));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "Bandeja no encontrada" });
    }

    const bandejaDoc = querySnapshot.docs[0];
    const bandejaData = bandejaDoc.data();

    if (bandejaData.estatus !== "activo") {
      return res.status(400).json({
        message: "La bandeja debe estar en estado activo para ser finalizada",
      });
    }

    await updateDoc(doc(db, "bandejas", bandejaDoc.id), {
      estatus: "disponible",
      estadoMotor: false,
      estadoResistencia: false,
      ultimaActualizacion: serverTimestamp(),
    });

    return res.status(200).json({ message: "Bandeja finalizada exitosamente" });
  } catch (error) {
    console.error("Error en finalizarBandeja:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateBandejasFromESP32 = async (req, res) => {
  try {
    const { data } = req.body;
    const dataArray = data.split(",");

    if (dataArray.length !== 40) {
      return res.status(400).json({ message: "Invalid data format" });
    }

    const bandejasRef = collection(db, "bandejas");
    const bandejasSnapshot = await getDocs(bandejasRef);

    if (bandejasSnapshot.empty) {
      return res.status(404).json({ message: "No bandejas found" });
    }

    const updatePromises = [];
    let docCounter = 0;

    bandejasSnapshot.forEach((doc) => {
      const dataIndex = docCounter * 4;

      const tempValue = dataArray[dataIndex];
      const humValue = dataArray[dataIndex + 1];
      const motorValue = dataArray[dataIndex + 2];
      const resistenciaValue = dataArray[dataIndex + 3];

      const temperaturaActual =
        tempValue && !isNaN(tempValue) ? parseFloat(tempValue) : null;
      const humedadActual =
        humValue && !isNaN(humValue) ? parseFloat(humValue) : null;
      const estadoMotor = motorValue === "1";
      const estadoResistencia = resistenciaValue === "1";
      const ultimaActualizacion = serverTimestamp();

      console.log(`Bandeja ${docCounter + 1}:`);
      console.log(`  Temperatura Actual: ${temperaturaActual}`);
      console.log(`  Humedad Actual: ${humedadActual}`);
      console.log(`  Estado Motor: ${estadoMotor}`);
      console.log(`  Estado Resistencia: ${estadoResistencia}`);

      const bandejaRef = doc.ref;
      updatePromises.push(
        updateDoc(bandejaRef, {
          temperaturaActual,
          humedadActual,
          estadoMotor,
          estadoResistencia,
          ultimaActualizacion,
        })
      );

      docCounter++;
    });

    await Promise.all(updatePromises);
    res.status(200).json({ message: "Bandejas updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBandejaPendiente = async (req, res) => {
  try {
    const bandejasRef = collection(db, "bandejas");
    const q = query(bandejasRef, where("estatus", "==", "pendiente"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(200).json({
        message: "No hay bandejas pendientes",
        bandeja: null,
      });
    }

    const bandejaDoc = querySnapshot.docs[0];
    const bandejaData = bandejaDoc.data();

    return res.status(200).json({
      bandeja_id: bandejaDoc.id,
      id_bandeja: bandejaData.id_bandeja,
      estatus: bandejaData.estatus,
    });
  } catch (error) {
    console.error("Error en getBandejaPendiente:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getBandejasActivas12Horas = async (req, res) => {
  try {
    const bandejasRef = collection(db, "bandejas");
    const q = query(bandejasRef, where("estatus", "==", "activo"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(200).json({
        message: "No hay bandejas activas",
        bandeja: null,
      });
    }

    // Get current time
    const now = new Date();

    // Find first bandeja that has been active for more than 12 hours
    for (const doc of querySnapshot.docs) {
      const bandejaData = doc.data();
      const horaInicio = bandejaData.horaInicio?.toDate();

      if (horaInicio) {
        const horasActiva = (now - horaInicio) / (1000 * 60 * 60); // Convert to hours

        if (horasActiva >= 12) {
          return res.status(200).json({
            bandeja_id: doc.id,
            id_bandeja: bandejaData.id_bandeja,
            horaInicio: horaInicio,
            horasActiva: horasActiva,
          });
        }
      }
    }

    return res.status(200).json({
      message: "No hay bandejas activas por más de 12 horas",
      bandeja: null,
    });
  } catch (error) {
    console.error("Error en getBandejasActivas12Horas:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getBandejasActivas = async (req, res) => {
  try {
    const bandejasRef = collection(db, "bandejas");
    const q = query(bandejasRef, where("estatus", "==", "activo"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(200).json({
        message: "No hay bandejas activas",
        bandejas: [],
      });
    }

    const bandejasActivas = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        bandeja_id: doc.id,
        id_bandeja: data.id_bandeja,
        temperaturaActual: data.temperaturaActual,
        humedadActual: data.humedadActual,
        motor: data.motor,
        resistencia: data.resistencia,
        horaInicio: data.horaInicio,
      };
    });

    return res.status(200).json({
      bandejas: bandejasActivas,
    });
  } catch (error) {
    console.error("Error en getBandejasActivas:", error);
    return res.status(500).json({ message: error.message });
  }
};

// export const bandeja
