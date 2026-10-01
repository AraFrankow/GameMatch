const { Usuario } = require('../models');
const eliminarCuenta = async (req, res) => {
  try { await req.usuario.destroy(); return res.json({ ok: true, mensaje: 'Cuenta eliminada correctamente' }); }
  catch (err) { console.error('Error en eliminarCuenta:', err); return res.status(500).json({ error: 'Error al eliminar la cuenta' }); }
};

const obtenerPerfilPublico = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id, {
      attributes: ['id', 'username', 'foto_perfil', 'rango_edad', 'createdAt']
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({ usuario });
  } catch (err) {
    console.error('Error al obtener perfil público:', err);
    return res.status(500).json({ error: 'Error al obtener el perfil del usuario' });
  }
};

module.exports = { 
  eliminarCuenta,
  obtenerPerfilPublico
 };
