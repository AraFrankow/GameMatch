const { Usuario, UsuarioPlataforma, UsuarioJuego, Juego, IntegracionSteam, IntegracionRiot } = require('../models');
const { existeBloqueoEntre } = require('./bloqueoController');
const { calcularReputacionBulk } = require('../utils/reputacion');

const PLATAFORMAS_VALIDAS = ['pc', 'consola', 'mobile'];
const MODOS_JUEGO_VALIDOS = ['competitivo', 'casual', 'ambos'];
const ESTADOS_VALIDOS = ['disponible', 'ocupado', 'en_partida'];
const RANGOS_EDAD_VALIDOS = ['menor_18', '18_25', '26_35', '36_mas'];

const construirPerfilCompleto = async (usuarioId) => {
  // Incluimos plataformas y juegos
  const includes = [
    { model: UsuarioPlataforma, as: 'plataformas', attributes: ['plataforma'] },
    {
      model: UsuarioJuego,
      as: 'usuarioJuegos',
      attributes: ['horas_steam', 'rol_preferido'],
      include: [{ model: Juego, as: 'juego', attributes: ['id', 'nombre', 'imagen_url', 'genero'] }],
    },
  ];

  // Integracion Steam y Riot
  if (IntegracionSteam) includes.push({ model: IntegracionSteam, as: 'steam' });
  if (IntegracionRiot) includes.push({ model: IntegracionRiot, as: 'riot' });

  const usuario = await Usuario.findByPk(usuarioId, {
    attributes: { exclude: ['password_hash'] },
    include: includes,
  });

  if (!usuario) return null;

  const plano = usuario.toJSON();
  const reputaciones = await calcularReputacionBulk([usuario.id]);
  const rep = reputaciones.get(usuario.id) || { positivos: 0, negativos: 0, porcentaje: null };

  return {
    ...plano,
    reputacion: rep,
    steam: plano.steam || null,
    riot: plano.riot || null,
    plataformas: (plano.plataformas || []).map((p) => p.plataforma),
    juegos: (plano.usuarioJuegos || [])
      .filter((uj) => uj && uj.juego)
      .map((uj) => ({
        id: uj.juego.id,
        nombre: uj.juego.nombre,
        imagen_url: uj.juego.imagen_url,
        genero: uj.juego.genero,
        horas_steam: uj.horas_steam,
        rol_preferido: uj.rol_preferido,
      })),
    usuarioJuegos: undefined,
  };
};

const obtenerMiPerfil = async (req, res) => {
  try {
    return res.json({ perfil: await construirPerfilCompleto(req.usuario.id) });
  } catch (err) {
    console.error('Error en obtenerMiPerfil:', err);
    return res.status(500).json({ error: 'Error al obtener el perfil' });
  }
};

const obtenerPerfilPorId = async (req, res) => {
  try {
    if (await existeBloqueoEntre(req.usuario.id, req.params.id)) {
      return res.status(403).json({ error: 'No podes ver este perfil' });
    }
    const perfil = await construirPerfilCompleto(req.params.id);
    if (!perfil) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ perfil });
  } catch (err) {
    console.error('Error en obtenerPerfilPorId:', err);
    return res.status(500).json({ error: 'Error al obtener el perfil' });
  }
};

const actualizarPerfil = async (req, res) => {
  try {
    const { username, foto_perfil, usa_microfono, modo_juego, estado, rango_edad } = req.body;
    const usuario = req.usuario;
    if (username !== undefined) {
      if (username.trim().length < 3) {
        return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' });
      }
      const enUso = await Usuario.findOne({ where: { username } });
      if (enUso && enUso.id !== usuario.id) {
        return res.status(409).json({ error: 'Ese nombre de usuario ya esta en uso' });
      }
      usuario.username = username;
    }
    if (foto_perfil !== undefined) usuario.foto_perfil = foto_perfil;
    if (usa_microfono !== undefined) usuario.usa_microfono = !!usa_microfono;
    if (modo_juego !== undefined) {
      if (!MODOS_JUEGO_VALIDOS.includes(modo_juego)) {
        return res.status(400).json({ error: `modo_juego debe ser: ${MODOS_JUEGO_VALIDOS.join(', ')}` });
      }
      usuario.modo_juego = modo_juego;
    }
    if (estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({ error: `estado debe ser: ${ESTADOS_VALIDOS.join(', ')}` });
      }
      usuario.estado = estado;
    }
    if (rango_edad !== undefined) {
      if (!RANGOS_EDAD_VALIDOS.includes(rango_edad)) {
        return res.status(400).json({ error: `rango_edad debe ser: ${RANGOS_EDAD_VALIDOS.join(', ')}` });
      }
      usuario.rango_edad = rango_edad;
    }
    await usuario.save();
    return res.json({ perfil: await construirPerfilCompleto(usuario.id) });
  } catch (err) {
    console.error('Error en actualizarPerfil:', err);
    return res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
};

const actualizarPlataformas = async (req, res) => {
  try {
    const { plataformas } = req.body;
    if (!Array.isArray(plataformas) || plataformas.length === 0) {
      return res.status(400).json({ error: 'plataformas debe ser un array con al menos un valor' });
    }
    const invalidas = plataformas.filter((p) => !PLATAFORMAS_VALIDAS.includes(p));
    if (invalidas.length > 0) {
      return res.status(400).json({ error: `Plataformas invalidas: ${invalidas.join(', ')}` });
    }
    await UsuarioPlataforma.destroy({ where: { usuario_id: req.usuario.id } });
    await UsuarioPlataforma.bulkCreate(plataformas.map((p) => ({ usuario_id: req.usuario.id, plataforma: p })));
    return res.json({ perfil: await construirPerfilCompleto(req.usuario.id) });
  } catch (err) {
    console.error('Error en actualizarPlataformas:', err);
    return res.status(500).json({ error: 'Error al actualizar plataformas' });
  }
};

const actualizarJuegos = async (req, res) => {
  try {
    const { juegos } = req.body;
    if (!Array.isArray(juegos) || juegos.length === 0) {
      return res.status(400).json({ error: 'juegos debe ser un array con al menos un valor' });
    }
    for (const j of juegos) {
      if (!j.juego_id) return res.status(400).json({ error: 'Cada juego debe tener juego_id' });
    }
    const idsJuegos = juegos.map((j) => j.juego_id);
    const existentes = await Juego.findAll({ where: { id: idsJuegos } });
    if (existentes.length !== idsJuegos.length) {
      return res.status(400).json({ error: 'Alguno de los juego_id no existe' });
    }
    const previos = await UsuarioJuego.findAll({ where: { usuario_id: req.usuario.id } });
    const horasPorJuego = Object.fromEntries(previos.map((p) => [p.juego_id, p.horas_steam]));
    await UsuarioJuego.destroy({ where: { usuario_id: req.usuario.id } });
    await UsuarioJuego.bulkCreate(
      juegos.map((j) => ({
        usuario_id: req.usuario.id,
        juego_id: j.juego_id,
        rol_preferido: j.rol_preferido || null,
        horas_steam: horasPorJuego[j.juego_id] ?? null,
      }))
    );
    return res.json({ perfil: await construirPerfilCompleto(req.usuario.id) });
  } catch (err) {
    console.error('Error en actualizarJuegos:', err);
    return res.status(500).json({ error: 'Error al actualizar juegos' });
  }
};

module.exports = {
  obtenerMiPerfil,
  obtenerPerfilPorId,
  actualizarPerfil,
  actualizarPlataformas,
  actualizarJuegos,
};