const express = require('express');
const router = express.Router();
const { crearReporte, listarReportes, resolverReporte } = require('../controllers/reporteController');
const { verificarAuth, requiereAdmin } = require('../middleware/auth');
router.post('/', verificarAuth, crearReporte);
router.get('/', verificarAuth, requiereAdmin, listarReportes);
router.put('/:id', verificarAuth, requiereAdmin, resolverReporte);
module.exports = router;
