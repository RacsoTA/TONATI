import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

// 🔧 Configura Firebase con tus credenciales
const firebaseConfig = {
  apiKey: "AIzaSyDWn_VPseDkNew-fn7btxFqeo_AaFJ4t4Q",
  authDomain: "apps-design-42.firebaseapp.com",
  projectId: "apps-design-42",
  storageBucket: "apps-design-42.firebasestorage.app",
  messagingSenderId: "617756085262",
  appId: "1:617756085262:web:0e9d368505d625d559005f",
};

// 🚀 Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🛠 Función para resetear bandejas
const resetBandejas = async () => {
  try {
    const bandejasRef = collection(db, "bandejas");
    const snapshot = await getDocs(bandejasRef);

    if (snapshot.empty) {
      console.log("No hay bandejas registradas.");
      return;
    }

    let actualizadas = 0;

    // 🔄 Recorremos todas las bandejas
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // 🔄 Restablecemos la bandeja a disponible
      await updateDoc(doc(db, "bandejas", docSnap.id), {
        estatus: "disponible",
      });

      console.log(`✅ Bandeja ${data.bandeja_ID} restablecida a disponible.`);
      actualizadas++;
    }

    console.log(`🔄 ${actualizadas} bandejas han sido actualizadas.`);
  } catch (error) {
    console.error("🚨 Error al resetear bandejas:", error);
  }
};

// 🚀 Ejecuta la función
resetBandejas();
