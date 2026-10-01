const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const { Usuario, AuthGoogle } = require('../models');
const { generarToken } = require('../utils/jwt');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const SALT_ROUNDS = 10;

const usuarioPublico = (u) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  foto_perfil: u.foto_perfil,
  rango_edad: u.rango_edad,
  usa_microfono: u.usa_microfono,
  modo_juego: u.modo_juego,
  estado: u.estado,
  es_premium: u.es_premium,
  rol: u.rol,
  biografia: u.biografia
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
    if (usuario.suspendido) return res.status(403).json({ error: 'Tu cuenta fue suspendida' });

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
    if (!id_token) return res.status(400).json({ error: 'id_token de Google es obligatorio' });

    const ticket = await googleClient.verifyIdToken({ idToken: id_token, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { sub: google_id, email, picture } = payload;

    let authGoogle = await AuthGoogle.findOne({ where: { google_id } });
    let usuario;

    if (authGoogle) {
      usuario = await Usuario.findByPk(authGoogle.usuario_id);
    } else {
      usuario = await Usuario.findOne({ where: { email } });
      if (!usuario) {
        if (!rango_edad) {
          return res.status(422).json({ requiereRangoEdad: true, error: 'Falta rango_edad para crear la cuenta', datosGoogle: { email, picture } });
        }
        const baseUsername = email.split('@')[0];
        const uniqueUsername = `${baseUsername}_${Date.now().toString().slice(-4)}`;
        usuario = await Usuario.create({ username: uniqueUsername, email, password_hash: null, foto_perfil: picture || null, rango_edad });
      }
      authGoogle = await AuthGoogle.create({ usuario_id: usuario.id, google_id, email_google: email });
    }

    // Suspensión de cuenta
    if (usuario.suspendido) return res.status(403).json({ error: 'Tu cuenta fue suspendida' });

    const token = generarToken({ id: usuario.id, rol: usuario.rol });
    return res.json({ usuario: usuarioPublico(usuario), token });
  } catch (err) {
    console.error('Error en googleAuth:', err);
    return res.status(401).json({ error: 'Token de Google inválido' });
  }
};

const actualizarPerfil = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { username, foto_perfil, rango_edad, biografia } = req.body;

    const usuarioActual = await Usuario.findByPk(usuarioId);
    if (!usuarioActual) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Regla de edad
    if (usuarioActual.rango_edad !== 'menor_18' && rango_edad === 'menor_18') {
      return res.status(400).json({ error: 'No se permite cambiar el rango de edad a menor de 18 años.' });
    }

    // Ver si el username esta siendo usado
    if (username && username !== usuarioActual.username) {
      const existeUsername = await Usuario.findOne({ where: { username } });
      if (existeUsername) return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
    }

    // Que no esten vacios lo valores
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
    // Carga el usuario junto a sus integraciones vinculadas
    const usuario = await Usuario.findByPk(req.usuario.id, {
      include: ['steam', 'riot']
    });

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

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