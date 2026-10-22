const express = require('express');
const router = express.Router();
const { verificarAuth } = require('../middleware/auth');
const { verificarEdadUsuario } = require('../controllers/verificacionController');
const { obtenerPerfilPorId, obtenerPremiumDestacados } = require('../controllers/usuarioController');

router.post('/verificar-edad', verificarAuth, verificarEdadUsuario);
router.get('/premium-destacados', obtenerPremiumDestacados);
router.get('/:id', verificarAuth, obtenerPerfilPorId);

module.exports = router;