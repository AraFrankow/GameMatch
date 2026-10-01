const express = require('express');
const router = express.Router();
const { registro, login, googleAuth } = require('../controllers/authController');
const perfilController = require('../controllers/perfilController');
const { verificarAuth } = require('../middleware/auth');

router.post('/registro', registro);
router.post('/login', login);
router.post('/google', googleAuth);

router.get('/me', verificarAuth, perfilController.obtenerMiPerfil);
router.get('/perfil', verificarAuth, perfilController.obtenerMiPerfil);
router.put('/perfil', verificarAuth, perfilController.actualizarPerfil);

module.exports = router;