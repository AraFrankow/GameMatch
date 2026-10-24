function calcularSinergiaDuo(usuarioA, usuarioB) {
  let puntajeRiot = null;
  let puntajeSteam = null;

  if (usuarioA?.riot && usuarioB?.riot) {
    const rangoA = (usuarioA.riot.rango_lol || 'UNRANKED').toUpperCase();
    const rangoB = (usuarioB.riot.rango_lol || 'UNRANKED').toUpperCase();

    if (!rangoA.includes('UNRANKED') && !rangoB.includes('UNRANKED')) {
      let pRiot = 50;
      const ligaA = rangoA.split(' ')[0];
      const ligaB = rangoB.split(' ')[0];

      if (ligaA === ligaB) pRiot += 25;
      else pRiot += 10;

      const totalA = (usuarioA.riot.lol_wins || 0) + (usuarioA.riot.lol_losses || 0);
      const totalB = (usuarioB.riot.lol_wins || 0) + (usuarioB.riot.lol_losses || 0);

      if (totalA >= 5 && totalB >= 5) {
        const wrA = usuarioA.riot.lol_wins / totalA;
        const wrB = usuarioB.riot.lol_wins / totalB;
        if (Math.abs(wrA - wrB) <= 0.1) pRiot += 15;
      }
      puntajeRiot = Math.min(pRiot, 100);
    }
  }

  if (usuarioA?.steam && usuarioB?.steam) {
    const juegosA = parsearTopJuegos(usuarioA.steam.top_juegos);
    const juegosB = parsearTopJuegos(usuarioB.steam.top_juegos);

    let juegosCoincidentes = 0;
    let sumaAfinidadJuegos = 0;

    juegosA.forEach((j1) => {
      const nombreJ1 = j1.nombre?.toLowerCase().trim();
      const j2 = juegosB.find((j) => j.nombre?.toLowerCase().trim() === nombreJ1);

      if (j2) {
        juegosCoincidentes++;
        const h1 = Number(j1.horas) || 0;
        const h2 = Number(j2.horas) || 0;
        const minHoras = Math.min(h1, h2);
        const maxHoras = Math.max(h1, h2);

        let afinidad = 50;

        if (maxHoras > 0) {
          const ratio = minHoras / maxHoras;
          if (minHoras >= 100) {
            afinidad = 80 + Math.round(ratio * 20); 
          } else if (minHoras >= 20) {
            afinidad = 65 + Math.round(ratio * 25);
          } else {
            afinidad = 40 + Math.round(ratio * 30);
          }
        }
        sumaAfinidadJuegos += afinidad;
      }
    });

    if (juegosCoincidentes > 0) {
      puntajeSteam = Math.round(sumaAfinidadJuegos / juegosCoincidentes);
    }
  }

  const puntajesValidos = [];
  if (puntajeRiot !== null) puntajesValidos.push(puntajeRiot);
  if (puntajeSteam !== null) puntajesValidos.push(puntajeSteam);

  let puntajeBase = 50;
  if (puntajesValidos.length > 0) {
    const suma = puntajesValidos.reduce((acc, val) => acc + val, 0);
    puntajeBase = Math.round(suma / puntajesValidos.length);
  }

  if ((usuarioB?.reputacion_porcentaje || 0) >= 80) {
    puntajeBase = Math.min(puntajeBase + 5, 100);
  }

  return Math.min(Math.max(puntajeBase, 10), 99);
}

function parsearTopJuegos(topJuegos) {
  if (!topJuegos) return [];
  if (Array.isArray(topJuegos)) return topJuegos;
  if (typeof topJuegos === 'string') {
    try {
      return JSON.parse(topJuegos);
    } catch (e) {
      return [];
    }
  }
  return [];
}

module.exports = { calcularSinergiaDuo };