import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

// 🔧 Configura Firebase con tus credenciales
const firebaseConfig = {
  apiKey: "AIzaSyBZmFXHmzCY3IPP2a5eSLi142a9NP5GlhI",
  authDomain: "tonati-1e97b.firebaseapp.com",
  projectId: "tonati-1e97b",
  storageBucket: "tonati-1e97b.firebasestorage.app",
  messagingSenderId: "47138101704",
  appId: "1:47138101704:web:2daed070e047c0882048fd"
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
        estatus: "disponible"
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
