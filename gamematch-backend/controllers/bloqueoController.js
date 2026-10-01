const { Bloqueo, Usuario } = require('../models');
const bloquear = async (req, res) => {
  try {
    const { bloqueado_id } = req.body;
    const bloqueador_id = req.usuario.id;
    if (!bloqueado_id) return res.status(400).json({ error: 'bloqueado_id es obligatorio' });
    if (Number(bloqueado_id) === bloqueador_id) return res.status(400).json({ error: 'No podes bloquearte a vos mismo' });
    const objetivo = await Usuario.findByPk(bloqueado_id);
    if (!objetivo) return res.status(404).json({ error: 'Usuario a bloquear no encontrado' });
    if (await Bloqueo.findOne({ where: { bloqueador_id, bloqueado_id } })) return res.status(409).json({ error: 'Ya bloqueaste a este usuario' });
    const bloqueo = await Bloqueo.create({ bloqueador_id, bloqueado_id });
    return res.status(201).json({ bloqueo });
  } catch (err) { console.error('Error en bloquear:', err); return res.status(500).json({ error: 'Error al bloquear usuario' }); }
};
const desbloquear = async (req, res) => {
  try {
    const eliminado = await Bloqueo.destroy({ where: { bloqueador_id: req.usuario.id, bloqueado_id: req.params.bloqueado_id } });
    if (!eliminado) return res.status(404).json({ error: 'No existe ese bloqueo' });
    return res.json({ ok: true, mensaje: 'Usuario desbloqueado' });
  } catch (err) { console.error('Error en desbloquear:', err); return res.status(500).json({ error: 'Error al desbloquear usuario' }); }
};
const listarBloqueos = async (req, res) => {
  try {
    const bloqueos = await Bloqueo.findAll({ where: { bloqueador_id: req.usuario.id }, include: [{ model: Usuario, as: 'bloqueado', attributes: ['id', 'username', 'foto_perfil'] }] });
    return res.json({ bloqueos });
  } catch (err) { console.error('Error en listarBloqueos:', err); return res.status(500).json({ error: 'Error al listar bloqueos' }); }
};
const existeBloqueoEntre = async (a, b) => {
  const { Op } = require('sequelize');
  return !!(await Bloqueo.findOne({ where: { [Op.or]: [{ bloqueador_id: a, bloqueado_id: b }, { bloqueador_id: b, bloqueado_id: a }] } }));
};
const obtenerIdsBloqueados = async (usuarioId) => {
  const { Op } = require('sequelize');
  const bloqueos = await Bloqueo.findAll({ where: { [Op.or]: [{ bloqueador_id: usuarioId }, { bloqueado_id: usuarioId }] } });
  return bloqueos.map((b) => (b.bloqueador_id === Number(usuarioId) ? b.bloqueado_id : b.bloqueador_id));
};
module.exports = { bloquear, desbloquear, listarBloqueos, existeBloqueoEntre, obtenerIdsBloqueados };
