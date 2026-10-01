const { IntegracionSteam, UsuarioJuego, Juego } = require('../models');

const STEAM_API_BASE = 'https://api.steampowered.com';

const importarJuegosDeSteam = async (usuario_id, juegosSteam) => {
  let importados = 0;

  for (const juegoSteam of juegosSteam) {
    const nombreJuego = juegoSteam.name ? juegoSteam.name.trim() : null;
    if (!nombreJuego) continue;

    // URL de la imagen del juego en Steam
    const imagenUrl = juegoSteam.appid && juegoSteam.img_icon_url
      ? `https://media.steampowered.net/steamcommunity/public/images/apps/${juegoSteam.appid}/${juegoSteam.img_icon_url}.jpg`
      : null;

    // Buscar o crear el juego en la base de datos
    const [juegoDb] = await Juego.findOrCreate({
      where: { nombre: nombreJuego },
      defaults: {
        nombre: nombreJuego,
        imagen_url: imagenUrl,
        genero: 'Steam',
      },
    });

    // Vincular el juego al usuario con las horas jugadas
    const horas = Math.round((juegoSteam.playtime_forever || 0) / 60);

    const [registro] = await UsuarioJuego.findOrCreate({
      where: { usuario_id, juego_id: juegoDb.id },
      defaults: { horas_steam: horas },
    });

    registro.horas_steam = horas;
    await registro.save();

    importados++;
  }

  return { importados, salteados: 0, total_steam: juegosSteam.length };
};

const vincularSteam = async (req, res) => {
  try {
    const { steam_id } = req.body;
    const usuario_id = req.usuario.id;
    const apiKey = process.env.STEAM_API_KEY;

    if (!steam_id) return res.status(400).json({ error: 'steam_id es obligatorio' });
    if (!apiKey) return res.status(503).json({ error: 'Falta STEAM_API_KEY en el .env' });

    const yaVinculado = await IntegracionSteam.findOne({ where: { usuario_id } });
    if (yaVinculado) return res.status(409).json({ error: 'Ya tenes una cuenta de Steam vinculada. Desvinculala primero.' });

    // Verificar que el SteamID existe y es público
    const resPerfil = await fetch(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steam_id}`);
    const dataPerfil = await resPerfil.json();
    const perfil = dataPerfil?.response?.players?.[0];

    if (!perfil) return res.status(404).json({ error: 'No se encontro ese SteamID' });
    if (perfil.communityvisibilitystate !== 3) {
      return res.status(422).json({ error: 'Ese perfil de Steam es privado. Tiene que ser publico.' });
    }

    // Traer juegos + horas
    const urlJuegos = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steam_id}&include_appinfo=true&include_played_free_games=true&format=json`;
    const resJuegos = await fetch(urlJuegos);
    const dataJuegos = await resJuegos.json();
    const juegosSteam = dataJuegos?.response?.games || [];

    console.log(`🎮 API Steam devolvió ${juegosSteam.length} juegos para el SteamID ${steam_id}`);

    // Guardar la vinculación
    const integracion = await IntegracionSteam.create({
      usuario_id,
      steam_id,
      steam_url: perfil.profileurl || null,
    });

    // Importar/Crear todos los juegos en la BD
    const resumenImportacion = await importarJuegosDeSteam(usuario_id, juegosSteam);
    console.log('✅ Resumen de importación:', resumenImportacion);

    return res.status(201).json({ integracion, importacion: resumenImportacion });
  } catch (err) {
    console.error('Error en vincularSteam:', err);
    return res.status(500).json({ error: 'Error al vincular la cuenta de Steam' });
  }
};

const desvincularSteam = async (req, res) => {
  try {
    const eliminado = await IntegracionSteam.destroy({ where: { usuario_id: req.usuario.id } });
    if (!eliminado) return res.status(404).json({ error: 'No tenes una cuenta de Steam vinculada' });
    return res.json({ ok: true, mensaje: 'Cuenta de Steam desvinculada' });
  } catch (err) {
    console.error('Error en desvincularSteam:', err);
    return res.status(500).json({ error: 'Error al desvincular la cuenta de Steam' });
  }
};

module.exports = { vincularSteam, desvincularSteam };