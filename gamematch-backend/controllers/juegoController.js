const { Op } = require('sequelize');
const { Juego } = require('../models');

const listarJuegos = async (req, res) => {
  try {
    const juegos = await Juego.findAll({
      attributes: ['id', 'nombre', 'imagen_url', 'genero'],
      order: [['nombre', 'ASC']]
    });
    return res.json({ juegos });
  } catch (err) {
    console.error('Error en listarJuegos:', err);
    return res.status(500).json({ error: 'Error al listar juegos' });
  }
};

const buscarJuegosSteam = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.json({ juegos: [] });
    }

    const resultados = await Juego.findAll({
      attributes: ['nombre'],
      where: {
        nombre: { [Op.like]: `%${q.trim()}%` }
      },
      group: ['nombre'],
      limit: 8,
      raw: true
    });

    const listaNombres = resultados.map((j) => j.nombre).filter(Boolean);

    return res.json({ juegos: listaNombres });
  } catch (err) {
    console.error('Error en buscarJuegosSteam:', err);
    return res.status(500).json({ error: 'Error al buscar juegos de Steam' });
  }
};

module.exports = {
  listarJuegos,
  buscarJuegosSteam,
};