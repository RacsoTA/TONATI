import { Bandeja } from "../models/bandeja.model.js";
import { Proceso } from "../models/proceso.model.js";

export const bandejasController = {
  // Obtener todas las bandejas
  async getAll(req, res) {
    try {
      console.log("Obteniendo todas las bandejas...");
      const bandejas = await Promise.all(
        Array.from({ length: 10 }, (_, i) => Bandeja.get((i + 1).toString()))
      );
      console.log("Bandejas encontradas:", bandejas.length);

      // Map the data to match the expected format
      const formattedBandejas = bandejas.map((bandeja) => ({
        id_bandeja: bandeja?.id_bandeja || bandeja?.id,
        cantidad_procesos: bandeja?.cantidad_procesos || 0,
        estatus: bandeja?.estatus || "disponible",
        humedadActual: bandeja?.humedadActual || 0,
        temperaturaActual:
          bandeja?.temperaturaActual || bandeja?.temperatura || 0,
        resistencia: bandeja?.resistencia || 0,
        motor: bandeja?.motor || 0,
        ultimaActualizacion: bandeja?.ultimaActualizacion || new Date(),
      }));

      res.json(formattedBandejas);
    } catch (error) {
      console.error("Error al obtener bandejas:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener una bandeja específica
  async getOne(req, res) {
    try {
      const { id } = req.params;
      console.log("Obteniendo bandeja:", id);
      const bandeja = await Bandeja.get(id);
      if (!bandeja) {
        console.log("Bandeja no encontrada:", id);
        return res.status(404).json({ error: "Bandeja no encontrada" });
      }

      // Map the data to match the expected format
      const formattedBandeja = {
        id_bandeja: bandeja?.id_bandeja || bandeja?.id,
        cantidad_procesos: bandeja?.cantidad_procesos || 0,
        estatus: bandeja?.estatus || "disponible",
        humedadActual: bandeja?.humedadActual || 0,
        temperaturaActual:
          bandeja?.temperaturaActual || bandeja?.temperatura || 0,
        resistencia: bandeja?.resistencia || 0,
        motor: bandeja?.motor || 0,
        ultimaActualizacion: bandeja?.ultimaActualizacion || new Date(),
      };

      console.log("Bandeja encontrada:", formattedBandeja);
      res.json(formattedBandeja);
    } catch (error) {
      console.error("Error al obtener bandeja:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar datos de las bandejas desde el ESP32
  async updateFromESP32(req, res) {
    try {
      const { data } = req.body;
      console.log("Datos recibidos del ESP32:", data);

      if (!data) {
        console.log("Error: No se proporcionaron datos");
        return res.status(400).json({ error: "Datos no proporcionados" });
      }

      // Procesar el string CSV
      const values = data.split(",").map(Number);
      console.log("Valores procesados:", values);

      // Validar que tenemos todos los datos necesarios
      if (values.length !== 40) {
        console.log("Error: Formato de datos inválido", {
          expected: 40,
          received: values.length,
        });
        return res.status(400).json({
          error: "Formato de datos inválido",
          expected: "40 valores (10 bandejas * 4 valores)",
          received: values.length,
        });
      }

      const bandejasData = [];

      for (let i = 0; i < 10; i++) {
        const offset = i * 4;
        bandejasData.push({
          temperaturaActual: values[offset],
          humedadActual: values[offset + 1],
          resistencia: values[offset + 2],
          motor: values[offset + 3],
        });
      }

      console.log("Datos procesados para actualización:", bandejasData);

      // Verificar si las bandejas existen antes de actualizar
      console.log("Verificando existencia de bandejas...");
      const bandejasExistentes = await Promise.all(
        Array.from({ length: 10 }, (_, i) => Bandeja.get((i + 1).toString()))
      );
      console.log("Bandejas existentes:", bandejasExistentes.length);

      await Bandeja.updateAll(bandejasData);
      console.log("Actualización completada exitosamente");

      res.json({
        message: "Datos actualizados correctamente",
        bandejasActualizadas: bandejasData.length,
      });
    } catch (error) {
      console.error("Error al procesar datos del ESP32:", error);
      res.status(500).json({
        error: "Error al procesar datos del ESP32",
        details: error.message,
      });
    }
  },

  // Iniciar un nuevo proceso en una bandeja
  async startProcess(req, res) {
    try {
      const { id_bandeja, tipo_proceso, configuracion } = req.body;

      // Verificar si la bandeja está disponible
      const bandeja = await Bandeja.get(id_bandeja);
      if (!bandeja || bandeja.estatus !== "disponible") {
        return res.status(400).json({ error: "Bandeja no disponible" });
      }

      // Crear nuevo proceso
      const proceso = new Proceso(id_bandeja, tipo_proceso, configuracion);
      const procesoCreated = await Proceso.create(proceso);

      // Actualizar estado de la bandeja
      await bandeja.update({
        estatus: "ocupada",
        cantidad_procesos: bandeja.cantidad_procesos + 1,
      });

      res.json(procesoCreated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Finalizar un proceso
  async endProcess(req, res) {
    try {
      const { id_bandeja, proceso_id } = req.body;

      // Actualizar estado del proceso
      await Proceso.update(proceso_id, {
        estado: "terminado",
        fecha_fin: new Date(),
      });

      // Actualizar estado de la bandeja
      const bandeja = await Bandeja.get(id_bandeja);
      await bandeja.update({
        estatus: "disponible",
      });

      res.json({ message: "Proceso finalizado correctamente" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
