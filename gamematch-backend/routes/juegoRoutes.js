const express = require('express');
const router = express.Router();
const { listarJuegos } = require('../controllers/juegoController');
const { verificarAuth } = require('../middleware/auth');
router.get('/', verificarAuth, listarJuegos);
module.exports = router;
