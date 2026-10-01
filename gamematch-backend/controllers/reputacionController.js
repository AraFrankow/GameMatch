const { Reputacion, HistorialCompanero, Usuario } = require('../models');
const VOTOS_VALIDOS = ['positivo', 'negativo'];
const registrarInteraccion = async (usuario_id, companero_id) => {
  const [historial] = await HistorialCompanero.findOrCreate({ where: { usuario_id, companero_id }, defaults: { ultima_interaccion: new Date() } });
  historial.ultima_interaccion = new Date();
  await historial.save();
};
const votar = async (req, res) => {
  try {
    const { evaluado_id, voto } = req.body;
    const evaluador_id = req.usuario.id;
    if (!evaluado_id || !voto) return res.status(400).json({ error: 'evaluado_id y voto son obligatorios' });
    if (!VOTOS_VALIDOS.includes(voto)) return res.status(400).json({ error: `voto debe ser: ${VOTOS_VALIDOS.join(', ')}` });
    if (Number(evaluado_id) === evaluador_id) return res.status(400).json({ error: 'No podes calificarte a vos mismo' });
    const objetivo = await Usuario.findByPk(evaluado_id);
    if (!objetivo) return res.status(404).json({ error: 'Usuario a calificar no encontrado' });
    const [reputacion] = await Reputacion.findOrCreate({ where: { evaluador_id, evaluado_id }, defaults: { voto } });
    if (reputacion.voto !== voto) { reputacion.voto = voto; await reputacion.save(); }
    await registrarInteraccion(evaluador_id, evaluado_id);
    await registrarInteraccion(evaluado_id, evaluador_id);
    return res.status(201).json({ reputacion });
  } catch (err) { console.error('Error en votar:', err); return res.status(500).json({ error: 'Error al calificar usuario' }); }
};
module.exports = { votar };
