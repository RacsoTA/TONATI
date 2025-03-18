import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import firebase from "../firebase.js";

const db = getFirestore(firebase);

export class Bandeja {
  constructor(id_bandeja) {
    this.id_bandeja = id_bandeja;
    this.cantidad_procesos = 0;
    this.estatus = "disponible";
    this.humedadActual = 0;
    this.temperaturaActual = 0;
    this.resistencia = 0;
    this.motor = 0;
    this.ultimaActualizacion = new Date();
  }

  toFirestore() {
    return {
      id_bandeja: this.id_bandeja,
      cantidad_procesos: this.cantidad_procesos,
      estatus: this.estatus,
      humedadActual: this.humedadActual,
      temperaturaActual: this.temperaturaActual,
      resistencia: this.resistencia,
      motor: this.motor,
      ultimaActualizacion: this.ultimaActualizacion,
    };
  }

  static async create(id_bandeja) {
    console.log("Creando nueva bandeja:", id_bandeja);
    const bandeja = new Bandeja(id_bandeja);
    await setDoc(
      doc(db, "bandejas", id_bandeja.toString()),
      bandeja.toFirestore()
    );
    console.log("Bandeja creada exitosamente:", id_bandeja);
    return bandeja;
  }

  static async get(id_bandeja) {
    console.log("Obteniendo bandeja de Firestore:", id_bandeja);
    const docRef = doc(db, "bandejas", id_bandeja.toString());
    const docSnap = await getDoc(docRef);
    const exists = docSnap.exists();
    console.log("Bandeja existe:", exists, "ID:", id_bandeja);

    if (exists) {
      const data = docSnap.data();
      console.log("Datos de la bandeja:", data);
      return data;
    }
    return null;
  }

  async update(data) {
    console.log("Actualizando bandeja:", this.id_bandeja, "con datos:", data);
    const docRef = doc(db, "bandejas", this.id_bandeja.toString());
    const updateData = {
      ...data,
      ultimaActualizacion: new Date(),
    };
    await updateDoc(docRef, updateData);
    Object.assign(this, data);
    console.log("Bandeja actualizada exitosamente:", this.id_bandeja);
  }

  static async updateAll(bandejasData) {
    console.log("Iniciando actualización de todas las bandejas");
    const updates = bandejasData.map(async (data, index) => {
      const id_bandeja = (index + 1).toString();
      console.log("Procesando bandeja:", id_bandeja);

      const docRef = doc(db, "bandejas", id_bandeja);

      // Check if bandeja exists
      const docSnap = await getDoc(docRef);
      const exists = docSnap.exists();
      console.log("Bandeja existe:", exists, "ID:", id_bandeja);

      if (!exists) {
        console.log("Creando nueva bandeja:", id_bandeja);
        // Create new bandeja if it doesn't exist
        const bandeja = new Bandeja(id_bandeja);
        await setDoc(docRef, bandeja.toFirestore());
        console.log("Bandeja creada:", id_bandeja);
      }

      // Update the bandeja with new data
      const updateData = {
        ...data,
        ultimaActualizacion: new Date(),
      };
      console.log(
        "Actualizando bandeja:",
        id_bandeja,
        "con datos:",
        updateData
      );
      await updateDoc(docRef, updateData);
      console.log("Bandeja actualizada:", id_bandeja);
    });

    console.log("Esperando que se completen todas las actualizaciones...");
    await Promise.all(updates);
    console.log("Todas las actualizaciones completadas");
  }
}
