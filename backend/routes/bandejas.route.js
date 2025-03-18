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
} from "../controllers/bandeja.control.js";

const router = express.Router();

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

export default router;
