const express = require('express');
const router = express.Router();
const { bloquear, desbloquear, listarBloqueos } = require('../controllers/bloqueoController');
const { verificarAuth } = require('../middleware/auth');
router.get('/', verificarAuth, listarBloqueos);
router.post('/', verificarAuth, bloquear);
router.delete('/:bloqueado_id', verificarAuth, desbloquear);
module.exports = router;
