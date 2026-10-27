const axios = require('axios');

const MAPEO_ROLES = {
  TOP: 'TOP',
  JUNGLE: 'JUNGLE',
  MIDDLE: 'MID',
  MID: 'MID',
  BOTTOM: 'ADC',
  BOT: 'ADC',
  UTILITY: 'SUPPORT',
};

const QUEUE_ARAM = 450;
const QUEUES_ARENA = [1700, 1710, 1704];

const obtenerClusterRegional = (region) => {
  const reg = (region || 'las').toLowerCase();
  if (['las', 'lan', 'na1', 'br1', 'la1', 'la2'].includes(reg)) return 'americas';
  if (['euw1', 'eun1', 'tr1', 'ru', 'euw', 'eune'].includes(reg)) return 'europe';
  if (['kr', 'jp1', 'jp'].includes(reg)) return 'asia';
  return 'americas';
};

const deducirPosicion = (jugador, info = {}) => {
  const queueId = info.queueId;
  const gameModeStr = typeof info.gameMode === 'string' ? info.gameMode : '';
  const modoUpper = gameModeStr.toUpperCase();

  if (queueId === QUEUE_ARAM || modoUpper === 'ARAM') return 'ARAM';
  if (QUEUES_ARENA.includes(queueId) || modoUpper === 'CHERRY' || modoUpper === 'ARENA') return 'ARENA';

  let rawPos = (jugador.individualPosition || jugador.teamPosition || '').toUpperCase();
  if (rawPos && rawPos !== 'INVALID' && rawPos !== 'UNKNOWN') {
    return MAPEO_ROLES[rawPos] || rawPos;
  }

  const lane = (jugador.lane || '').toUpperCase();
  const role = (jugador.role || '').toUpperCase();

  if (lane === 'TOP') return 'TOP';
  if (lane === 'JUNGLE') return 'JUNGLE';
  if (lane === 'MIDDLE' || lane === 'MID') return 'MID';
  if (lane === 'BOTTOM' || lane === 'BOT') {
    if (role === 'DUO_SUPPORT') return 'SUPPORT';
    return 'ADC';
  }

  if (jugador.summoner1Id === 11 || jugador.summoner2Id === 11) {
    return 'JUNGLE';
  }

  return 'GRIETA';
};

const obtenerStatsYPartidas = async (gameName, tagLine, region) => {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) throw new Error('Falta la RIOT_API_KEY en las variables de entorno');

  const cluster = obtenerClusterRegional(region);
  const headers = { 'X-Riot-Token': apiKey };

  let puuid = '';
  let matchIds = [];

  try {
    const urlAccount = `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const accountRes = await axios.get(urlAccount, { headers });
    puuid = accountRes.data.puuid;

    const urlMatchIds = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10`;
    const matchIdsRes = await axios.get(urlMatchIds, { headers });
    matchIds = matchIdsRes.data || [];
  } catch (e) {
    if (e.response?.status === 401 || e.response?.status === 403) {
      throw new Error('La API Key de Riot ha expirado. Renovala en el Riot Developer Portal.');
    }
    if (e.response?.status === 404) {
      throw new Error('No se encontró ninguna cuenta de Riot con ese GameName#TagLine.');
    }
    throw e;
  }

  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let victorias = 0;

  const campeonesMap = {};
  const ultimasPartidas = [];

  for (const matchId of matchIds) {
    try {
      const urlMatchDetail = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
      const matchRes = await axios.get(urlMatchDetail, { headers });
      const info = matchRes.data.info;

      const jugador = info.participants.find((p) => p.puuid === puuid);
      if (!jugador) continue;

      const k = jugador.kills || 0;
      const d = jugador.deaths || 0;
      const a = jugador.assists || 0;
      const gano = Boolean(jugador.win);
      const champ = jugador.championName || 'Desconocido';

      totalKills += k;
      totalDeaths += d;
      totalAssists += a;
      if (gano) victorias++;

      if (!campeonesMap[champ]) {
        campeonesMap[champ] = { jugadas: 0, victorias: 0, kills: 0, deaths: 0, assists: 0 };
      }
      campeonesMap[champ].jugadas += 1;
      if (gano) campeonesMap[champ].victorias += 1;
      campeonesMap[champ].kills += k;
      campeonesMap[champ].deaths += d;
      campeonesMap[champ].assists += a;

      const posicionCalculada = deducirPosicion(jugador, info);

      ultimasPartidas.push({
        id: matchId,
        campeon: champ,
        posicion: posicionCalculada,
        kills: k,
        deaths: d,
        assists: a,
        kda: d === 0 ? (k + a).toFixed(1) : ((k + a) / d).toFixed(2),
        resultado: gano ? 'Victoria' : 'Derrota',
        duracion_min: Math.round(info.gameDuration / 60),
        modo: info.gameMode,
        fecha: new Date(info.gameStartTimestamp).toISOString(),
      });
    } catch (e) {
      console.error(`Error al procesar partida ${matchId}:`, e.message);
    }
  }

  const totalPartidas = ultimasPartidas.length || 1;
  const kdaPromedio = totalDeaths === 0 
    ? (totalKills + totalAssists) / totalPartidas 
    : (totalKills + totalAssists) / totalDeaths;

  const statsCampeones = Object.entries(campeonesMap).map(([campeon, datos]) => ({
    campeon,
    jugadas: datos.jugadas,
    winrate: Math.round((datos.victorias / datos.jugadas) * 100),
    kda: datos.deaths === 0 
      ? (datos.kills + datos.assists).toFixed(1) 
      : ((datos.kills + datos.assists) / datos.deaths).toFixed(2),
  }));

  return {
    puuid,
    kdaPromedio: Number(kdaPromedio.toFixed(2)),
    statsCampeones,
    ultimasPartidas,
  };
};

module.exports = { obtenerStatsYPartidas };