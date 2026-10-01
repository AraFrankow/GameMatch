const { verificarToken } = require('../utils/jwt');
const { Usuario } = require('../models');
const verificarAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token no provisto' });
    const token = authHeader.split(' ')[1];
    const payload = verificarToken(token);
    const usuario = await Usuario.findByPk(payload.id);
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });
    if (usuario.suspendido) return res.status(403).json({ error: 'Tu cuenta fue suspendida' });
    req.usuario = usuario;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expirado' });
    return res.status(401).json({ error: 'Token invalido' });
  }
};
const requiereAdmin = (req, res, next) => {
  if (!req.usuario || req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso restringido a administradores' });
  next();
};
module.exports = { verificarAuth, requiereAdmin };
