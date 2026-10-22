const { IntegracionRiot } = require('../models');

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

const vincularRiot = async (req, res) => {
  try {
    const { game_name, tag_line, region } = req.body;
    const usuario_id = req.usuario.id;
    const apiKey = process.env.RIOT_API_KEY;

    if (!game_name || !tag_line || !region) {
      return res.status(400).json({ error: 'game_name, tag_line y region son obligatorios' });
    }
    if (!apiKey) {
      return res.status(503).json({ error: 'Falta RIOT_API_KEY en el .env' });
    }

    const regionClean = region.trim().toLowerCase();
    const cluster = CLUSTER_POR_REGION[regionClean];
    const plataforma = PLATAFORMA_POR_REGION[regionClean];

    if (!cluster || !plataforma) {
      return res.status(400).json({ error: `Región '${region}' inválida. Usá: las, lan, na, br, euw, kr, etc.` });
    }

    const yaVinculado = await IntegracionRiot.findOne({ where: { usuario_id } });
    if (yaVinculado) {
      return res.status(409).json({ error: 'Ya tenés una cuenta de Riot vinculada. Desvinculala primero.' });
    }

    const urlAccount = `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(game_name)}/${encodeURIComponent(tag_line)}`;
    console.log(`[Riot Debug] 1. Consultando Account API: ${urlAccount}`);
    
    const resAccount = await fetch(urlAccount, { headers: { 'X-Riot-Token': apiKey } });

    if (resAccount.status === 404) return res.status(404).json({ error: 'No se encontró esa cuenta de Riot (revisá el nombre y el tag)' });
    if (!resAccount.ok) return res.status(502).json({ error: `Riot Account API respondió con estado ${resAccount.status}` });

    const account = await resAccount.json();
    const { puuid } = account;
    console.log(`[Riot Debug] PUUID obtenido: ${puuid}`);

    let nivel_invocador = null;
    let icono_perfil_id = null;
    let rango_lol = 'UNRANKED';
    let lol_tier = 'UNRANKED';
    let lol_rank = null;
    let lol_lp = 0;
    let lol_wins = 0;
    let lol_losses = 0;

    try {
      const urlSummoner = `https://${plataforma}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
      console.log(`[Riot Debug] 2. Consultando Summoner API: ${urlSummoner}`);
      
      const resSummoner = await fetch(urlSummoner, { headers: { 'X-Riot-Token': apiKey } });

      if (resSummoner.ok) {
        const summoner = await resSummoner.json();
        nivel_invocador = summoner.summonerLevel;
        icono_perfil_id = summoner.profileIconId;

        console.log(`[Riot Debug] Summoner nivel ${nivel_invocador} cargado OK.`);

        const urlLeague = `https://${plataforma}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
        console.log(`[Riot Debug] 3. Consultando League API por PUUID: ${urlLeague}`);

        let resLeague = await fetch(urlLeague, { headers: { 'X-Riot-Token': apiKey } });

        if (!resLeague.ok && summoner.id) {
          const urlLeagueFallback = `https://${plataforma}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`;
          console.log(`[Riot Debug] Reintentando League API por Summoner ID: ${urlLeagueFallback}`);
          resLeague = await fetch(urlLeagueFallback, { headers: { 'X-Riot-Token': apiKey } });
        }

        if (resLeague.ok) {
          const entries = await resLeague.json();
          console.log(`[Riot Debug] Entradas de Liga obtenidas:`, JSON.stringify(entries));

          const soloQ = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5');

          if (soloQ) {
            lol_tier = soloQ.tier;
            lol_rank = soloQ.rank;
            lol_lp = soloQ.leaguePoints;
            lol_wins = soloQ.wins;
            lol_losses = soloQ.losses;
            rango_lol = `${lol_tier} ${lol_rank}`;
            console.log(`[Riot Debug] Rango SoloQ asignado: ${rango_lol} (${lol_lp} LP)`);
          } else {
            console.log('[Riot Debug] La cuenta no tiene registros en SoloQ para este split.');
          }
        } else {
          console.error(`[Riot Debug] League API falló con estado ${resLeague.status}`);
        }
      } else {
        console.error(`[Riot Debug] Summoner API falló con estado ${resSummoner.status}`);
      }
    } catch (err) {
      console.error('[Riot Debug] Error al consultar datos de LoL:', err.message);
    }

    const integracion = await IntegracionRiot.create({
      usuario_id,
      riot_puuid: puuid,
      riot_username: `${game_name}#${tag_line}`,
      region: regionClean,
      nivel_invocador,
      icono_perfil_id,
      rango_lol,
      lol_tier,
      lol_rank,
      lol_lp,
      lol_wins,
      lol_losses,
      rango_valorant: null,
      ultima_sincronizacion: new Date(),
    });

    return res.status(201).json({
      exito: true,
      integracion,
      mensaje: 'Cuenta de Riot vinculada y sincronizada con éxito.'
    });

  } catch (err) {
    console.error('Error grave en vincularRiot:', err);
    return res.status(500).json({ error: 'Error al vincular la cuenta de Riot' });
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

module.exports = { vincularRiot, desvincularRiot };