const express = require('express');
const router = express.Router();
const passport = require('passport');
const { vincularSteam, desvincularSteam } = require('../controllers/steamController');
const { vincularRiot, desvincularRiot, actualizarRolRiot } = require('../controllers/riotController');
const { verificarAuth } = require('../middleware/auth');

router.post('/steam', verificarAuth, vincularSteam);
router.delete('/steam', verificarAuth, desvincularSteam);

router.get('/steam/auth', (req, res, next) => {
  if (req.query.usuario_id) {
    req.session.usuario_id = req.query.usuario_id;
  }
  passport.authenticate('steam')(req, res, next);
});

router.get(
  '/steam/return',
  passport.authenticate('steam', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/perfil?steam_error=true`,
    session: false 
  }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/perfil?steam_success=true`);
  }
);

router.post('/riot', verificarAuth, vincularRiot);
router.delete('/riot', verificarAuth, desvincularRiot);
router.put('/riot/posicion', verificarAuth, actualizarRolRiot);

module.exports = router;