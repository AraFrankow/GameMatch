const { IntegracionRiot } = require('../models');

const CLUSTER_POR_REGION = {
  na1: 'americas', br1: 'americas', lan: 'americas', las: 'americas', oc1: 'americas',
  euw1: 'europe', eun1: 'europe', tr1: 'europe', ru: 'europe',
  kr: 'asia', jp1: 'asia',
};

const vincularRiot = async (req, res) => {
  try {
    const { game_name, tag_line, region } = req.body;
    const usuario_id = req.usuario.id;
    const apiKey = process.env.RIOT_API_KEY;

    if (!game_name || !tag_line || !region) {
      return res.status(400).json({ error: 'game_name, tag_line y region son obligatorios' });
    }
    if (!apiKey) return res.status(503).json({ error: 'La integracion con Riot no esta configurada (falta RIOT_API_KEY en el .env)' });

    const cluster = CLUSTER_POR_REGION[region];
    if (!cluster) return res.status(400).json({ error: `region invalida. Validas: ${Object.keys(CLUSTER_POR_REGION).join(', ')}` });

    const yaVinculado = await IntegracionRiot.findOne({ where: { usuario_id } });
    if (yaVinculado) return res.status(409).json({ error: 'Ya tenes una cuenta de Riot vinculada. Desvinculala primero si querés cambiarla.' });

    const resAccount = await fetch(
      `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(game_name)}/${encodeURIComponent(tag_line)}`,
      { headers: { 'X-Riot-Token': apiKey } }
    );
    if (resAccount.status === 404) return res.status(404).json({ error: 'No se encontro esa cuenta de Riot (revisa el nombre y el tag)' });
    if (!resAccount.ok) return res.status(502).json({ error: 'Riot no respondio correctamente. Puede que la API key haya expirado (las de desarrollo duran 24hs).' });
    const account = await resAccount.json();
    const { puuid } = account;

    let rango_lol = null;
    try {
      const resSummoner = await fetch(`https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`, { headers: { 'X-Riot-Token': apiKey } });
      if (resSummoner.ok) {
        const summoner = await resSummoner.json();
        const resLeague = await fetch(`https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`, { headers: { 'X-Riot-Token': apiKey } });
        if (resLeague.ok) {
          const entries = await resLeague.json();
          const soloQ = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5');
          if (soloQ) rango_lol = `${soloQ.tier} ${soloQ.rank}`;
        }
      }
    } catch (err) {
      console.error('No se pudo obtener el rango de LoL:', err.message);
    }

    const rango_valorant = null;

    const integracion = await IntegracionRiot.create({
      usuario_id,
      riot_puuid: puuid,
      riot_username: `${game_name}#${tag_line}`,
      region,
      rango_lol,
      rango_valorant,
    });

    return res.status(201).json({
      integracion,
      nota: rango_lol ? undefined : 'No se encontro rango de LoL para esta cuenta. El rango de Valorant no se importa (ver documentacion, RSO fuera de alcance).',
    });
  } catch (err) {
    console.error('Error en vincularRiot:', err);
    return res.status(500).json({ error: 'Error al vincular la cuenta de Riot' });
  }
};

const desvincularRiot = async (req, res) => {
  try {
    const eliminado = await IntegracionRiot.destroy({ where: { usuario_id: req.usuario.id } });
    if (!eliminado) return res.status(404).json({ error: 'No tenes una cuenta de Riot vinculada' });
    return res.json({ ok: true, mensaje: 'Cuenta de Riot desvinculada' });
  } catch (err) {
    console.error('Error en desvincular Riot:', err);
    return res.status(500).json({ error: 'Error al desvincular la cuenta de Riot' });
  }
};

module.exports = { vincularRiot, desvincularRiot };
