const express = require('express');
const router = express.Router();
const { verificarAuth } = require('../middleware/auth');
const { verificarEdadUsuario } = require('../controllers/verificacionController');
const { obtenerPerfilPorId, obtenerPremiumDestacados, toggleSuspension, obtenerUsuarios } = require('../controllers/usuarioController');
const calificacionController = require('../controllers/calificacionController');

router.get('/', verificarAuth, obtenerUsuarios);
router.post('/verificar-edad', verificarAuth, verificarEdadUsuario);
router.get('/premium-destacados', obtenerPremiumDestacados);
router.get('/:id', verificarAuth, obtenerPerfilPorId);
router.post('/:id/calificar', verificarAuth, calificacionController.calificarJugador);
router.put('/:id/suspender', verificarAuth, toggleSuspension);

module.exports = router;