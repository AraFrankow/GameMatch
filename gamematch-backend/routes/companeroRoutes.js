const express = require('express');
const router = express.Router();
const { listarCompaneros } = require('../controllers/companeroController');
const { verificarAuth } = require('../middleware/auth');
router.get('/', verificarAuth, listarCompaneros);
module.exports = router;
