const express = require('express');
const router = express.Router();
const { eliminarCuenta, obtenerPerfilPublico } = require('../controllers/usuarioController');
const { verificarAuth } = require('../middleware/auth');
router.delete('/me', verificarAuth, eliminarCuenta);
router.get('/:id', verificarAuth, obtenerPerfilPublico);
module.exports = router;
