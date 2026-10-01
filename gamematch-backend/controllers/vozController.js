const { RtcTokenBuilder, RtcRole } = require('agora-token');
const { SalaParticipante } = require('../models');

const TOKEN_EXPIRACION_SEGUNDOS = 3600; // 1 hora

const generarTokenVoz = async (req, res) => {
  try {
    const { id } = req.params; 
    const usuario_id = req.usuario.id;

    const esParticipante = await SalaParticipante.findOne({ where: { sala_id: id, usuario_id } });
    if (!esParticipante) {
      return res.status(403).json({ error: 'No sos participante de esta sala' });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    if (!appId || !appCertificate) {
      return res.status(503).json({
        error: 'El chat de voz no esta configurado',
      });
    }

    const FORMATO_VALIDO = /^[0-9a-fA-F]{32}$/;
    if (!FORMATO_VALIDO.test(appId) || !FORMATO_VALIDO.test(appCertificate)) {
      console.error('AGORA_APP_ID o AGORA_APP_CERTIFICATE no tienen el formato esperado (32 caracteres hex)');
      return res.status(503).json({
        error: 'AGORA_APP_ID o AGORA_APP_CERTIFICATE en el .env no tienen el formato correcto (deben ser 32 caracteres hexadecimales, tal como aparecen en el dashboard de Agora, sin espacios ni guiones)',
      });
    }

    const channelName = `sala_${id}`;
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      usuario_id,
      RtcRole.PUBLISHER,
      TOKEN_EXPIRACION_SEGUNDOS,
      TOKEN_EXPIRACION_SEGUNDOS,
    );

    if (!token) {
      return res.status(500).json({ error: 'No se pudo generar el token de voz (verifica las credenciales de Agora)' });
    }

    return res.json({ appId, channel: channelName, token, uid: usuario_id });
  } catch (err) {
    console.error('Error en generarTokenVoz:', err);
    return res.status(500).json({ error: 'Error al generar el token de voz' });
  }
};

module.exports = { generarTokenVoz };
