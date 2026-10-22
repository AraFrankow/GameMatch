const express = require('express');
const router = express.Router();
const { buscarCompaneros } = require('../controllers/busquedaController');
const { verificarAuth } = require('../middleware/auth');
router.get('/', verificarAuth, buscarCompaneros);
module.exports = router;