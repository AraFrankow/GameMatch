const { Sala, SalaParticipante, Usuario, Notificacion } = require('../models');
const { existeBloqueoEntre } = require('./bloqueoController');
const { Op } = require('sequelize');

const MAX_GRUPAL = 5;

const esSegregacionValida = (rangoA, rangoB) => (rangoA === 'menor_18') === (rangoB === 'menor_18');

const crearSala = async (req, res) => {
  try {
    const { tipo, nombre, participante_id } = req.body;
    const creador_id = req.usuario.id;

    if (!['privada', 'grupal'].includes(tipo)) {
      return res.status(400).json({ error: "tipo debe ser 'privada' o 'grupal'" });
    }

    if (tipo === 'privada') {
      if (!participante_id) {
        return res.status(400).json({ error: 'participante_id es obligatorio para salas privadas' });
      }
      if (Number(participante_id) === creador_id) {
        return res.status(400).json({ error: 'No podés crear una sala con vos mismo' });
      }

      const otro = await Usuario.findByPk(participante_id);
      if (!otro) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (await existeBloqueoEntre(creador_id, participante_id)) {
        return res.status(403).json({ error: 'No podés iniciar un chat con este usuario' });
      }

      if (!esSegregacionValida(req.usuario.rango_edad, otro.rango_edad)) {
        return res.status(403).json({ error: 'No se puede iniciar un chat entre un menor de edad y un adulto' });
      }

      const esMenor = req.usuario.rango_edad === 'menor_18';
      if (!esMenor) {
        if (!req.usuario.verificado) {
          return res.status(403).json({
            error: 'Debés verificar tu rostro para iniciar chats en el entorno de adultos.'
          });
        }
        if (!otro.verificado) {
          return res.status(403).json({
            error: 'El usuario destino aún no completó la verificación de su cuenta.'
          });
        }
      }

      const salasCreador = await SalaParticipante.findAll({ where: { usuario_id: creador_id } });
      const idsSalasCreador = salasCreador.map((s) => s.sala_id);
      
      const salaExistente = await Sala.findOne({ 
        where: { id: { [Op.in]: idsSalasCreador }, tipo: 'privada' }, 
        include: [{ model: SalaParticipante, as: 'salaParticipantes', where: { usuario_id: participante_id } }] 
      });

      if (salaExistente) {
        return res.json({ sala: salaExistente, yaExistia: true });
      }

      const sala = await Sala.create({ creador_id, tipo: 'privada', max_participantes: 2 });
      await SalaParticipante.bulkCreate([
        { sala_id: sala.id, usuario_id: creador_id },
        { sala_id: sala.id, usuario_id: participante_id }
      ]);

      return res.status(201).json({ sala });
    }

    const sala = await Sala.create({
      creador_id,
      tipo: 'grupal',
      nombre: nombre || null,
      max_participantes: MAX_GRUPAL
    });
    
    await SalaParticipante.create({ sala_id: sala.id, usuario_id: creador_id });
    return res.status(201).json({ sala });

  } catch (err) { 
    console.error('Error en crearSala:', err); 
    return res.status(500).json({ error: 'Error al crear la sala' }); 
  }
};

const listarMisSalas = async (req, res) => {
  try {
    const participaciones = await SalaParticipante.findAll({
      where: { usuario_id: req.usuario.id },
      include: [{ 
        model: Sala, 
        as: 'sala', 
        include: [{ 
          model: SalaParticipante, 
          as: 'salaParticipantes', 
          include: [{ 
            model: Usuario, 
            as: 'usuario', 
            attributes: ['id', 'username', 'foto_perfil', 'estado', 'verificado', 'rango_edad'] 
          }] 
        }] 
      }],
    });
    
    const salas = participaciones.map((p) => ({ 
      id: p.sala.id, 
      tipo: p.sala.tipo, 
      nombre: p.sala.nombre, 
      max_participantes: p.sala.max_participantes, 
      participantes: p.sala.salaParticipantes.map((sp) => sp.usuario) 
    }));

    return res.json({ salas });
  } catch (err) { 
    console.error('Error en listarMisSalas:', err); 
    return res.status(500).json({ error: 'Error al listar salas' }); 
  }
};

const invitar = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, usuario_id } = req.body;

    if (!(await SalaParticipante.findOne({ where: { sala_id: id, usuario_id: req.usuario.id } }))) {
      return res.status(403).json({ error: 'No sos participante de esta sala' });
    }

    const sala = await Sala.findByPk(id);
    if (!sala) return res.status(404).json({ error: 'Sala no encontrada' });
    if (sala.tipo !== 'grupal') return res.status(400).json({ error: 'Solo se puede invitar a salas grupales' });

    const total = await SalaParticipante.count({ where: { sala_id: id } });
    if (total >= sala.max_participantes) {
      return res.status(400).json({ error: `La sala ya alcanzó el máximo de ${sala.max_participantes} participantes` });
    }

    let invitado = null;
    if (username && username.trim()) {
      invitado = await Usuario.findOne({ where: { username: username.trim() } });
    } else if (usuario_id) {
      invitado = await Usuario.findByPk(Number(usuario_id));
    } else {
      return res.status(400).json({ error: 'Debés ingresar un nombre de usuario' });
    }

    if (!invitado) return res.status(404).json({ error: 'Usuario a invitar no encontrado' });
    const destId = invitado.id;

    if (destId === req.usuario.id) {
      return res.status(400).json({ error: 'No podés invitarte a vos mismo' });
    }

    if (await SalaParticipante.findOne({ where: { sala_id: id, usuario_id: destId } })) {
      return res.status(409).json({ error: 'Ese usuario ya está en la sala' });
    }

    if (await existeBloqueoEntre(req.usuario.id, destId)) {
      return res.status(403).json({ error: 'No podés invitar a este usuario' });
    }

    if (!esSegregacionValida(req.usuario.rango_edad, invitado.rango_edad)) {
      return res.status(403).json({ error: 'No se puede invitar a un usuario del otro lado de la barrera de edad' });
    }

    if (req.usuario.rango_edad !== 'menor_18') {
      if (!req.usuario.verificado) {
        return res.status(403).json({ error: 'Debés verificar tu rostro para invitar usuarios en el entorno de adultos' });
      }
      if (!invitado.verificado) {
        return res.status(403).json({ error: 'El usuario a invitar no ha verificado su cuenta' });
      }
    }

    const notificacion = await Notificacion.create({
      usuario_id: destId,
      tipo: 'invitacion_sala',
      contenido: JSON.stringify({ sala_id: Number(id), invitado_por: req.usuario.username })
    });

    const io = req.app.get('io');
    if (io) {
      const payload = {
        id: notificacion.id,
        sala_id: Number(id),
        invitado_por: req.usuario.username,
        nombre_sala: sala.nombre || 'Sala grupal'
      };
      io.to(`usuario_${destId}`).emit('notificacion:invitacion', payload);
    }

    return res.status(201).json({ 
      notificacion, 
      mensaje: `Invitación enviada a @${invitado.username}` 
    });
  } catch (err) { 
    console.error('Error en invitar:', err); 
    return res.status(500).json({ error: 'Error al invitar usuario' }); 
  }
};

const listarInvitaciones = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;
    const invitaciones = await Notificacion.findAll({ where: { usuario_id, tipo: 'invitacion_sala', leida: false } });
    
    const resultado = await Promise.all(invitaciones.map(async (n) => {
      let data = {};
      try { data = JSON.parse(n.contenido); } catch {}
      const sala = await Sala.findByPk(data.sala_id);
      return {
        id: n.id,
        sala_id: data.sala_id,
        invitado_por: data.invitado_por || 'Un usuario',
        nombre_sala: sala?.nombre || 'Sala grupal'
      };
    }));

    return res.json({ invitaciones: resultado });
  } catch (err) {
    console.error('Error en listarInvitaciones:', err);
    return res.status(500).json({ error: 'Error al obtener invitaciones' });
  }
};

const unirse = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.usuario.id;

    const invitaciones = await Notificacion.findAll({ where: { usuario_id, tipo: 'invitacion_sala', leida: false } });
    const invitacion = invitaciones.find((n) => { 
      try { return JSON.parse(n.contenido).sala_id === Number(id); } catch { return false; } 
    });

    if (!invitacion) {
      return res.status(403).json({ error: 'No tenés una invitación pendiente a esta sala' });
    }

    const sala = await Sala.findByPk(id);
    if (!sala) return res.status(404).json({ error: 'Sala no encontrada' });

    const total = await SalaParticipante.count({ where: { sala_id: id } });
    if (total >= sala.max_participantes) {
      return res.status(400).json({ error: 'La sala ya está llena' });
    }

    if (!(await SalaParticipante.findOne({ where: { sala_id: id, usuario_id } }))) {
      await SalaParticipante.create({ sala_id: id, usuario_id });
    }

    invitacion.leida = true;
    await invitacion.save();

    return res.json({ ok: true, mensaje: 'Te uniste a la sala' });
  } catch (err) { 
    console.error('Error en unirse:', err); 
    return res.status(500).json({ error: 'Error al unirse a la sala' }); 
  }
};

const salir = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.usuario.id;

    const participacion = await SalaParticipante.findOne({ where: { sala_id: id, usuario_id } });
    if (!participacion) {
      return res.status(404).json({ error: 'No sos participante de esta sala' });
    }

    await participacion.destroy();

    const quedan = await SalaParticipante.count({ where: { sala_id: id } });
    if (quedan === 0) {
      await Sala.destroy({ where: { id } });
    }

    return res.json({ ok: true, mensaje: 'Saliste de la sala correctamente' });
  } catch (err) {
    console.error('Error en salir:', err);
    return res.status(500).json({ error: 'Error al salir de la sala' });
  }
};

const rechazarInvitacion = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.usuario.id;

    const borrado = await Notificacion.destroy({
      where: {
        id,
        usuario_id,
        tipo: 'invitacion_sala'
      }
    });

    if (!borrado) {
      return res.status(404).json({ error: 'La invitación no existe o ya fue descartada' });
    }

    return res.json({ ok: true, mensaje: 'Invitación descartada correctamente' });
  } catch (error) {
    console.error('Error al rechazar invitación:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { 
  crearSala, 
  listarMisSalas, 
  invitar, 
  unirse, 
  listarInvitaciones, 
  salir, 
  esSegregacionValida, 
  rechazarInvitacion 
};