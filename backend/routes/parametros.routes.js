import express from "express";
import {
  initializeParametros,
  getParametros,
  getParametro,
  updateParametro,
} from "../controllers/parametros.control.js";

const router = express.Router();

// Initialize parameters with default values
router.post("/initialize", initializeParametros);

// Get all parameters
router.get("/", getParametros);

// Get specific parameter by type
router.get("/:tipo", getParametro);

// Update parameter values
router.put("/:tipo", updateParametro);

export default router;
