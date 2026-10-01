const express = require('express');
const router = express.Router();
const { crearSala, listarMisSalas, invitar, unirse, listarInvitaciones, salir, rechazarInvitacion } = require('../controllers/salaController');
const { obtenerHistorial } = require('../controllers/mensajeController');
const { generarTokenVoz } = require('../controllers/vozController');
const { verificarAuth } = require('../middleware/auth');

router.get('/', verificarAuth, listarMisSalas);
router.get('/invitaciones', verificarAuth, listarInvitaciones);
router.get('/:id/mensajes', verificarAuth, obtenerHistorial);
router.get('/:id/token-voz', verificarAuth, generarTokenVoz);

router.post('/', verificarAuth, crearSala);
router.post('/:id/invitar', verificarAuth, invitar);
router.post('/:id/unirse', verificarAuth, unirse);
router.post('/:id/salir', verificarAuth, salir);

router.delete('/invitaciones/:id', verificarAuth, rechazarInvitacion);

module.exports = router;