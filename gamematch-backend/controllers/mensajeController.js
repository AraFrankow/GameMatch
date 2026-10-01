const { Mensaje, Usuario, SalaParticipante } = require('../models');

const obtenerHistorial = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.usuario.id;
    const sid = Number(id);

    const esParticipante = await SalaParticipante.findOne({ where: { sala_id: sid, usuario_id } });
    if (!esParticipante) {
      return res.status(403).json({ error: 'No sos participante de esta sala' });
    }

    const mensajes = await Mensaje.findAll({
      where: { sala_id: sid, bloqueado: false },
      include: [{ model: Usuario, as: 'emisor', attributes: ['id', 'username', 'foto_perfil'] }],
      order: [['createdAt', 'ASC']],
    });

    return res.json({ mensajes });
  } catch (err) {
    console.error('Error en obtenerHistorial:', err);
    return res.status(500).json({ error: 'Error al obtener historial de mensajes' });
  }
};

module.exports = { obtenerHistorial };