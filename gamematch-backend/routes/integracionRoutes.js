const express = require('express');
const router = express.Router();
const { vincularSteam, desvincularSteam } = require('../controllers/steamController');
const { vincularRiot, desvincularRiot, actualizarRolRiot } = require('../controllers/riotController');
const { verificarAuth } = require('../middleware/auth');

router.post('/steam', verificarAuth, vincularSteam);
router.delete('/steam', verificarAuth, desvincularSteam);
router.post('/riot', verificarAuth, vincularRiot);
router.delete('/riot', verificarAuth, desvincularRiot);
router.put('/riot/posicion', verificarAuth, actualizarRolRiot);

module.exports = router;
