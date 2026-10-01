const { HistorialCompanero, Usuario } = require('../models');
const { calcularReputacionBulk } = require('../utils/reputacion');
const listarCompaneros = async (req, res) => {
  try {
    const historial = await HistorialCompanero.findAll({
      where: { usuario_id: req.usuario.id }, order: [['ultima_interaccion', 'DESC']],
      include: [{ model: Usuario, as: 'companero', attributes: ['id', 'username', 'foto_perfil', 'estado', 'es_premium', 'suspendido'] }],
    });
    const activos = historial.filter((h) => h.companero && !h.companero.suspendido);
    const ids = activos.map((h) => h.companero.id);
    const reputaciones = await calcularReputacionBulk(ids);
    const resultado = activos.map((h) => ({
      companero: { id: h.companero.id, username: h.companero.username, foto_perfil: h.companero.foto_perfil, estado: h.companero.estado, es_premium: h.companero.es_premium, reputacion_porcentaje: (reputaciones.get(h.companero.id) || {}).porcentaje ?? null },
      ultima_interaccion: h.ultima_interaccion,
    }));
    return res.json({ companeros: resultado });
  } catch (err) { console.error('Error en listarCompaneros:', err); return res.status(500).json({ error: 'Error al obtener historial de companeros' }); }
};
module.exports = { listarCompaneros };
