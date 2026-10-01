const { verificarToken } = require('../utils/jwt');
const { Usuario, Mensaje, SalaParticipante } = require('../models');
const { analizarToxicidad, superaUmbral } = require('../utils/moderacion');

// Registro en memoria de usuarios conectados a voz: Map<sala_id, Map<usuario_id, username>>
const usuariosVozPorSala = new Map();

const obtenerUsuariosVoz = (sala_id) => {
  const salaMap = usuariosVozPorSala.get(Number(sala_id));
  if (!salaMap) return [];
  return Array.from(salaMap.values());
};

const registrarChatSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Token no provisto'));
      const payload = verificarToken(token);
      const usuario = await Usuario.findByPk(payload.id);
      if (!usuario) return next(new Error('Usuario no encontrado'));
      if (usuario.suspendido) return next(new Error('Cuenta suspendida'));
      socket.usuario = usuario;
      next();
    } catch (err) { next(new Error('Token invalido')); }
  });

  io.on('connection', async (socket) => {
    const uid = socket.usuario.id;
    console.log(`🔌 Socket conectado: ${socket.usuario.username} (id ${uid})`);

    socket.join(`usuario_${uid}`);
    socket.join(`usuario_${Number(uid)}`);

    // 🟢 UNIR AUTOMÁTICAMENTE A TODAS LAS SALAS DEL USUARIO AL CONECTARSE
    try {
      const misSalas = await SalaParticipante.findAll({
        where: { usuario_id: uid },
        attributes: ['sala_id']
      });
      misSalas.forEach((p) => {
        socket.join(`sala_${p.sala_id}`);
      });
    } catch (err) {
      console.error('Error al suscribir socket a las salas del usuario:', err);
    }

    socket.on('unirse_sala', async ({ sala_id }) => {
      try {
        const sid = Number(sala_id);
        const esParticipante = await SalaParticipante.findOne({ where: { sala_id: sid, usuario_id: uid } });
        if (!esParticipante) return socket.emit('error_chat', { error: 'No sos participante de esta sala' });

        socket.join(`sala_${sid}`);
        socket.emit('unido_sala', { sala_id: sid });

        socket.emit('estado_voz_actualizado', {
          sala_id: sid,
          usuariosVoz: obtenerUsuariosVoz(sid)
        });
      } catch (err) {
        console.error('Error en unirse_sala:', err);
        socket.emit('error_chat', { error: 'Error al unirse a la sala' });
      }
    });

    // 🛠️ NOTIFICAR UNIÓN A SALA
    socket.on('notificar_union_sala', ({ sala_id, usuario_id }) => {
      const sid = Number(sala_id);
      
      // Suscribir este socket a la sala
      socket.join(`sala_${sid}`);
      
      // Notificar a todos los que ya están dentro de esa sala
      io.to(`sala_${sid}`).emit('sala_actualizada', { sala_id: sid });

      // Notificar individualmente al usuario afectado (por si tiene sockets en otros dispositivos)
      if (usuario_id) {
        io.to(`usuario_${Number(usuario_id)}`).emit('sala_actualizada', { sala_id: sid });
      }
    });

    // 🛠️ NOTIFICAR SALIDA DE SALA
    socket.on('notificar_salida_sala', ({ sala_id }) => {
      const sid = Number(sala_id);
      
      // Avisar a los participantes restantes en la sala
      io.to(`sala_${sid}`).emit('sala_actualizada', { sala_id: sid });
      
      // Retirar socket de la sala
      socket.leave(`sala_${sid}`);
    });

    // Registrar ingreso al canal de voz
    socket.on('unirse_voz_socket', ({ sala_id }) => {
      const sid = Number(sala_id);
      if (!usuariosVozPorSala.has(sid)) {
        usuariosVozPorSala.set(sid, new Map());
      }
      usuariosVozPorSala.get(sid).set(uid, { id: uid, username: socket.usuario.username });

      io.to(`sala_${sid}`).emit('estado_voz_actualizado', {
        sala_id: sid,
        usuariosVoz: obtenerUsuariosVoz(sid)
      });
    });

    // Registrar salida del canal de voz
    socket.on('salir_voz_socket', ({ sala_id }) => {
      const sid = Number(sala_id);
      if (usuariosVozPorSala.has(sid)) {
        usuariosVozPorSala.get(sid).delete(uid);
        if (usuariosVozPorSala.get(sid).size === 0) usuariosVozPorSala.delete(sid);
      }
      io.to(`sala_${sid}`).emit('estado_voz_actualizado', {
        sala_id: sid,
        usuariosVoz: obtenerUsuariosVoz(sid)
      });
    });

    socket.on('enviar_mensaje', async ({ sala_id, contenido }) => {
      try {
        if (!contenido || !contenido.trim()) return socket.emit('error_chat', { error: 'El mensaje no puede estar vacio' });

        const sid = Number(sala_id);
        const participantes = await SalaParticipante.findAll({
          where: { sala_id: sid },
          include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'rango_edad'] }]
        });

        const esPart = participantes.some((p) => Number(p.usuario_id) === Number(uid));
        if (!esPart) return socket.emit('error_chat', { error: 'No sos participante de esta sala' });

        const hayMenor = participantes.some((p) => p.usuario?.rango_edad === 'menor_18');
        const { score, categoria } = analizarToxicidad(contenido);
        const bloqueado = superaUmbral(score, hayMenor);

        const mensaje = await Mensaje.create({ sala_id: sid, emisor_id: uid, contenido, bloqueado });

        if (bloqueado) {
          return socket.emit('mensaje_bloqueado', { error: 'Tu mensaje fue bloqueado por contener contenido inapropiado', categoria });
        }

        io.to(`sala_${sid}`).emit('mensaje_nuevo', {
          id: mensaje.id,
          sala_id: sid,
          contenido: mensaje.contenido,
          emisor_id: uid,
          emisor: { id: socket.usuario.id, username: socket.usuario.username, foto_perfil: socket.usuario.foto_perfil },
          created_at: mensaje.createdAt || new Date()
        });
      } catch (err) {
        console.error('Error en enviar_mensaje:', err);
        socket.emit('error_chat', { error: 'Error al enviar el mensaje' });
      }
    });

    // Limpiar presencia de voz al desconectarse
    socket.on('disconnect', () => {
      console.log(`🔌 Socket desconectado: ${socket.usuario.username}`);
      usuariosVozPorSala.forEach((mapaUsuarios, sid) => {
        if (mapaUsuarios.has(uid)) {
          mapaUsuarios.delete(uid);
          io.to(`sala_${sid}`).emit('estado_voz_actualizado', {
            sala_id: sid,
            usuariosVoz: obtenerUsuariosVoz(sid)
          });
        }
      });
    });
  });
};

module.exports = { registrarChatSocket };