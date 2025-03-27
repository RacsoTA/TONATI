import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { Almacen } from "../models/almacen.models.js";

// 🔧 Configura Firebase con tus credenciales
const firebaseConfig = {
  apiKey: "AIzaSyBZmFXHmzCY3IPP2a5eSLi142a9NP5GlhI",
  authDomain: "tonati-1e97b.firebaseapp.com",
  projectId: "tonati-1e97b",
  storageBucket: "tonati-1e97b.firebasestorage.app",
  messagingSenderId: "47138101704",
  appId: "1:47138101704:web:2daed070e047c0882048fd",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🛠 Función para crear almacén
const crearAlmacen = async () => {
  try {
    // Crear una nueva instancia de Almacen
    const nuevoAlmacen = new Almacen(
      "almacen1", // id
      25, // temperaturaActual
      60, // humedadActual
      false, // estadoMotor
      false // estadoResistencia
    );

    // Convertir la instancia a un objeto plano
    const almacenData = {
      id: nuevoAlmacen.id,
      temperaturaActual: nuevoAlmacen.temperaturaActual,
      humedadActual: nuevoAlmacen.humedadActual,
      estadoMotor: nuevoAlmacen.estadoMotor,
      estadoResistencia: nuevoAlmacen.estadoResistencia,
    };

    // Agregar el almacén a la colección
    const docRef = await addDoc(collection(db, "almacen"), almacenData);
    console.log("✅ Almacén creado con ID:", docRef.id);
  } catch (error) {
    console.error("🚨 Error al crear almacén:", error);
  }
};

// 🚀 Ejecuta la función
crearAlmacen();
