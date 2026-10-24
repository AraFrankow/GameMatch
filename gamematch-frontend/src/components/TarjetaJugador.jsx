import React from 'react';

const CONFIG_ROLES = {
  TOP: { label: 'TOP', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icono: '🛡️' },
  JUNGLE: { label: 'JUNGLA', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icono: '🌿' },
  MID: { label: 'MID', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icono: '⚡' },
  ADC: { label: 'ADC', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icono: '🎯' },
  SUPPORT: { label: 'SUPPORT', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icono: '💚' },
};

export default function TarjetaJugador({ jugador, onVerPerfil, onBloquear, onReportar }) {
  const esPremium = Boolean(jugador.es_premium);
  const rolInfo = jugador.riot?.lol_posicion_principal
    ? CONFIG_ROLES[jugador.riot.lol_posicion_principal.toUpperCase()]
    : null;

  return (
    <div
      className={`group relative bg-card/80 backdrop-blur-xl border rounded-2xl p-4 flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1.5 shadow-lg ${
        esPremium
          ? 'border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.2)]'
          : 'border-white/10 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(147,51,234,0.15)]'
      }`}
    >
      {/* INSIGNIA SUPERIOR DE PREMIUM / DESTACADO */}
      {esPremium && (
        <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full shadow-md tracking-wider flex items-center gap-1">
          <span>⭐</span> Premium
        </div>
      )}

      <div className="space-y-3">
        {/* CABECERA: AVATAR, NOMBRE Y SINERGIA */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* AVATAR CON GLOW */}
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

            {/* NOMBRE Y RANGO EDAD */}
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate group-hover:text-primary-light transition-colors">
                {jugador.username}
              </h4>
              <p className="text-[11px] text-white/50 truncate">
                {jugador.rango_edad ? `Edad: ${jugador.rango_edad}` : 'Jugador GameMatch'}
              </p>
            </div>
          </div>

          {/* BADGE DE SINERGIA ESTILIZADO */}
          {jugador.sinergia_porcentaje !== undefined && (
            <div
              className="bg-primary/20 border border-primary/40 text-primary font-extrabold text-[11px] px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 shadow-inner"
              title="Afinidad de compatibilidad"
            >
              <span className="animate-pulse">⚡</span>
              <span>{jugador.sinergia_porcentaje}%</span>
            </div>
          )}
        </div>

        {/* DATOS DE RIOT / LOL (RANGOS Y ROLES) */}
        {jugador.riot ? (
          <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-amber-400 truncate">
                  {jugador.riot.rango_lol || 'UNRANKED'}
                </span>
                {jugador.riot.lol_lp > 0 && (
                  <span className="text-[10px] text-white/40 font-mono">
                    ({jugador.riot.lol_lp} LP)
                  </span>
                )}
              </div>

              {/* ROL PRINCIPAL */}
              {rolInfo && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${rolInfo.color}`}
                >
                  <span>{rolInfo.icono}</span>
                  <span>{rolInfo.label}</span>
                </span>
              )}
            </div>

            {/* WINRATE Y PARTIDAS */}
            {jugador.lol_winrate > 0 && (
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/5 text-white/60">
                <span>Rendimiento SoloQ</span>
                <span className="text-emerald-400 font-bold">
                  {jugador.lol_winrate}% WR
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-black/20 border border-white/5 rounded-xl p-2.5 text-[11px] text-white/40 text-center">
            Sin cuenta de Riot vinculada
          </div>
        )}
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