const express = require('express');
const router = express.Router();
const { verificarAuth } = require('../middleware/auth');
const { verificarEdadUsuario } = require('../controllers/verificacionController');
const { Usuario, IntegracionRiot, IntegracionSteam } = require('../models');

router.post('/verificar-edad', verificarAuth, verificarEdadUsuario);

router.get('/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      attributes: ['id', 'username', 'foto_perfil', 'biografia', 'rango_edad', 'verificado']
    });

    if (!usuario) {
      return res.status(404).json({ exito: false, message: 'Usuario no encontrado' });
    }

    const riot = await IntegracionRiot?.findOne({ where: { usuario_id: id } });
    const steam = await IntegracionSteam?.findOne({ where: { usuario_id: id } });

    return res.json({
      exito: true,
      usuario,
      riot: riot || null,
      steam: steam || null
    });
  } catch (error) {
    console.error('Error al obtener perfil por ID:', error);
    return res.status(500).json({ exito: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;