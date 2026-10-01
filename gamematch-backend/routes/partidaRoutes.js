const express = require('express');
const router = express.Router();
const { obtenerUltimasPartidas } = require('../controllers/partidaController');
const { verificarAuth } = require('../middleware/auth');
router.get('/:usuarioId', verificarAuth, obtenerUltimasPartidas);
module.exports = router;
