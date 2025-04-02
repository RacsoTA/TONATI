// scripts/initialize-bandejas.js
import firebase from "../backend/firebase.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const db = getFirestore(firebase);

// Function to initialize the bandejas collection
async function initializeBandejas() {
  try {
    console.log("Starting bandejas initialization...");

    // Create 10 bandejas
    for (let i = 1; i <= 10; i++) {
      const bandejaRef = doc(collection(db, "bandejas"));

      // Default values for a new bandeja
      const bandejaData = {
        id_bandeja: i,
        temperaturaActual: null,
        humedadActual: null,
        estadoMotor: false,
        estadoResistencia: false,
        estatus: "disponible",
        tipo: null,
        ultimaActualizacion: serverTimestamp(),
      };

      await setDoc(bandejaRef, bandejaData);
      console.log(`✅ Created bandeja ${i} with ID: ${bandejaRef.id}`);
    }

    // Create the almacen document
    const almacenRef = doc(collection(db, "almacen"));
    await setDoc(almacenRef, {
      temperaturaActual: null,
      humedadActual: null,
      estadoMotor: false,
      estadoResistencia: false,
      ultimaActualizacion: serverTimestamp(),
    });
    console.log(`✅ Created almacen with ID: ${almacenRef.id}`);

    // Create default parameters for each food type
    const parametrosData = {
      Carne: {
        minTemp: 60,
        maxTemp: 70,
        minHum: 30,
        maxHum: 50,
      },
      Fruta: {
        minTemp: 30,
        maxTemp: 40,
        minHum: 60,
        maxHum: 80,
      },
      Verdura: {
        minTemp: 45,
        maxTemp: 55,
        minHum: 70,
        maxHum: 90,
      },
    };

    for (const [tipo, params] of Object.entries(parametrosData)) {
      const paramRef = doc(db, "parametros", tipo);
      await setDoc(paramRef, params);
      console.log(`✅ Created parameters for ${tipo}`);
    }

    console.log("✨ Database initialization complete!");
    return true;
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    return false;
  }
}

// Run the initialization directly
const main = async () => {
  try {
    const success = await initializeBandejas();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
};

main();
