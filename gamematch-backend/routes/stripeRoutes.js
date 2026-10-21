const express = require('express');
const router = express.Router();
const { crearCheckoutSession, confirmarPago, cancelarSuscripcion } = require('../controllers/stripeController');
const { verificarAuth } = require('../middleware/auth');

router.post('/crear-checkout-session', verificarAuth, crearCheckoutSession);
router.post('/confirmar-pago', verificarAuth, confirmarPago);
router.post('/cancelar-suscripcion', verificarAuth, cancelarSuscripcion);

module.exports = router;