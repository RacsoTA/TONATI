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

export const terminarProceso = async (req, res, next) => {
    try {
        const { id_bandeja, id_proceso } = req.body;
        const horaFinal = new Date().toLocaleTimeString();
        // Validación de datos
        if (id_bandeja === undefined) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }
        
    
        // Actualizando el documento en Firestore
        await updateDoc(doc(db, 'procesos', id_proceso), {
        horaFinal,
    
        estatus: 'finalizado'
        });
    
        res.status(200).json({ message: 'Proceso finalizado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    }