const { Calificacion, Reputacion } = require('../models');

const ModeloReputacion = Calificacion || Reputacion;

async function calcularReputacionBulk(usuarioIds) {
  const resultadosMap = new Map();

  if (!usuarioIds || usuarioIds.length === 0) return resultadosMap;

  try {
    const votos = await ModeloReputacion.findAll({
      where: { evaluado_id: usuarioIds },
      attributes: ['evaluado_id', 'tipo'],
      raw: true,
    });

    const conteo = {};

    usuarioIds.forEach((id) => {
      conteo[id] = { total: 0, positivas: 0 };
    });

    votos.forEach((v) => {
      if (conteo[v.evaluado_id]) {
        conteo[v.evaluado_id].total += 1;
        if (v.tipo === 'positiva' || v.tipo === 'positivo') {
          conteo[v.evaluado_id].positivas += 1;
        }
      }
    });

    Object.keys(conteo).forEach((id) => {
      const { total, positivas } = conteo[id];
      const porcentaje = total > 0 ? Math.round((positivas / total) * 100) : 100;
      
      resultadosMap.set(Number(id), porcentaje);
      resultadosMap.set(String(id), porcentaje);
    });

    return resultadosMap;
  } catch (error) {
    console.error('Error en calcularReputacionBulk:', error);
    return resultadosMap;
  }
}

module.exports = { calcularReputacionBulk };