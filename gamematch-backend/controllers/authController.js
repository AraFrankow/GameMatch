const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { Usuario, AuthGoogle } = require('../models');
const { generarToken } = require('../utils/jwt');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const SALT_ROUNDS = 10;

const verificarSuspension = (usuario) => {
  if (usuario.suspendidoHasta && new Date(usuario.suspendidoHasta) > new Date()) {
    const fechaFin = new Date(usuario.suspendidoHasta).toLocaleString('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    return `Tu cuenta se encuentra suspendida hasta el ${fechaFin} por comportamiento tóxico.`;
  }
  if (usuario.suspendido) {
    return 'Tu cuenta fue suspendida indefinidamente.';
  }
  return null;
};

const usuarioPublico = (u) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  foto_perfil: u.foto_perfil,
  rango_edad: u.rango_edad,
  usa_microfono: u.usa_microfono,
  modo_juego: u.modo_juego,
  estado: u.estado,
  es_premium: Boolean(u.es_premium),
  verificado: Boolean(u.verificado),
  edad_estimada: u.edad_estimada || null,
  rol: u.rol,
  biografia: u.biografia,
});

const registro = async (req, res) => {
  try {
    const { username, email, password, rango_edad } = req.body;
    if (!username || !email || !password || !rango_edad) {
      return res.status(400).json({ error: 'username, email, password y rango_edad son obligatorios' });
    }
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });

    if (await Usuario.findOne({ where: { email } })) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    if (await Usuario.findOne({ where: { username } })) return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const usuario = await Usuario.create({ username, email, password_hash, rango_edad });
    const token = generarToken({ id: usuario.id, rol: usuario.rol });

    return res.status(201).json({ usuario: usuarioPublico(usuario), token });
  } catch (err) {
    console.error('Error en registro:', err);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email y password son obligatorios' });

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario || !usuario.password_hash) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (!(await bcrypt.compare(password, usuario.password_hash))) return res.status(401).json({ error: 'Credenciales inválidas' });

    const mensajeSuspension = verificarSuspension(usuario);
    if (mensajeSuspension) return res.status(403).json({ error: mensajeSuspension });

    const token = generarToken({ id: usuario.id, rol: usuario.rol });
    return res.json({ usuario: usuarioPublico(usuario), token });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { id_token, rango_edad } = req.body;

    if (!id_token) {
      return res.status(400).json({ error: 'Se requiere id_token' });
    }

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;

    let usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      if (!rango_edad) {
        return res.status(400).json({ error: 'rango_edad' });
      }

      usuario = await Usuario.create({
        username: name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000),
        email,
        foto_perfil: picture,
        rango_edad,
        google_id: sub,
      });
    }

    const mensajeSuspension = verificarSuspension(usuario);
    if (mensajeSuspension) {
      return res.status(403).json({ error: mensajeSuspension });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol || 'usuario' },
      process.env.JWT_SECRET || 'secreto',
      { expiresIn: '7d' }
    );

    return res.json({ token, usuario: usuarioPublico(usuario) });
  } catch (error) {
    console.error('Error en googleAuth:', error);
    return res.status(401).json({ error: 'Token de Google inválido o fallo en autenticación.' });
  }
};

const actualizarPerfil = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { username, foto_perfil, rango_edad, biografia } = req.body;

    const usuarioActual = await Usuario.findByPk(usuarioId);
    if (!usuarioActual) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (usuarioActual.rango_edad !== 'menor_18' && rango_edad === 'menor_18') {
      return res.status(400).json({ error: 'No se permite cambiar el rango de edad a menor de 18 años.' });
    }

    if (username && username !== usuarioActual.username) {
      const existeUsername = await Usuario.findOne({ where: { username } });
      if (existeUsername) return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
    }

    const cambios = {};
    if (username !== undefined) cambios.username = username;
    if (foto_perfil !== undefined) cambios.foto_perfil = foto_perfil;
    if (rango_edad !== undefined) cambios.rango_edad = rango_edad;
    if (biografia !== undefined) cambios.biografia = biografia;

    await usuarioActual.update(cambios);

    return res.json({ usuario: usuarioPublico(usuarioActual) });
  } catch (error) {
    console.error('Error en actualizarPerfil:', error);
    return res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
};

const me = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      include: ['steam', 'riot']
    });

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    const mensajeSuspension = verificarSuspension(usuario);
    if (mensajeSuspension) return res.status(403).json({ error: mensajeSuspension });

    return res.json({ 
      usuario: {
        ...usuarioPublico(usuario),
        steam: usuario.steam || null,
        riot: usuario.riot || null
      } 
    });
  } catch (err) {
    console.error('Error en me:', err);
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

module.exports = {
  registro,
  login,
  googleAuth,
  me,
  actualizarPerfil,
};