import firebase from '../firebase.js';
import Bandeja from '../models/bandeja.models.js';
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
  serverTimestamp
} from 'firebase/firestore';

const db = getFirestore(firebase);

export const createBandeja = async (req, res, next) => {
    try {
      const { id_bandeja, temperatura, humedad, cantidadProcesos, estatus } = req.body;
  
      // Validación de datos
      if (id_bandeja === undefined ||
        temperatura === undefined ||
        humedad === undefined ||
        cantidadProcesos === undefined ||
        estatus === undefined
      ) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
      }
  
      // Creando el documento en Firestore
      const docRef = await addDoc(collection(db, 'bandejas'), {
        id_bandeja,
        temperatura,
        humedad,
        cantidadProcesos,
        estatus,
      });
  
      res.status(201).json({ message: 'Bandeja creada', id: docRef.id });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  export const getBandejas = async (req, res, next) => {
    try {
      const bandejas = await getDocs(collection(db, 'bandejas'));
      const bandejasArray = [];
  
      if (bandejas.empty) {
        res.status(400).send('No hay bandejas');
      } else {
        bandejas.forEach((doc) => {
          const bandeja = new Bandeja(
            doc.id,
            doc.data().id_bandeja,
            doc.data().temperatura,
            doc.data().humedad,
            doc.data().cantidadProcesos,
            doc.data().estatus,
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
      const bandeja = doc(db, 'bandejas', id);
      const data = await getDoc(bandeja);
      if (data.exists()) {
        res.status(200).send(data.data());
      } else {
        res.status(404).send('bandeja not found');
      }
    } catch (error) {
      res.status(400).send(error.message);
    }
  };    

  export const updateBandeja = async (req, res, next) => {
    try {
      const id = req.params.id;
      const data = req.body;
      const bandeja = doc(db, 'bandejas', id);
      await updateDoc(bandeja, data);
      res.status(200).send('bandeja updated successfully');
    } catch (error) {
      res.status(400).send(error.message);
    }
  };

  export const deleteBandeja = async (req, res, next) => {
    try {
      const id = req.params.id;
      await deleteDoc(doc(db, 'bandejas', id));
      res.status(200).send('bandeja deleted successfully');
    } catch (error) {
      res.status(400).send(error.message);
    }
  };

  export const bandejaDisponible = async (req, res, next) => {
    try {
      const { id_bandeja, alimento } = req.body; 
  
      if (id_bandeja === undefined || !alimento) {
        return res.status(400).json({ message: 'El id de la bandeja y el alimento son requeridos' });
      }
  
      // 🔍 Buscar bandeja con id_bandeja
      const bandejasRef = collection(db, 'bandejas');
      const q = query(bandejasRef, where("id_bandeja", "==", id_bandeja));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        return res.status(404).json({ message: 'Bandeja no encontrada' });
      }
  
      // 📌 Tomar el primer documento coincidente
      const bandejaDoc = querySnapshot.docs[0];
      const bandejaRef = doc(db, 'bandejas', bandejaDoc.id);
      const bandejaData = bandejaDoc.data();
  
      if (bandejaData.estatus === 'disponible') {
        // ⏳ Crear un nuevo proceso
        const procesoRef = collection(db, 'procesos');
        const nuevoProceso = {
          estatus: 'pendiente', // Nuevo proceso comienza activo
          alimento: alimento,
          bandeja_ID: id_bandeja, // Se guarda el ID de la bandeja
          horaInicio: serverTimestamp(), // Marca de tiempo automática
          horaFinal: null, // Se actualizará cuando termine el proceso
          humedades: [], // Se llenarán con mediciones futuras
          temperaturas: [] // Se llenarán con mediciones futuras
        };
  
        const procesoCreado = await addDoc(procesoRef, nuevoProceso);
  
        // 📝 Actualizar la bandeja a 'pendiente'
        await updateDoc(bandejaRef, { estatus: 'pendiente' });
  
        return res.status(200).json({
          message: 'Bandeja pendiente de comenzar proceso',
          procesoID: procesoCreado.id // Devolver el ID del proceso creado
        });
  
      } else {
        return res.status(400).json({ message: 'Bandeja no disponible' });
      }
  
    } catch (error) {
      console.error("Error en bandejaDisponible:", error);
      return res.status(500).json({ message: error.message });
    }
  };

  export const obtenerBandejaPendiente = async (req, res) => {
    try {
      const procesosRef = collection(db, 'procesos');
      const q = query(procesosRef, where("estatus", "==", "pendiente"));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        return res.status(200).json({ message: "No hay bandejas pendientes", bandeja_ID: null });
      }
  
      const docSnap = querySnapshot.docs[0];
      const procesoPendiente = docSnap.data();
  
      console.log("📌 Documento obtenido:", procesoPendiente); // 🔍 Verifica en la consola los campos disponibles
  
      return res.status(200).json({
        bandeja_ID: procesoPendiente.bandeja_ID, // 🔴 Revisa que en Firestore este campo realmente se llame así
        alimento: procesoPendiente.alimento,
        proceso_ID: docSnap.id
      });
  
    } catch (error) {
      console.error("Error en obtenerBandejaPendiente:", error);
      return res.status(500).json({ message: error.message });
    }
  };
  
  

  // export const bandeja