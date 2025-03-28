import firebase from "../firebase.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const db = getFirestore(firebase);

// Initial parameters data
const initialParams = {
  Carne: {
    maxTemp: 80,
    minTemp: 75,
  },
  Fruta: {
    maxTemp: 65,
    minTemp: 60,
  },
  Verdura: {
    maxTemp: 65,
    minTemp: 60,
  },
};

// Initialize parameters collection with default values
export const initializeParametros = async (req, res) => {
  console.log("==== INITIALIZING PARAMETERS ====");
  console.log("Setting default values:", initialParams);

  try {
    const parametrosRef = collection(db, "parametros");

    // Set each parameter document
    for (const [tipo, valores] of Object.entries(initialParams)) {
      console.log(
        `Initializing ${tipo} with max: ${valores.maxTemp}°C, min: ${valores.minTemp}°C`
      );
      await setDoc(doc(parametrosRef, tipo), valores);
    }

    console.log("Parameters initialization successful");
    res.status(200).json({ message: "Parámetros inicializados correctamente" });
  } catch (error) {
    console.error("Error al inicializar parámetros:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all parameters
export const getParametros = async (req, res) => {
  console.log("==== RETRIEVING ALL PARAMETERS ====");

  try {
    const parametrosRef = collection(db, "parametros");
    const snapshot = await getDocs(parametrosRef);

    if (snapshot.empty) {
      console.log("No parameters found in the database");
      return res.status(404).json({ message: "No se encontraron parámetros" });
    }

    const parametros = {};
    snapshot.forEach((doc) => {
      parametros[doc.id] = doc.data();
    });

    console.log("Parameters retrieved successfully:", parametros);
    res.status(200).json(parametros);
  } catch (error) {
    console.error("Error al obtener parámetros:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get specific parameter by type
export const getParametro = async (req, res) => {
  const { tipo } = req.params;
  console.log(`==== RETRIEVING PARAMETER FOR ${tipo} ====`);

  try {
    const parametroRef = doc(db, "parametros", tipo);
    const parametroDoc = await getDoc(parametroRef);

    if (!parametroDoc.exists()) {
      console.log(`Parameter not found for type: ${tipo}`);
      return res.status(404).json({ message: "Parámetro no encontrado" });
    }

    const data = parametroDoc.data();
    console.log(`Parameter for ${tipo} retrieved successfully:`, data);
    res.status(200).json(data);
  } catch (error) {
    console.error(`Error al obtener parámetro para ${tipo}:`, error);
    res.status(500).json({ message: error.message });
  }
};

// Update parameter values
export const updateParametro = async (req, res) => {
  const { tipo } = req.params;
  const { maxTemp, minTemp } = req.body;

  console.log(`==== UPDATING PARAMETER FOR ${tipo} ====`);
  console.log(`New values - Max: ${maxTemp}°C, Min: ${minTemp}°C`);

  try {
    if (!maxTemp || !minTemp) {
      console.log("Missing required fields");
      return res
        .status(400)
        .json({ message: "maxTemp y minTemp son requeridos" });
    }

    if (maxTemp < minTemp) {
      console.log("Invalid values: maxTemp is less than minTemp");
      return res
        .status(400)
        .json({ message: "maxTemp debe ser mayor que minTemp" });
    }

    const parametroRef = doc(db, "parametros", tipo);
    const parametroDoc = await getDoc(parametroRef);

    if (!parametroDoc.exists()) {
      console.log(`Parameter not found for type: ${tipo}`);
      return res.status(404).json({ message: "Parámetro no encontrado" });
    }

    const oldValues = parametroDoc.data();
    console.log(
      `Previous values - Max: ${oldValues.maxTemp}°C, Min: ${oldValues.minTemp}°C`
    );

    await updateDoc(parametroRef, {
      maxTemp,
      minTemp,
    });

    console.log(`Parameter for ${tipo} updated successfully`);
    res.status(200).json({ message: "Parámetro actualizado correctamente" });
  } catch (error) {
    console.error(`Error al actualizar parámetro para ${tipo}:`, error);
    res.status(500).json({ message: error.message });
  }
};
