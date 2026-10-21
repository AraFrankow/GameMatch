const express = require('express');
const router = express.Router();
const { verificarAuth } = require('../middleware/auth');
const { verificarEdadUsuario } = require('../controllers/verificacionController');
const { obtenerPerfilPorId } = require('../controllers/usuarioController');

router.post('/verificar-edad', verificarAuth, verificarEdadUsuario);
router.get('/:id', verificarAuth, obtenerPerfilPorId);

module.exports = router;