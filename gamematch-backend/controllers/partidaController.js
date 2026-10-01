const { PartidaRiot, Usuario } = require('../models');
const { existeBloqueoEntre } = require('./bloqueoController');
const obtenerUltimasPartidas = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    if (await existeBloqueoEntre(req.usuario.id, usuarioId)) return res.status(403).json({ error: 'No podes ver esta informacion' });
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    const partidas = await PartidaRiot.findAll({ where: { usuario_id: usuarioId }, order: [['jugada_at', 'DESC']], limit: 10, attributes: ['id', 'juego', 'personaje', 'resultado', 'kills', 'deaths', 'assists', 'duracion_min', 'jugada_at'] });
    return res.json({ partidas });
  } catch (err) { console.error('Error en obtenerUltimasPartidas:', err); return res.status(500).json({ error: 'Error al obtener las partidas' }); }
};
module.exports = { obtenerUltimasPartidas };
