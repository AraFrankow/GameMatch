function normalizarJuegoSteam(juego) {
  if (!juego || typeof juego !== 'object') return null;

  const appid = juego.appid || juego.app_id || juego.id || null;
  const nombre = (juego.nombre || juego.name || juego.title || '').toString().trim().toLowerCase();

  let horas = 0;
  if (juego.horas !== undefined && juego.horas !== null) {
    horas = Number(juego.horas) || 0;
  } else if (juego.horas_steam !== undefined && juego.horas_steam !== null) {
    horas = Number(juego.horas_steam) || 0;
  } else if (juego.playtime_forever !== undefined && juego.playtime_forever !== null) {
    horas = Math.round(Number(juego.playtime_forever) / 60) || 0;
  }

  return { appid, nombre, horas };
}

function safeParseJson(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }
  return [];
}

function calcularSinergiaDuo(solicitante, objetivo) {
  let puntosRiot = null;
  let puntosSteam = null;

  // CÁLCULO DE SINERGIA RIOT
  if (solicitante?.riot && objetivo?.riot) {
    puntosRiot = 60;

    // Mismo servidor/región
    if (
      solicitante.riot.region &&
      objetivo.riot.region &&
      solicitante.riot.region.toLowerCase() === objetivo.riot.region.toLowerCase()
    ) {
      puntosRiot += 10;
    }

    // Compatibilidad de Roles/Posición
    const posA = (solicitante.riot.posicion_principal || solicitante.riot.lol_posicion_principal || '').toUpperCase();
    const posB = (objetivo.riot.posicion_principal || objetivo.riot.lol_posicion_principal || '').toUpperCase();

    if (posA && posB) {
      const sinergiasPerfectas = [
        ['ADC', 'SUP'], ['SUPPORT', 'ADC'], ['SUP', 'ADC'], ['ADC', 'SUPPORT'],
        ['MID', 'JUG'], ['JUNGLE', 'MID'], ['MID', 'JUNGLE'], ['JUG', 'MID'],
        ['TOP', 'JUG'], ['JUNGLE', 'TOP'], ['TOP', 'JUNGLE'], ['JUG', 'TOP']
      ];

      const esSinergiaDirecta = sinergiasPerfectas.some(
        ([r1, r2]) => posA === r1 && posB === r2
      );

      if (esSinergiaDirecta) {
        puntosRiot += 20;
      } else if (posA !== posB) {
        puntosRiot += 10;
      }
    }

    puntosRiot = Math.min(100, puntosRiot);
  }

  // CÁLCULO DE SINERGIA STEAM
  if (solicitante?.steam && objetivo?.steam) {
    puntosSteam = 50;

    const rawMisJuegos = safeParseJson(solicitante.steam.top_juegos || solicitante.steam.juegos);
    const rawSusJuegos = safeParseJson(objetivo.steam.top_juegos || objetivo.steam.juegos);

    const misJuegos = rawMisJuegos.map(normalizarJuegoSteam).filter(Boolean);
    const susJuegos = rawSusJuegos.map(normalizarJuegoSteam).filter(Boolean);

    let juegosCompartidos = 0;
    let horasCompartidas = 0;

    misJuegos.forEach((miJuego) => {
      const coincidencia = susJuegos.find((sj) => {
        if (miJuego.appid && sj.appid && String(miJuego.appid) === String(sj.appid)) {
          return true;
        }
        if (miJuego.nombre && sj.nombre && miJuego.nombre === sj.nombre) {
          return true;
        }
        return false;
      });

      if (coincidencia) {
        juegosCompartidos++;
        horasCompartidas += Math.min(miJuego.horas, coincidencia.horas);
      }
    });

    // Sumar puntaje por juegos en común
    puntosSteam += Math.min(30, juegosCompartidos * 10);

    // Sumar puntaje por horas en común
    if (horasCompartidas >= 50) puntosSteam += 20;
    else if (horasCompartidas >= 10) puntosSteam += 10;
    else if (horasCompartidas > 0) puntosSteam += 5;

    puntosSteam = Math.min(100, puntosSteam);
  }

  let sinergiaGlobal = 50;

  if (puntosRiot !== null && puntosSteam !== null) {
    sinergiaGlobal = Math.round(puntosRiot * 0.5 + puntosSteam * 0.5);
  } else if (puntosRiot !== null) {
    sinergiaGlobal = puntosRiot;
  } else if (puntosSteam !== null) {
    sinergiaGlobal = puntosSteam;
  } else {
    const rep = objetivo?.reputacion_porcentaje || 50;
    sinergiaGlobal = Math.round((50 + rep) / 2);
  }

  return {
    global: sinergiaGlobal,
    riot: puntosRiot,
    steam: puntosSteam
  };
}

module.exports = { calcularSinergiaDuo, normalizarJuegoSteam };