const { Juego } = require('../models');
const listarJuegos = async (req, res) => {
  try {
    const juegos = await Juego.findAll({ attributes: ['id', 'nombre', 'imagen_url', 'genero'], order: [['nombre', 'ASC']] });
    return res.json({ juegos });
  } catch (err) { console.error('Error en listarJuegos:', err); return res.status(500).json({ error: 'Error al listar juegos' }); }
};
module.exports = { listarJuegos };
