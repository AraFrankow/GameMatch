function calcularSinergiaDuo(usuarioA, usuarioB) {
  if (!usuarioA?.riot || !usuarioB?.riot) return 50;

  const rangoA = (usuarioA.riot.rango_lol || 'UNRANKED').toUpperCase();
  const rangoB = (usuarioB.riot.rango_lol || 'UNRANKED').toUpperCase();

  // Si alguno no está clasificado, mantenemos sinergia neutra
  if (rangoA.includes('UNRANKED') || rangoB.includes('UNRANKED')) {
    return 50;
  }

  let puntaje = 50;

  // Proximidad de Rangos
  const ligaA = rangoA.split(' ')[0];
  const ligaB = rangoB.split(' ')[0];
  if (ligaA === ligaB) {
    puntaje += 25;
  } else {
    puntaje += 10;
  }

  // Winrate similar
  const totalA = (usuarioA.riot.lol_wins || 0) + (usuarioA.riot.lol_losses || 0);
  const totalB = (usuarioB.riot.lol_wins || 0) + (usuarioB.riot.lol_losses || 0);

  if (totalA >= 5 && totalB >= 5) {
    const wrA = usuarioA.riot.lol_wins / totalA;
    const wrB = usuarioB.riot.lol_wins / totalB;
    if (Math.abs(wrA - wrB) <= 0.1) {
      puntaje += 15;
    }
  }

  // Reputación
  if ((usuarioB.reputacion_porcentaje || 0) >= 80) {
    puntaje += 10;
  }

  return Math.min(puntaje, 100);
}

module.exports = { calcularSinergiaDuo };