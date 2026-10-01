const express = require('express');
const router = express.Router();
const { buscar } = require('../controllers/busquedaController');
const { verificarAuth } = require('../middleware/auth');
router.get('/', verificarAuth, buscar);
module.exports = router;
