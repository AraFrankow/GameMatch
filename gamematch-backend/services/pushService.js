const { Expo } = require('expo-server-sdk');
const { Usuario, ConfigNotificaciones } = require('../models');
const expo = new Expo();

async function enviarNotificacionPush({ usuarioIdTarget, titulo, cuerpo, data = {}, tipoNotif }) {
  try {
    const usuarioTarget = await Usuario.findByPk(usuarioIdTarget, {
      attributes: ['id', 'push_token']
    });

    if (!usuarioTarget || !usuarioTarget.push_token) return;
    if (!Expo.isExpoPushToken(usuarioTarget.push_token)) return;

    const [config] = await ConfigNotificaciones.findOrCreate({
      where: { usuario_id: usuarioIdTarget },
      defaults: { mensajes: true, invitaciones: true, sistema: true }
    });

    let tipo = tipoNotif || data?.tipo;
    if (!tipo) {
      tipo = (data?.sala_id || data?.salaId) ? 'mensaje_nuevo' : 'invitacion_sala';
    }

    const estaActivo = (valor) => valor === true || valor === 1 || valor === '1' || valor === undefined;

    let estaPermitido = true;
    if (tipo === 'invitacion_sala' && !estaActivo(config.invitaciones)) estaPermitido = false;
    if ((tipo === 'mensaje_nuevo' || tipo === 'mensaje') && !estaActivo(config.mensajes)) estaPermitido = false;
    if (tipo === 'sistema' && !estaActivo(config.sistema)) estaPermitido = false;

    if (!estaPermitido) {
      console.log(`[PUSH] Descartada tipo '${tipo}' para usuario ${usuarioIdTarget} por configuración.`);
      return;
    }

    const messages = [{
      to: usuarioTarget.push_token,
      sound: 'default',
      title: titulo,
      body: cuerpo,
      data: { ...data, tipo },
      channelId: 'default',
      priority: 'high',
    }];
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (err) {
    console.error('Error en enviarNotificacionPush:', err);
  }
}

module.exports = { enviarNotificacionPush };