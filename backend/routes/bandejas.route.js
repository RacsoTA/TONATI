import express from "express";

import {
  createBandeja,
  getBandejas,
  getBandeja,
  updateBandeja,
  deleteBandeja,
  bandejaDisponible,
  obtenerBandejaPendiente,
  getBandejasDisponibles,
  prepararNuevoProceso,
  iniciarProceso,
  checkPendingProcess,
  checkTimeoutProcesses,
} from "../controllers/bandeja.control.js";
import { bandejasController } from "../controllers/bandejas.controller.js";

const router = express.Router();

router.get("/bandejas/", getBandejas);
router.post("/bandejas/new", createBandeja);
router.get("/bandejas/bandeja/:id", getBandeja);
router.put("/bandejas/update/:id", updateBandeja);
router.delete("/bandejas/delete/:id", deleteBandeja);
router.put("/bandejas/comenzarProceso/", bandejaDisponible);
router.get("/bandejas/obtenerBandejaPendiente/", obtenerBandejaPendiente);

// ESP32 data update route
router.post("/bandejas/esp32-data", bandejasController.updateFromESP32);

// New endpoints
router.get("/bandejas/disponibles", getBandejasDisponibles);
router.post("/procesos/preparar", prepararNuevoProceso);
router.post("/procesos/iniciar", iniciarProceso);

// ESP32 endpoints
router.get("/esp32/check-pending", checkPendingProcess);
router.get("/esp32/check-timeout", checkTimeoutProcesses);

export default router;
