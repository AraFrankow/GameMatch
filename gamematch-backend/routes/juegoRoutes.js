const express = require('express');
const router = express.Router();
const { listarJuegos, buscarJuegosSteam } = require('../controllers/juegoController');
const { verificarAuth } = require('../middleware/auth');
router.get('/', verificarAuth, listarJuegos);
router.get('/steam-autocomplete', buscarJuegosSteam);
module.exports = router;