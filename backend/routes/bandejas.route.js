import express from "express";

import {
  getBandejas,
  getBandeja,
  updateBandeja,
  bandejaDisponible,
  activarBandeja,
  finalizarBandeja,
  updateBandejasFromESP32,
  getBandejaPendiente,
  getBandejasActivas12Horas,
  getBandejasActivas,
  regularizarBandejas,
  getBandejasStatusForESP32,
  getAlmacen,
  updateAlmacenState,
  switchAlmacen,
} from "../controllers/bandeja.control.js";

const router = express.Router();

// Almacén routes
router.get("/almacen", getAlmacen);
router.post("/almacen/state", switchAlmacen);

// Bandejas routes
router.get("/bandejas/", getBandejas);
router.get("/bandejas/bandeja/:id", getBandeja);
router.get("/bandejas/pendiente", getBandejaPendiente);
router.get("/bandejas/activas", getBandejasActivas);
router.get("/bandejas/activas12horas", getBandejasActivas12Horas);
router.put("/bandejas/update/:id", updateBandeja);
router.put("/bandejas/comenzarProceso/", bandejaDisponible);
router.put("/bandejas/activar/", activarBandeja);
router.put("/bandejas/finalizar/", finalizarBandeja);
router.post("/bandejas/updateFromESP32", updateBandejasFromESP32);
router.get("/bandejas/regular", regularizarBandejas);

// ESP32 routes
router.get("/bandejas/esp32", getBandejasStatusForESP32);

export default router;
