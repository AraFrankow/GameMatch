import React from 'react';

const CONFIG_ROLES = {
  TOP: { label: 'TOP', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icono: '🛡️' },
  JUNGLE: { label: 'JUNGLA', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icono: '🌿' },
  MID: { label: 'MID', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icono: '⚡' },
  MIDDLE: { label: 'MID', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icono: '⚡' },
  ADC: { label: 'ADC', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icono: '🎯' },
  BOT: { label: 'ADC', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icono: '🎯' },
  BOTTOM: { label: 'ADC', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icono: '🎯' },
  SUPPORT: { label: 'SUPPORT', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icono: '💚' },
  UTILITY: { label: 'SUPPORT', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icono: '💚' },
  ARAM: { label: 'ARAM', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', icono: '❄️' },
  ARENA: { label: 'ARENA', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icono: '⚔️' },
};

function parsearTopJuegos(topJuegos) {
  if (!topJuegos) return [];
  if (Array.isArray(topJuegos)) return topJuegos;
  try {
    const parsed = JSON.parse(topJuegos);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export default function TarjetaJugador({ jugador, onVerPerfil, onBloquear, onReportar }) {
  if (!jugador) return null;

  const esPremium = Boolean(
    jugador.es_premium === true ||
      jugador.es_premium === 1 ||
      jugador.es_premium === '1' ||
      jugador.es_premium === 'true'
  );

  const datosRiot = jugador.riot || jugador.integracionRiot || jugador.IntegracionRiot || null;
  const datosSteam = jugador.steam || jugador.integracionSteam || jugador.IntegracionSteam || null;

  const tieneRiot = Boolean(datosRiot);
  const tieneSteam = Boolean(datosSteam);

  const rawPosicion = datosRiot?.lol_posicion_principal
    ? datosRiot.lol_posicion_principal.toUpperCase()
    : null;
  const rolInfo = rawPosicion ? CONFIG_ROLES[rawPosicion] : null;

  const wins = datosRiot?.lol_wins || 0;
  const losses = datosRiot?.lol_losses || 0;
  const totalPartidas = wins + losses;

  const winrate = jugador.lol_winrate !== undefined && jugador.lol_winrate !== null
    ? jugador.lol_winrate
    : totalPartidas > 0
    ? Math.round((wins / totalPartidas) * 100)
    : 0;

  const topJuegosSteam = tieneSteam ? parsearTopJuegos(datosSteam.top_juegos) : [];

  const cantidadJuegosSteam = datosSteam?.total_juegos > 0
    ? datosSteam.total_juegos
    : topJuegosSteam.length > 0
    ? topJuegosSteam.length
    : Array.isArray(jugador.juegos)
    ? jugador.juegos.length
    : 0;

  return (
    <div
      className={`group relative bg-card/80 backdrop-blur-xl border rounded-2xl p-4 flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1.5 shadow-lg ${
        esPremium
          ? 'border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.2)]'
          : 'border-white/10 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(147,51,234,0.15)]'
      }`}
    >
      {/* INSIGNIA SUPERIOR DE PREMIUM */}
      {esPremium && (
        <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full shadow-md tracking-wider flex items-center gap-1">
          <span>⭐</span> Premium
        </div>
      )}

      <div className="space-y-3">
        {/* CABECERA: AVATAR, NOMBRE Y SINERGIA */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 transition duration-300 ${
                esPremium
                  ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                  : 'border-white/20 group-hover:border-primary'
              }`}
            >
              {jugador.foto_perfil ? (
                <img
                  src={jugador.foto_perfil}
                  alt={jugador.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-surface flex items-center justify-center font-bold text-white text-lg">
                  {(jugador.username?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate group-hover:text-primary-light transition-colors">
                {jugador.username}
              </h4>
              <p className="text-[11px] text-white/50 truncate">
                {jugador.rango_edad ? `Edad: ${jugador.rango_edad}` : 'Jugador GameMatch'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs px-2 py-1 rounded-lg">
              🤝 {typeof jugador.sinergia === 'object' ? jugador.sinergia?.global : (jugador.sinergia_porcentaje ?? 50)}% Sinergia
            </span>

            <div className="flex items-center gap-1">
              {jugador.sinergia_riot !== null && jugador.sinergia_riot !== undefined && (
                <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono">
                  LoL: {jugador.sinergia_riot}%
                </span>
              )}

              {jugador.sinergia_steam !== null && jugador.sinergia_steam !== undefined && (
                <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                  Steam: {jugador.sinergia_steam}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CONTENEDOR DE CUENTAS VINCULADAS */}
        <div className="space-y-2">
          {/* 1. BLOQUE DE RIOT */}
          {tieneRiot && (
            <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] text-white/40">⚔️</span>
                  <span className="font-bold text-amber-400 truncate">
                    {datosRiot.rango_lol || 'UNRANKED'}
                  </span>
                  {datosRiot.lol_lp !== undefined && datosRiot.lol_lp > 0 && (
                    <span className="text-[10px] text-white/40 font-mono">
                      ({datosRiot.lol_lp} LP)
                    </span>
                  )}
                </div>

                {rolInfo ? (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${rolInfo.color}`}
                  >
                    <span>{rolInfo.icono}</span>
                    <span>{rolInfo.label}</span>
                  </span>
                ) : rawPosicion ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border bg-white/10 text-white/80 border-white/20">
                    {rawPosicion}
                  </span>
                ) : null}
              </div>

              {winrate > 0 && (
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/5 text-white/60">
                  <span>Rendimiento SoloQ</span>
                  <span className="text-emerald-400 font-bold">{winrate}% WR</span>
                </div>
              )}
            </div>
          )}

          {/* 2. BLOQUE DE STEAM */}
          {tieneSteam && (
            <div className="bg-[#66c0f4]/10 border border-[#66c0f4]/20 rounded-xl p-2.5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px]">🎮</span>
                  <span className="font-bold text-[#66c0f4] truncate">
                    {datosSteam.steam_username || 'Cuenta Steam'}
                  </span>
                </div>

                {datosSteam.jugando_ahora ? (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 truncate max-w-[120px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {datosSteam.jugando_ahora}
                  </span>
                ) : (
                  <span className="text-[10px] text-white/40 font-mono">
                    {cantidadJuegosSteam} {cantidadJuegosSteam === 1 ? 'juego' : 'juegos'}
                  </span>
                )}
              </div>

              {/* TOP JUEGOS O DESTACADOS DE STEAM */}
              {topJuegosSteam.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-white/5">
                  {topJuegosSteam.slice(0, 3).map((juego, idx) => {
                    const nombreJuego = typeof juego === 'string' ? juego : juego.name || juego.nombre;
                    return (
                      <span
                        key={idx}
                        className="text-[9px] bg-white/5 text-white/70 px-1.5 py-0.2 rounded border border-white/5 truncate max-w-[110px]"
                      >
                        {nombreJuego}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. CARTEL GENÉRICO SI NO TIENE NINGUNA DE LAS DOS CUENTAS */}
          {!tieneRiot && !tieneSteam && (
            <div className="bg-black/20 border border-white/5 rounded-xl p-2.5 text-[11px] text-white/40 text-center flex items-center justify-center gap-1.5">
              <span>🎮</span> Sin cuentas de juego vinculadas
            </div>
          )}
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <button
          onClick={() => onVerPerfil && onVerPerfil(jugador.id)}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium text-xs py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
        >
          Ver Perfil
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => onBloquear && onBloquear(jugador.id, jugador.username)}
            className="flex-1 bg-surface hover:bg-red-500/10 text-white/40 hover:text-red-400 border border-white/10 hover:border-red-500/20 text-[10px] py-1.5 rounded-lg transition"
            title="Bloquear jugador"
          >
            Bloquear
          </button>
          <button
            onClick={() => onReportar && onReportar(jugador.id)}
            className="flex-1 bg-surface hover:bg-amber-500/10 text-white/40 hover:text-amber-400 border border-white/10 hover:border-amber-500/20 text-[10px] py-1.5 rounded-lg transition"
            title="Reportar jugador"
          >
            Reportar
          </button>
        </div>
      </div>
    </div>
  );
}