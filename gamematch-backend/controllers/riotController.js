const { IntegracionRiot } = require('../models');
const axios = require('axios');
const { calcularSinergiaDuo } = require('../utils/sinergia');
const { obtenerStatsYPartidas } = require('../utils/riotService');

const CLUSTER_POR_REGION = {
  la1: 'americas', lan: 'americas',
  la2: 'americas', las: 'americas',
  na1: 'americas', na: 'americas',
  br1: 'americas', br: 'americas',
  oc1: 'americas',
  euw1: 'europe', euw: 'europe',
  eun1: 'europe', eune: 'europe',
  tr1: 'europe', tr: 'europe',
  ru: 'europe',
  kr: 'asia',
  jp1: 'asia', jp: 'asia',
};

const PLATAFORMA_POR_REGION = {
  las: 'la2', la2: 'la2',
  lan: 'la1', la1: 'la1',
  na: 'na1', na1: 'na1',
  br: 'br1', br1: 'br1',
  euw: 'euw1', euw1: 'euw1',
  eune: 'eun1', eun1: 'eun1',
  tr: 'tr1', tr1: 'tr1',
  ru: 'ru',
  kr: 'kr',
  jp: 'jp1', jp1: 'jp1',
  oc1: 'oc1',
};

const MAPEO_ROLES = {
  TOP: 'TOP',
  JUNGLE: 'JUNGLE',
  MIDDLE: 'MID',
  BOTTOM: 'ADC',
  UTILITY: 'SUPPORT',
};

async function obtenerTopCampeones(puuid, plataforma, apiKey) {
  try {
    const url = `https://${plataforma}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=3`;
    const response = await axios.get(url, { headers: { 'X-Riot-Token': apiKey } });

    return response.data.map((c) => ({
      championId: c.championId,
      championLevel: c.championLevel,
      championPoints: c.championPoints,
    }));
  } catch (error) {
    console.error('Error al obtener maestrías de Riot:', error.message);
    return [];
  }
}

const obtenerRolMasJugado = async (puuid, cluster, apiKey) => {
  try {
    const urlMatchIds = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10`;
    const resIds = await fetch(urlMatchIds, { headers: { 'X-Riot-Token': apiKey } });
    if (!resIds.ok) return null;

    const matchIds = await resIds.json();
    if (!matchIds || matchIds.length === 0) return null;

    const conteoRoles = {};

    for (const matchId of matchIds.slice(0, 5)) {
      const urlMatch = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
      const resMatch = await fetch(urlMatch, { headers: { 'X-Riot-Token': apiKey } });
      if (!resMatch.ok) continue;

      const matchData = await resMatch.json();
      const jugador = matchData.info?.participants?.find((p) => p.puuid === puuid);

      if (jugador && jugador.individualPosition) {
        const pos = MAPEO_ROLES[jugador.individualPosition.toUpperCase()] || jugador.individualPosition;
        if (pos && pos !== 'Invalid') {
          conteoRoles[pos] = (conteoRoles[pos] || 0) + 1;
        }
      }
    }

    let rolDominante = null;
    let maxConteo = 0;
    for (const [rol, conteo] of Object.entries(conteoRoles)) {
      if (conteo > maxConteo) {
        maxConteo = conteo;
        rolDominante = rol;
      }
    }

    return rolDominante;
  } catch (err) {
    console.error('[Riot Debug] Error calculando rol desde historial:', err.message);
    return null;
  }
};

const vincularRiot = async (req, res) => {
  try {
    const { game_name, tag_line, region, posicion_principal } = req.body;
    const usuario_id = req.usuario?.id || req.user?.id;
    const apiKey = process.env.RIOT_API_KEY;

    if (!usuario_id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!game_name || !tag_line || !region) {
      return res.status(400).json({ error: 'game_name, tag_line y region son obligatorios' });
    }

    const regionClean = region.trim().toLowerCase();
    const cluster = CLUSTER_POR_REGION[regionClean] || 'americas';
    const plataforma = PLATAFORMA_POR_REGION[regionClean] || 'la2';

    const datosRiotAPI = await obtenerStatsYPartidas(game_name, tag_line, regionClean);
    const puuid = datosRiotAPI.puuid;

    let nivel_invocador = null;
    let rango_lol = 'UNRANKED';
    let lol_tier = 'UNRANKED';
    let lol_rank = null;
    let lol_lp = 0;
    let lol_wins = 0;
    let lol_losses = 0;
    let top_champions = [];

    const urlSummoner = `https://${plataforma}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const resSummoner = await fetch(urlSummoner, { headers: { 'X-Riot-Token': apiKey } });

    if (resSummoner.ok) {
      const summoner = await resSummoner.json();
      nivel_invocador = summoner.summonerLevel;

      const urlLeague = `https://${plataforma}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
      const resLeague = await fetch(urlLeague, { headers: { 'X-Riot-Token': apiKey } });

      if (resLeague.ok) {
        const entries = await resLeague.json();
        const soloQ = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5');
        if (soloQ) {
          lol_tier = soloQ.tier;
          lol_rank = soloQ.rank;
          lol_lp = soloQ.leaguePoints;
          lol_wins = soloQ.wins;
          lol_losses = soloQ.losses;
          rango_lol = `${lol_tier} ${lol_rank}`;
        }
      }

      top_champions = await obtenerTopCampeones(puuid, plataforma, apiKey);
    }

    let rolFinal = posicion_principal || null;
    if (!rolFinal) {
      rolFinal = await obtenerRolMasJugado(puuid, cluster, apiKey);
    }

    const [registro] = await IntegracionRiot.upsert({
      usuario_id,
      riot_puuid: puuid,
      riot_username: `${game_name}#${tag_line}`,
      region: regionClean,
      nivel_invocador,
      rango_lol,
      lol_tier,
      lol_rank,
      lol_lp,
      lol_wins,
      lol_losses,
      lol_posicion_principal: rolFinal,
      top_champions: top_champions,
      kda_promedio: datosRiotAPI.kdaPromedio,
      stats_campeones: JSON.stringify(datosRiotAPI.statsCampeones),
      ultimas_partidas: JSON.stringify(datosRiotAPI.ultimasPartidas),
      ultima_sincronizacion: new Date(),
    });

    return res.status(200).json({
      exito: true,
      integracion: registro,
      rolDetectado: Boolean(rolFinal),
      mensaje: 'Cuenta de Riot vinculada correctamente.',
    });
  } catch (err) {
    console.error('Error en vincularRiot:', err);
    return res.status(500).json({ error: err.message || 'Error al vincular cuenta de Riot' });
  }
};

const desvincularRiot = async (req, res) => {
  try {
    const eliminado = await IntegracionRiot.destroy({ where: { usuario_id: req.usuario.id } });
    if (!eliminado) return res.status(404).json({ error: 'No tenés una cuenta de Riot vinculada' });
    return res.json({ ok: true, mensaje: 'Cuenta de Riot desvinculada' });
  } catch (err) {
    console.error('Error en desvincular Riot:', err);
    return res.status(500).json({ error: 'Error al desvincular la cuenta de Riot' });
  }
};

const actualizarRolRiot = async (req, res) => {
  try {
    const { posicion_principal } = req.body;
    const usuario_id = req.usuario.id;

    const riot = await IntegracionRiot.findOne({ where: { usuario_id } });
    if (!riot) return res.status(404).json({ error: 'No tenés cuenta de Riot vinculada' });

    riot.lol_posicion_principal = posicion_principal;
    await riot.save();

    return res.json({ exito: true, posicion: posicion_principal });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar rol' });
  }
};

module.exports = {
  vincularRiot,
  desvincularRiot,
  obtenerTopCampeones,
  calcularSinergiaDuo,
  actualizarRolRiot,
};