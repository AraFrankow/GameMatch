require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gamematch_jwt_secret_key_2026';

const obtenerExpiresIn = () => {
  const envVal = process.env.JWT_EXPIRES_IN;
  if (!envVal) return '7d';
  const limpio = envVal.replace(/['"\r\n]/g, '').trim();
  return limpio || '7d';
};

const generarToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: obtenerExpiresIn()
  });
};

const verificarToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generarToken, verificarToken };