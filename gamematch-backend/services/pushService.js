const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function enviarNotificacionPush(pushToken, emisorNombre, mensajeTexto, salaId) {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Token de push inválido: ${pushToken}`);
    return;
  }

  const messages = [{
    to: pushToken,
    sound: 'default',
    title: `Mensaje de ${emisorNombre}`,
    body: mensajeTexto,
    data: { sala_id: salaId },
    channelId: 'default',
    priority: 'high',
  }];
}

module.exports = { enviarNotificacionPush };