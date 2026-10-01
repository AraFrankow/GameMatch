const { Reporte, Usuario } = require('../models');
const MOTIVOS_VALIDOS = ['lenguaje_inapropiado', 'acoso', 'spam', 'otro'];
const ESTADOS_VALIDOS = ['pendiente', 'revisado', 'desestimado'];
const crearReporte = async (req, res) => {
  try {
    const { reportado_id, motivo, comentario } = req.body;
    const reportador_id = req.usuario.id;
    if (!reportado_id || !motivo) return res.status(400).json({ error: 'reportado_id y motivo son obligatorios' });
    if (Number(reportado_id) === reportador_id) return res.status(400).json({ error: 'No podes reportarte a vos mismo' });
    if (!MOTIVOS_VALIDOS.includes(motivo)) return res.status(400).json({ error: `motivo debe ser: ${MOTIVOS_VALIDOS.join(', ')}` });
    const objetivo = await Usuario.findByPk(reportado_id);
    if (!objetivo) return res.status(404).json({ error: 'Usuario reportado no encontrado' });
    const reporte = await Reporte.create({ reportador_id, reportado_id, motivo, comentario: comentario || null });
    return res.status(201).json({ reporte });
  } catch (err) { console.error('Error en crearReporte:', err); return res.status(500).json({ error: 'Error al crear el reporte' }); }
};
const listarReportes = async (req, res) => {
  try {
    const { estado } = req.query;
    const where = {};
    if (estado) {
      if (!ESTADOS_VALIDOS.includes(estado)) return res.status(400).json({ error: `estado debe ser: ${ESTADOS_VALIDOS.join(', ')}` });
      where.estado = estado;
    }
    const reportes = await Reporte.findAll({ where, order: [['created_at', 'DESC']], include: [{ model: Usuario, as: 'reportador', attributes: ['id', 'username'] }, { model: Usuario, as: 'reportado', attributes: ['id', 'username', 'suspendido'] }] });
    return res.json({ reportes });
  } catch (err) { console.error('Error en listarReportes:', err); return res.status(500).json({ error: 'Error al listar reportes' }); }
};
const resolverReporte = async (req, res) => {
  try {
    const { estado, accion } = req.body;
    if (!estado || !['revisado', 'desestimado'].includes(estado)) return res.status(400).json({ error: "estado debe ser 'revisado' o 'desestimado'" });
    const reporte = await Reporte.findByPk(req.params.id);
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });
    reporte.estado = estado;
    await reporte.save();
    if (accion === 'suspender') {
      const u = await Usuario.findByPk(reporte.reportado_id);
      if (u) { u.suspendido = true; await u.save(); }
    } else if (accion === 'eliminar') {
      await Usuario.destroy({ where: { id: reporte.reportado_id } });
    }
    return res.json({ reporte, accion: accion || 'ninguna' });
  } catch (err) { console.error('Error en resolverReporte:', err); return res.status(500).json({ error: 'Error al resolver el reporte' }); }
};
module.exports = { crearReporte, listarReportes, resolverReporte };
