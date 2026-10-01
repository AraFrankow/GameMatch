const jwt = require('jsonwebtoken');
const generarToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const verificarToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
module.exports = { generarToken, verificarToken };
