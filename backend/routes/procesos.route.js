import express from "express";

import {
  terminarProceso,
  getPendingProcess,
  getActiveProcessOver12Hours,
} from "../controllers/procesos.control.js";

const router = express.Router();

// Regular API endpoints
router.put("/procesos/terminar", terminarProceso);

// ESP32 API endpoints
router.get("/esp32/procesos/pendiente", getPendingProcess);
router.get("/esp32/procesos/activo-12-horas", getActiveProcessOver12Hours);

export default router;
