const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const axios = require('axios');
const { IntegracionSteam } = require('../models');

async function obtenerJuegosSteamAPI(steamId) {
  try {
    const apiKey = process.env.STEAM_API_KEY;
    if (!apiKey) return [];

    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json`;
    const response = await axios.get(url);
    const games = response.data?.response?.games || [];

    return games
      .sort((a, b) => b.playtime_forever - a.playtime_forever)
      .slice(0, 20)
      .map((g) => ({
        appid: g.appid,
        nombre: g.name,
        horas: Math.round((g.playtime_forever || 0) / 60),
        icono: g.img_icon_url
          ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
          : `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`
      }));
  } catch (error) {
    console.error('Error al obtener juegos de la API de Steam:', error.message);
    return [];
  }
}

passport.use(
  new SteamStrategy(
    {
      returnURL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/integraciones/steam/return`,
      realm: `${process.env.BACKEND_URL || 'http://localhost:3000'}/`,
      apiKey: process.env.STEAM_API_KEY,
      passReqToCallback: true
    },
    async (req, identifier, profile, done) => {
      try {
        const usuarioId = req.session?.usuario_id || req.query?.usuario_id;

        if (!usuarioId) {
          return done(new Error('No se identificó al usuario de GameMatch'));
        }

        const steamId = profile.id;
        const steamUsername = profile.displayName || profile.personaname || 'Usuario Steam';
        const avatarUrl = profile._json?.avatarfull || profile.photos?.[2]?.value || null;

        const topJuegos = await obtenerJuegosSteamAPI(steamId);

        const [integracion, creada] = await IntegracionSteam.findOrCreate({
          where: { usuario_id: usuarioId },
          defaults: {
            steam_id: steamId,
            steam_username: steamUsername,
            avatar_url: avatarUrl,
            top_juegos: JSON.stringify(topJuegos)
          }
        });

        if (!creada) {
          integracion.steam_id = steamId;
          integracion.steam_username = steamUsername;
          integracion.avatar_url = avatarUrl;
          integracion.top_juegos = JSON.stringify(topJuegos);
          await integracion.save();
        }

        delete req.session.usuario_id;
        return done(null, integracion);
      } catch (error) {
        console.error('Error en callback de Steam Passport:', error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));