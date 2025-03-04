import express from 'express';

import {
  createBandeja,
  getBandejas,
  getBandeja,
  updateBandeja,
  deleteBandeja,
  bandejaDisponible,
  obtenerBandejaPendiente
} from '../controllers/bandeja.control.js';

const router = express.Router();

router.get('/bandejas/', getBandejas);
router.post('/bandejas/new', createBandeja);
router.get('/bandejas/bandeja/:id', getBandeja);
router.put('/bandejas/update/:id', updateBandeja);
router.delete('/bandejas/delete/:id', deleteBandeja);
router.put('/bandejas/comenzarProceso/', bandejaDisponible);
router.get('/bandejas/obtenerBandejaPendiente/', obtenerBandejaPendiente);

export default router;