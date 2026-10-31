const express = require('express');
const router = express.Router();
const { verificarAuth } = require('../middleware/auth');
const { Usuario } = require('../models');
const { verificarEdadUsuario } = require('../controllers/verificacionController');
const calificacionController = require('../controllers/calificacionController');
const { 
  obtenerPerfilPorId, 
  obtenerPremiumDestacados, 
  toggleSuspension, 
  obtenerUsuarios 
} = require('../controllers/usuarioController');

router.get('/', verificarAuth, obtenerUsuarios);
router.post('/verificar-edad', verificarAuth, verificarEdadUsuario);
router.get('/premium-destacados', obtenerPremiumDestacados);
router.get('/:id', verificarAuth, obtenerPerfilPorId);
router.post('/:id/calificar', verificarAuth, calificacionController.calificarJugador);
router.put('/:id/suspender', verificarAuth, toggleSuspension);
router.post('/:id/suspender', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { dias } = req.body;

    if (!dias || isNaN(dias)) {
      return res.status(400).json({ error: 'Debes indicar una cantidad válida de días.' });
    }

    const fechaFin = new Date();
    fechaFin.setDate(fechaFin.getDate() + parseInt(dias));

    const [filasAfectadas] = await Usuario.update(
      { suspendidoHasta: fechaFin },
      { where: { id } }
    );

    if (filasAfectadas === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const fechaFormateada = fechaFin.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });

    const io = req.app.get('io');
    if (io) {
      io.to(`usuario_${id}`).emit('cuenta_suspendida', {
        mensaje: `Tu cuenta ha sido suspendida hasta el ${fechaFormateada}.`
      });

      const sockets = await io.in(`usuario_${id}`).fetchSockets();
      sockets.forEach(socket => socket.disconnect(true));
    }

    return res.json({
      mensaje: `Usuario ${id} suspendido exitosamente.`,
      suspendidoHasta: fechaFin
    });

  } catch (error) {
    console.error('Error al suspender usuario:', error);
    return res.status(500).json({ error: 'Error interno al procesar la suspensión.' });
  }
});

module.exports = router;