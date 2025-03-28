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
          doc.data().ultimaActualizacion,
          doc.data().tipo
        );
        bandejasArray.push(bandeja);
      });

      // Get almacén data
      const almacenRef = collection(db, "almacen");
      const almacenSnapshot = await getDocs(almacenRef);

      if (!almacenSnapshot.empty) {
        const almacenData = almacenSnapshot.docs[0].data();
        // Create a bandeja object for almacén with id_bandeja 11
        const almacenBandeja = new Bandeja(
          almacenSnapshot.docs[0].id,
          11, // id_bandeja for almacén
          almacenData.temperaturaActual,
          almacenData.humedadActual,
          almacenData.estadoMotor,
          almacenData.estadoResistencia,
          "almacen", // special status for almacén
          almacenData.ultimaActualizacion,
          null // no tipo for almacén
        );
        bandejasArray.push(almacenBandeja);
      }

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
    // console.error("Error en bandejaDisponible:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const activarBandeja = async (req, res) => {
  try {
    const { id_bandeja, tipo } = req.body;

    if (!id_bandeja) {
      return res
        .status(400)
        .json({ message: "El id de la bandeja es requerido" });
    }

    if (!tipo) {
      return res
        .status(400)
        .json({ message: "El tipo de alimento es requerido" });
    }

    // Verificar que el tipo sea válido
    if (!["Carne", "Fruta", "Verdura"].includes(tipo)) {
      return res.status(400).json({
        message: "El tipo de alimento debe ser Carne, Fruta o Verdura",
      });
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
      tipo: tipo,
      horaInicio: serverTimestamp(),
      ultimaActualizacion: serverTimestamp(),
      estadoMotor: true,
      estadoResistencia: true,
    });

    return res.status(200).json({ message: "Bandeja activada exitosamente" });
  } catch (error) {
    console.error("Error en activarBandeja:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const finalizarBandeja = async (req, res) => {
  try {
    console.log("==== INICIANDO FINALIZACIÓN DE BANDEJA ====");
    const { id_bandeja } = req.body;

    console.log(`Solicitud de finalización para bandeja ID: ${id_bandeja}`);

    if (!id_bandeja) {
      console.log("Error: ID de bandeja no proporcionado en la solicitud");
      return res
        .status(400)
        .json({ message: "El id de la bandeja es requerido" });
    }

    // Convertir id_bandeja a número si es un string
    const idBandejaNumeric =
      typeof id_bandeja === "string" ? parseInt(id_bandeja, 10) : id_bandeja;

    console.log(`Buscando bandeja con ID numérico: ${idBandejaNumeric}`);

    // Primero intentar búsqueda con el valor numérico
    const bandejasRef = collection(db, "bandejas");
    let q = query(bandejasRef, where("id_bandeja", "==", idBandejaNumeric));
    let querySnapshot = await getDocs(q);

    // Si no se encuentra, intentar con el valor como string
    if (querySnapshot.empty && typeof idBandejaNumeric === "number") {
      console.log(
        `No se encontró con ID numérico, intentando con string: "${id_bandeja}"`
      );
      q = query(bandejasRef, where("id_bandeja", "==", id_bandeja.toString()));
      querySnapshot = await getDocs(q);
    }

    if (querySnapshot.empty) {
      console.log(
        `Error: No se encontró bandeja con ID ${id_bandeja} (numérico: ${idBandejaNumeric})`
      );

      // Log para depuración: Listar todas las bandejas y sus IDs
      console.log("Listando todas las bandejas para depuración:");
      const allBandejasSnapshot = await getDocs(collection(db, "bandejas"));
      allBandejasSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(
          `- Bandeja doc ID: ${doc.id}, id_bandeja: ${
            data.id_bandeja
          } (type: ${typeof data.id_bandeja}), estatus: ${data.estatus}`
        );
      });

      return res.status(404).json({ message: "Bandeja no encontrada" });
    }

    const bandejaDoc = querySnapshot.docs[0];
    const bandejaData = bandejaDoc.data();

    console.log(`Bandeja encontrada: ID Documento ${bandejaDoc.id}`);
    console.log(`Estado actual: ${bandejaData.estatus}`);
    console.log(`Tipo: ${bandejaData.tipo || "No definido"}`);

    if (bandejaData.estatus !== "activo") {
      console.log(
        `Error: La bandeja está en estado "${bandejaData.estatus}", no en "activo"`
      );
      return res.status(400).json({
        message: "La bandeja debe estar en estado activo para ser finalizada",
      });
    }

    console.log("Actualizando bandeja a estado 'disponible'");
    await updateDoc(doc(db, "bandejas", bandejaDoc.id), {
      estatus: "disponible",
      estadoMotor: false,
      estadoResistencia: false,
      tipo: null, // Reset tipo when bandeja becomes available again
      ultimaActualizacion: serverTimestamp(),
    });

    console.log(`Bandeja ${id_bandeja} finalizada exitosamente`);
    return res.status(200).json({ message: "Bandeja finalizada exitosamente" });
  } catch (error) {
    console.error("Error en finalizarBandeja:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateBandejasFromESP32 = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ message: "Missing data in request body" });
    }

    console.log("data", data);

    let dataArrayWithAlmacenValues = data.split(",");
    console.log(dataArrayWithAlmacenValues.length);
    if (dataArrayWithAlmacenValues.length !== 22) {
      console.log("Invalid data format: expected 22 values");
      return res.status(400).json({
        message:
          "Invalid data format: expected 22 values (2 values × 10 bandejas + 2 values for almacen)",
      });
    }

    // Update each bandeja with its temperature and humidity values
    const dataArray = dataArrayWithAlmacenValues;

    // Obtener todas las bandejas
    const bandejasRef = collection(db, "bandejas");
    const bandejasSnapshot = await getDocs(bandejasRef);

    if (bandejasSnapshot.empty) {
      return res.status(404).json({ message: "No bandejas found in database" });
    }

    // Crear un mapa de bandejas por id_bandeja
    const bandejasMap = new Map();

    bandejasSnapshot.forEach((doc) => {
      const bandejaData = doc.data();
      if (bandejaData.id_bandeja !== undefined) {
        // Convertir a número si es string
        const idBandeja =
          typeof bandejaData.id_bandeja === "string"
            ? parseInt(bandejaData.id_bandeja, 10)
            : bandejaData.id_bandeja;
        bandejasMap.set(idBandeja, {
          ref: doc.ref,
          data: bandejaData,
        });
      }
    });

    const updatePromises = [];
    const updatedBandejas = [];
    const skippedBandejas = [];

    // Process bandejas 1-10
    for (let id = 1; id <= 10; id++) {
      const bandeja = bandejasMap.get(id);
      if (!bandeja) {
        skippedBandejas.push(id);
        continue;
      }

      // Correct index calculation for data array
      // For bandeja 1, we want index 0,1
      // For bandeja 2, we want index 2,3, etc.
      const dataIndex = (id - 1) * 2;

      const tempValue = dataArray[dataIndex];
      const humValue = dataArray[dataIndex + 1];

      const temperaturaActual =
        tempValue && !isNaN(tempValue) ? parseFloat(tempValue) : null;
      const humedadActual =
        humValue && !isNaN(humValue) ? parseFloat(humValue) : null;
      const ultimaActualizacion = serverTimestamp();

      updatePromises.push(
        updateDoc(bandeja.ref, {
          temperaturaActual,
          humedadActual,
          ultimaActualizacion,
        })
      );

      updatedBandejas.push(id);
    }

    // Process almacen (ID 11) separately
    // Almacen data is at indices 20,21 (last two values)
    const almacenBandeja = bandejasMap.get(11);
    if (almacenBandeja) {
      const almacenTempValue = dataArray[20]; // Last two values are for almacen
      const almacenHumValue = dataArray[21];

      const temperaturaActual =
        almacenTempValue && !isNaN(almacenTempValue)
          ? parseFloat(almacenTempValue)
          : null;
      const humedadActual =
        almacenHumValue && !isNaN(almacenHumValue)
          ? parseFloat(almacenHumValue)
          : null;

      updatePromises.push(
        updateDoc(almacenBandeja.ref, {
          temperaturaActual,
          humedadActual,
          ultimaActualizacion: serverTimestamp(),
        })
      );
      updatedBandejas.push(11);
    } else {
      skippedBandejas.push(11);
    }

    if (updatePromises.length === 0) {
      return res.status(400).json({
        message: "No valid bandejas to update",
      });
    }

    await Promise.all(updatePromises);
    res.status(200).json({
      message: "Bandejas updated successfully",
      updated: updatedBandejas,
      skipped: skippedBandejas,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating bandejas",
      error: error.message,
    });
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
            bandeja: {
              bandeja_id: doc.id,
              id_bandeja: bandejaData.id_bandeja,
              horaInicio: horaInicio,
              tipo: bandejaData.tipo,
              temperaturaActual: bandejaData.temperaturaActual,
              humedadActual: bandejaData.humedadActual,
            },
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
        motor: data.estadoMotor ? 1 : 0,
        resistencia: data.estadoResistencia ? 1 : 0,
        tipo: data.tipo || null,
        horaInicio: data.horaInicio,
        ultimaActualizacion: data.ultimaActualizacion,
      };
    });

    // console.log("Bandejas activas encontradas:", bandejasActivas.length);
    bandejasActivas.forEach((bandeja) => {
      // console.log(
      //   `Bandeja ${bandeja.id_bandeja} - Tipo: ${bandeja.tipo}, Temp: ${bandeja.temperaturaActual}°C`
      // );
    });

    return res.status(200).json({
      bandejas: bandejasActivas,
    });
  } catch (error) {
    // console.error("Error en getBandejasActivas:", error);
    return res.status(500).json({ message: error.message });
  }
};
// Endpoint para regularizar temperaturas de bandejas
export const regularizarBandejas = async (req, res) => {
  console.log("==== INICIANDO REGULARIZACIÓN DE TEMPERATURAS DE BANDEJAS ====");

  try {
    console.log("1. Obteniendo bandejas activas...");
    // 1. Obtener todas las bandejas activas
    const bandejasRef = collection(db, "bandejas");
    const q = query(bandejasRef, where("estatus", "==", "activo"));
    const bandejasSnapshot = await getDocs(q);

    if (bandejasSnapshot.empty) {
      console.log("⚠️ No hay bandejas activas para regularizar");
      return res.status(200).json({
        message: "No hay bandejas activas para regularizar",
        data: {
          apagarResistencias: [],
          prenderResistencias: [],
        },
      });
    }

    console.log(`✅ Se encontraron ${bandejasSnapshot.size} bandejas activas`);

    console.log("2. Obteniendo parámetros de temperatura...");
    // 2. Obtener todos los parámetros
    const parametrosRef = collection(db, "parametros");
    const parametrosSnapshot = await getDocs(parametrosRef);

    if (parametrosSnapshot.empty) {
      console.log("❌ ERROR: No se encontraron parámetros de temperatura");
      return res.status(404).json({
        message: "No se encontraron parámetros de temperatura",
      });
    }

    // Crear un mapa de parámetros por tipo
    const parametros = {};
    parametrosSnapshot.forEach((doc) => {
      parametros[doc.id] = doc.data();
    });

    console.log("✅ Parámetros cargados:", parametros);

    // 3. Analizar cada bandeja activa
    console.log("3. Analizando temperaturas de bandejas activas...");
    const apagarResistencias = [];
    const prenderResistencias = [];
    const updatePromises = []; // Array para almacenar promesas de actualización

    bandejasSnapshot.forEach((doc) => {
      const bandeja = doc.data();
      const id_bandeja = bandeja.id_bandeja;
      let tipo = bandeja.tipo || "Fruta"; // Usar Fruta como tipo por defecto si no está especificado
      const temperaturaActual = bandeja.temperaturaActual;

      console.log(`\n📊 Analizando bandeja ${id_bandeja}:`);
      console.log(`  • ID Documento: ${doc.id}`);
      console.log(`  • Tipo: ${tipo}`);
      console.log(`  • Temperatura actual: ${temperaturaActual}°C`);

      // Verificar que existan parámetros para este tipo
      if (!parametros[tipo]) {
        console.warn(
          `  ⚠️ No se encontraron parámetros para el tipo ${tipo}, usando Fruta como predeterminado`
        );
        tipo = "Fruta";
      }

      const { maxTemp, minTemp } = parametros[tipo];
      console.log(
        `  • Parámetros de ${tipo}: min=${minTemp}°C, max=${maxTemp}°C`
      );

      // Si la temperatura es válida (no es null, undefined o NaN)
      if (
        temperaturaActual !== null &&
        temperaturaActual !== undefined &&
        !isNaN(temperaturaActual)
      ) {
        // Si la temperatura está por encima del máximo
        if (temperaturaActual > maxTemp) {
          console.log(
            `  ⚠️ Temperatura por encima del máximo (${temperaturaActual} > ${maxTemp}). Apagar resistencia.`
          );
          apagarResistencias.push(id_bandeja);

          // Actualizar en la base de datos para apagar la resistencia
          if (bandeja.estadoResistencia) {
            console.log(
              `  Apagando resistencia para bandeja ${id_bandeja} en la base de datos`
            );
            updatePromises.push(
              updateDoc(doc.ref, {
                estadoResistencia: false,
                ultimaActualizacion: serverTimestamp(),
              })
            );
          }
        }
        // Si la temperatura está por debajo del mínimo
        else if (temperaturaActual < minTemp) {
          console.log(
            `  ⚠️ Temperatura por debajo del mínimo (${temperaturaActual} < ${minTemp}). Encender resistencia.`
          );
          prenderResistencias.push(id_bandeja);

          // Actualizar en la base de datos para encender la resistencia
          if (!bandeja.estadoResistencia) {
            console.log(
              `  Encendiendo resistencia para bandeja ${id_bandeja} en la base de datos`
            );
            updatePromises.push(
              updateDoc(doc.ref, {
                estadoResistencia: true,
                ultimaActualizacion: serverTimestamp(),
              })
            );
          }
        } else {
          console.log(
            `  ✅ Temperatura dentro del rango (${minTemp} ≤ ${temperaturaActual} ≤ ${maxTemp}).`
          );
        }
      } else {
        console.warn(
          `  ❌ Temperatura inválida para bandeja ${id_bandeja}: ${temperaturaActual}`
        );
      }
    });

    // 4. Ejecutar todas las actualizaciones de la base de datos
    if (updatePromises.length > 0) {
      console.log(
        `Ejecutando ${updatePromises.length} actualizaciones en la base de datos`
      );
      await Promise.all(updatePromises);
      console.log("Actualizaciones completadas con éxito");
    }

    // 5. Devolver resultados
    console.log("\n==== RESULTADO DE LA REGULARIZACIÓN ====");
    console.log(
      `• Bandejas con resistencia apagada (${apagarResistencias.length}): ${
        apagarResistencias.join(", ") || "ninguna"
      }`
    );
    console.log(
      `• Bandejas con resistencia encendida (${prenderResistencias.length}): ${
        prenderResistencias.join(", ") || "ninguna"
      }`
    );

    return res.status(200).json({
      message: "Regularización de temperaturas completada",
      data: {
        apagarResistencias,
        prenderResistencias,
      },
    });
  } catch (error) {
    console.error("❌ ERROR en regularizarBandejas:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getBandejasForESP32 = async (req, res) => {
  try {
    const bandejasRef = collection(db, "bandejas");
    const querySnapshot = await getDocs(bandejasRef);

    if (querySnapshot.empty) {
      return res.status(200).json({
        message: "No hay bandejas",
        bandejas: [],
      });
    }

    const bandejas = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        bandeja_id: doc.id,
        id_bandeja: data.id_bandeja,
        estatus: data.estatus,
        temperaturaActual: data.temperaturaActual,
        humedadActual: data.humedadActual,
        motor: data.estadoMotor ? 1 : 0,
        resistencia: data.estadoResistencia ? 1 : 0,
        tipo: data.tipo || null,
        horaInicio: data.horaInicio,
        ultimaActualizacion: data.ultimaActualizacion,
      };
    });

    return res.status(200).json({
      bandejas: bandejas,
    });
  } catch (error) {
    console.error("Error en getBandejasForESP32:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getAlmacen = async (req, res) => {
  try {
    const almacenRef = collection(db, "almacen");
    const almacenSnapshot = await getDocs(almacenRef);

    if (almacenSnapshot.empty) {
      return res.status(404).json({ message: "No se encontró el almacén" });
    }

    const almacenData = almacenSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(almacenData);
  } catch (error) {
    console.error("Error al obtener datos del almacén:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateAlmacenState = async (req, res) => {
  try {
    const { estadoMotor, estadoResistencia } = req.body;

    if (estadoMotor === undefined || estadoResistencia === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const almacenRef = collection(db, "almacen");
    const almacenSnapshot = await getDocs(almacenRef);

    if (almacenSnapshot.empty) {
      return res.status(404).json({ message: "No se encontró el almacén" });
    }

    const almacenDoc = almacenSnapshot.docs[0];
    await updateDoc(doc(db, "almacen", almacenDoc.id), {
      estadoMotor,
      estadoResistencia,
      ultimaActualizacion: serverTimestamp(),
    });

    return res.status(200).json({ message: "Estado del almacén actualizado" });
  } catch (error) {
    console.error("Error al actualizar estado del almacén:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getBandejasStatusForESP32 = async (req, res) => {
  try {
    console.log("==== OBTENIENDO ESTADO DE BANDEJAS PARA ESP32 ====");

    // 1. Obtener todas las bandejas
    const bandejasRef = collection(db, "bandejas");
    const bandejasSnapshot = await getDocs(bandejasRef);

    if (bandejasSnapshot.empty) {
      console.log("No hay bandejas en la base de datos");
      return res.status(200).json({
        bandejas_prendidas: [],
        bandejas_apagadas: [],
        prendida_sinResistencia: [],
      });
    }

    // 2. Obtener parámetros de temperatura/humedad para todos los tipos
    console.log("Obteniendo parámetros para todos los tipos...");
    const parametrosRef = collection(db, "parametros");
    const parametrosSnapshot = await getDocs(parametrosRef);

    if (parametrosSnapshot.empty) {
      console.log(
        "ADVERTENCIA: No se encontraron parámetros de temperatura/humedad"
      );
      return res.status(200).json({
        error: "No se encontraron parámetros",
        bandejas_prendidas: [],
        bandejas_apagadas: [],
        prendida_sinResistencia: [],
      });
    }

    // Crear mapa de parámetros por tipo
    const parametros = {};
    parametrosSnapshot.forEach((doc) => {
      parametros[doc.id] = doc.data();
    });
    console.log("Parámetros cargados:", Object.keys(parametros));

    // 3. Preparar listas
    const bandejas_prendidas = [];
    const bandejas_apagadas = [];
    const prendida_sinResistencia = [];
    const updatePromises = []; // Array para almacenar promesas de actualización

    // 4. Calcular tiempo actual para verificar 12 horas
    const now = new Date();

    // 5. Procesar cada bandeja
    bandejasSnapshot.forEach((doc) => {
      const data = doc.data();
      const id_bandeja = data.id_bandeja;

      // Verificar si la bandeja tiene un id_bandeja válido
      if (id_bandeja === undefined || id_bandeja === null) {
        console.log(`Bandeja ${doc.id} no tiene id_bandeja válido, omitiendo`);
        return; // Skip this iteration
      }

      console.log(
        `Procesando bandeja ${id_bandeja} (estatus: ${data.estatus})`
      );

      // Si la bandeja no está activa, va directamente a apagadas
      if (data.estatus !== "activo") {
        console.log(
          `  Bandeja ${id_bandeja} no está activa, añadiendo a bandejas_apagadas`
        );
        bandejas_apagadas.push(id_bandeja);
        // No es necesario apagar en la BD si ya no está activa
        return; // Skip further processing
      }

      // Verificar tiempo activo (si tiene horaInicio)
      const horaInicio = data.horaInicio?.toDate();
      if (!horaInicio) {
        console.log(
          `  Bandeja ${id_bandeja} no tiene horaInicio, añadiendo a bandejas_apagadas`
        );
        bandejas_apagadas.push(id_bandeja);

        // Actualizar en la base de datos para apagar la bandeja
        console.log(
          `  Apagando bandeja ${id_bandeja} en la base de datos (sin horaInicio)`
        );
        updatePromises.push(
          updateDoc(doc.ref, {
            estadoMotor: false,
            estadoResistencia: false,
            ultimaActualizacion: serverTimestamp(),
          })
        );
        return;
      }

      // Calcular horas activas
      const horasActiva = (now - horaInicio) / (1000 * 60 * 60);
      console.log(
        `  Bandeja ${id_bandeja} activa por ${horasActiva.toFixed(2)} horas`
      );

      // Si ha estado activa por más de 12 horas, va a apagadas
      if (horasActiva >= 12) {
        console.log(
          `  Bandeja ${id_bandeja} activa por más de 12 horas, añadiendo a bandejas_apagadas`
        );
        bandejas_apagadas.push(id_bandeja);

        // Actualizar en la base de datos para apagar la bandeja por tiempo excedido
        console.log(
          `  Apagando bandeja ${id_bandeja} en la base de datos (12h excedidas)`
        );
        updatePromises.push(
          updateDoc(doc.ref, {
            estadoMotor: false,
            estadoResistencia: false,
            ultimaActualizacion: serverTimestamp(),
          })
        );
        return;
      }

      // Verificar tipo y parámetros
      const tipo = data.tipo || "Fruta"; // Usar Fruta como tipo por defecto

      if (!parametros[tipo]) {
        console.log(
          `  No se encontraron parámetros para el tipo ${tipo}, usando Fruta como predeterminado`
        );
      }

      // Obtener parámetros para el tipo (o usar Fruta como fallback)
      const tipoParams = parametros[tipo] ||
        parametros["Fruta"] || {
          minTemp: 20,
          maxTemp: 30,
          minHum: 40,
          maxHum: 60,
        };

      // Verificar temperatura
      const temp = data.temperaturaActual;
      if (temp === undefined || temp === null || isNaN(temp)) {
        console.log(
          `  Bandeja ${id_bandeja} no tiene temperatura válida, añadiendo a bandejas_prendidas por defecto`
        );
        bandejas_prendidas.push(id_bandeja);
        return;
      }

      // Lógica de temperatura
      if (temp > tipoParams.maxTemp) {
        console.log(
          `  Bandeja ${id_bandeja} temperatura (${temp}) sobre máximo (${tipoParams.maxTemp}), añadiendo a prendida_sinResistencia`
        );
        prendida_sinResistencia.push(id_bandeja);

        // Actualizamos en la base de datos para apagar solo la resistencia
        if (data.estadoResistencia) {
          console.log(
            `  Apagando solo resistencia para bandeja ${id_bandeja} en la base de datos`
          );
          updatePromises.push(
            updateDoc(doc.ref, {
              estadoResistencia: false,
              ultimaActualizacion: serverTimestamp(),
            })
          );
        }
      } else if (temp < tipoParams.minTemp) {
        console.log(
          `  Bandeja ${id_bandeja} temperatura (${temp}) bajo mínimo (${tipoParams.minTemp}), añadiendo a bandejas_prendidas`
        );
        bandejas_prendidas.push(id_bandeja);

        // Aseguramos que la resistencia esté encendida
        if (!data.estadoResistencia) {
          console.log(
            `  Encendiendo resistencia para bandeja ${id_bandeja} en la base de datos`
          );
          updatePromises.push(
            updateDoc(doc.ref, {
              estadoResistencia: true,
              ultimaActualizacion: serverTimestamp(),
            })
          );
        }
      } else {
        console.log(
          `  Bandeja ${id_bandeja} temperatura (${temp}) dentro de rango, añadiendo a bandejas_prendidas`
        );
        bandejas_prendidas.push(id_bandeja);
      }
    });

    // 6. Incluir almacén si es necesario (opcional, ajustar según necesidad)
    try {
      const almacenRef = collection(db, "almacen");
      const almacenSnapshot = await getDocs(almacenRef);

      if (!almacenSnapshot.empty) {
        // Almacén generalmente usa ID 11
        bandejas_apagadas.push(11);
        console.log("Añadiendo almacén (ID 11) a bandejas_apagadas");
      }
    } catch (error) {
      console.log("Error al procesar almacén:", error.message);
    }

    // 7. Ejecutar todas las actualizaciones de la base de datos
    if (updatePromises.length > 0) {
      console.log(
        `Ejecutando ${updatePromises.length} actualizaciones en la base de datos`
      );
      await Promise.all(updatePromises);
      console.log("Actualizaciones completadas con éxito");
    }

    // 8. Devolver resultado
    console.log("Resultado final:");
    console.log(`  bandejas_prendidas: ${bandejas_prendidas.join(", ")}`);
    console.log(`  bandejas_apagadas: ${bandejas_apagadas.join(", ")}`);
    console.log(
      `  prendida_sinResistencia: ${prendida_sinResistencia.join(", ")}`
    );

    return res.status(200).json({
      bandejas_prendidas,
      bandejas_apagadas,
      prendida_sinResistencia,
    });
  } catch (error) {
    console.error("Error en getBandejasStatusForESP32:", error);
    return res.status(500).json({ message: error.message });
  }
};

// export const bandeja
