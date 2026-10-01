const express = require('express');
const router = express.Router();
const { votar } = require('../controllers/reputacionController');
const { verificarAuth } = require('../middleware/auth');
router.post('/', verificarAuth, votar);
module.exports = router;
