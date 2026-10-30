const { Reporte, Usuario, SalaParticipante, Mensaje } = require('../models');
const { Op } = require('sequelize');

const MOTIVOS_VALIDOS = ['lenguaje_inapropiado', 'acoso', 'spam', 'otro'];
const ESTADOS_VALIDOS = ['pendiente', 'revisado', 'desestimado'];

const crearReporte = async (req, res) => {
  try {
    const { reportado_id, motivo, comentario } = req.body;
    const reportador_id = req.usuario.id;

    if (!reportado_id || !motivo) {
      return res.status(400).json({ error: 'reportado_id y motivo son obligatorios' });
    }
    if (Number(reportado_id) === Number(reportador_id)) {
      return res.status(400).json({ error: 'No podés reportarte a vos mismo' });
    }
    if (!MOTIVOS_VALIDOS.includes(motivo)) {
      return res.status(400).json({ error: `motivo debe ser: ${MOTIVOS_VALIDOS.join(', ')}` });
    }

    const objetivo = await Usuario.findByPk(reportado_id);
    if (!objetivo) {
      return res.status(404).json({ error: 'Usuario reportado no encontrado' });
    }

    const salasReportador = await SalaParticipante.findAll({
      where: { usuario_id: reportador_id },
      attributes: ['sala_id']
    });

    if (!salasReportador || salasReportador.length === 0) {
      return res.status(400).json({
        error: 'Solo podés reportar a usuarios con los que hayas interactuado previamente en un chat.'
      });
    }

    const salaIds = salasReportador.map((s) => s.sala_id);

    const salaCompartida = await SalaParticipante.findOne({
      where: {
        sala_id: { [Op.in]: salaIds },
        usuario_id: reportado_id
      }
    });

    if (!salaCompartida) {
      return res.status(400).json({
        error: 'Solo podés reportar a usuarios con los que hayas interactuado previamente en un chat.'
      });
    }

    let evidenciaChat = [];
    try {
      const mensajes = await Mensaje.findAll({
        where: { sala_id: salaCompartida.sala_id },
        order: [['created_at', 'DESC']],
        limit: 30,
        include: [{ model: Usuario, as: 'emisor', attributes: ['id', 'username'] }]
      });

      evidenciaChat = mensajes.reverse().map((m) => ({
        emisor: m.emisor?.username || 'Desconocido',
        emisor_id: m.emisor_id,
        texto: m.contenido,
        fecha: m.created_at
      }));
    } catch (chatErr) {
      console.warn('No se pudo adjuntar historial de mensajes:', chatErr.message);
    }

    const reporte = await Reporte.create({
      reportador_id,
      reportado_id,
      motivo,
      comentario: comentario || null,
      evidencia_chat: JSON.stringify(evidenciaChat)
    });

    return res.status(201).json({ reporte });
  } catch (err) {
    console.error('Error detallado en crearReporte:', err);
    return res.status(500).json({ error: 'Error al crear el reporte' });
  }
};

const listarReportes = async (req, res) => {
  try {
    const { estado } = req.query;
    const where = {};

    if (estado) {
      if (!ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({ error: `estado debe ser: ${ESTADOS_VALIDOS.join(', ')}` });
      }
      where.estado = estado;
    }

    const reportes = await Reporte.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        { model: Usuario, as: 'reportador', attributes: ['id', 'username'] },
        { model: Usuario, as: 'reportado', attributes: ['id', 'username', 'suspendido'] },
      ],
    });

    const reportesConEvidencia = reportes.map(r => {
      const item = r.toJSON();
      try {
        item.evidencia_chat = item.evidencia_chat ? JSON.parse(item.evidencia_chat) : [];
      } catch (e) {
        item.evidencia_chat = [];
      }
      return item;
    });

    return res.json({ reportes: reportesConEvidencia });
  } catch (err) {
    console.error('Error en listarReportes:', err);
    return res.status(500).json({ error: 'Error al listar reportes' });
  }
};

const resolverReporte = async (req, res) => {
  try {
    const { estado, accion } = req.body;

    if (!estado || !['revisado', 'desestimado'].includes(estado)) {
      return res.status(400).json({ error: "estado debe ser 'revisado' o 'desestimado'" });
    }

    const reporte = await Reporte.findByPk(req.params.id);
    if (!reporte) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    reporte.estado = estado;
    await reporte.save();

    if (accion === 'suspender') {
      const u = await Usuario.findByPk(reporte.reportado_id);
      if (u) {
        u.suspendido = true;
        await u.save();
      }
    } else if (accion === 'eliminar') {
      await Usuario.destroy({ where: { id: reporte.reportado_id } });
    }

    if (accion === 'suspender' || accion === 'eliminar') {
      const io = req.app.get('io');
      if (io) {
        io.to(`usuario_${reporte.reportado_id}`).emit('cuenta_suspendida', {
          mensaje: accion === 'eliminar'
            ? '🚫 Tu cuenta ha sido eliminada por un administrador.'
            : '🚫 Tu cuenta ha sido suspendida por un administrador debido a denuncias en el chat.'
        });
      }
    }

    return res.json({ reporte, accion: accion || 'ninguna' });
  } catch (err) {
    console.error('Error en resolverReporte:', err);
    return res.status(500).json({ error: 'Error al resolver el reporte' });
  }
};

module.exports = { crearReporte, listarReportes, resolverReporte };