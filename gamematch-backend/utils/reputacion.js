const { Reputacion } = require('../models');
const { Op } = require('sequelize');
const calcularReputacionBulk = async (usuarioIds) => {
  if (usuarioIds.length === 0) return new Map();
  const votos = await Reputacion.findAll({ where: { evaluado_id: { [Op.in]: usuarioIds } }, attributes: ['evaluado_id', 'voto'], raw: true });
  const conteos = new Map();
  for (const id of usuarioIds) conteos.set(id, { positivos: 0, negativos: 0 });
  for (const v of votos) {
    const c = conteos.get(v.evaluado_id);
    if (!c) continue;
    if (v.voto === 'positivo') c.positivos++; else c.negativos++;
  }
  const resultado = new Map();
  for (const [id, c] of conteos) {
    const total = c.positivos + c.negativos;
    resultado.set(id, { positivos: c.positivos, negativos: c.negativos, porcentaje: total === 0 ? null : Math.round((c.positivos / total) * 100) });
  }
  return resultado;
};
module.exports = { calcularReputacionBulk };
