const { Mensaje, Usuario, SalaParticipante } = require('../models');
const { enviarNotificacionPush } = require('../services/pushService');
const { Op } = require('sequelize');

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
      include: [{ 
        model: Usuario, 
        as: 'emisor', 
        attributes: ['id', 'username', 'foto_perfil', 'verificado'] 
      }],
      order: [['createdAt', 'ASC']],
    });

    return res.json({ mensajes });
  } catch (err) {
    console.error('Error en obtenerHistorial:', err);
    return res.status(500).json({ error: 'Error al obtener historial de mensajes' });
  }
};

const crearMensaje = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.usuario.id;
    const { contenido } = req.body;
    const sid = Number(id);

    if (!contenido || !contenido.trim()) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    const esParticipante = await SalaParticipante.findOne({ where: { sala_id: sid, usuario_id } });
    if (!esParticipante) {
      return res.status(403).json({ error: 'No sos participante de esta sala' });
    }

    const nuevoMensaje = await Mensaje.create({
      sala_id: sid,
      emisor_id: usuario_id,
      contenido: contenido.trim(),
    });

    const emisor = await Usuario.findByPk(usuario_id, {
      attributes: ['id', 'username', 'foto_perfil', 'verificado']
    });

    const destinatarios = await SalaParticipante.findAll({
      where: {
        sala_id: sid,
        usuario_id: { [Op.ne]: usuario_id }
      }
    });

    destinatarios.forEach((participante) => {
      enviarNotificacionPush({
        usuarioIdTarget: participante.usuario_id,
        titulo: emisor?.username || 'Nuevo mensaje',
        cuerpo: contenido,
        tipoNotif: 'mensaje_nuevo',
        data: {
          sala_id: sid,
          tipo: 'mensaje_nuevo'
        }
      });
    });

    return res.status(201).json({
      mensaje: {
        ...nuevoMensaje.toJSON(),
        emisor
      }
    });
  } catch (err) {
    console.error('Error en crearMensaje:', err);
    return res.status(500).json({ error: 'Error al enviar mensaje' });
  }
};

module.exports = { 
  obtenerHistorial,
  crearMensaje 
};