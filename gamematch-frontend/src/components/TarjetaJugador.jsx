import React from 'react';

const MODOS_LABEL = {
  casual: 'Casual',
  competitivo: 'Competitivo',
  ambos: 'Casual & Competitivo',
};

export default function TarjetaJugador({ jugador, onVerPerfil, onBloquear, onReportar }) {
  const esPremium = Boolean(
    jugador.es_premium === true ||
      jugador.es_premium === 1 ||
      jugador.es_premium === '1' ||
      jugador.es_premium === 'true'
  );

  return (
    <div className={`relative bg-card border rounded-2xl p-4 flex flex-col justify-between shadow-xl transition hover:border-primary/40 ${
      esPremium ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent' : 'border-white/10'
    }`}>
      {esPremium && (
        <span className="absolute -top-2.5 right-4 bg-amber-400 text-slate-950 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full tracking-wider shadow">
          ⭐ Premium
        </span>
      )}

      <div>
        {/* CABECERA CON AVATAR + SIMBOLITO DE ESTADO */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onVerPerfil(jugador.id)}>
            <div className="relative shrink-0">
              <div className={`w-12 h-12 rounded-full bg-surface overflow-hidden flex items-center justify-center font-bold text-white border-2 ${
                esPremium ? 'border-amber-400' : 'border-white/20'
              }`}>
                {jugador.foto_perfil ? (
                  <img src={jugador.foto_perfil} alt={jugador.username} className="w-full h-full object-cover" />
                ) : (
                  (jugador.username?.[0] || 'U').toUpperCase()
                )}
              </div>

              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-card ${
                  jugador.estado === 'conectado'
                    ? 'bg-green-500'
                    : jugador.estado === 'ausente'
                    ? 'bg-amber-500'
                    : 'bg-slate-500'
                }`}
                title={
                  jugador.estado === 'conectado'
                    ? 'Conectado'
                    : jugador.estado === 'ausente'
                    ? 'Ausente'
                    : 'Desconectado'
                }
              />
            </div>

            <div className="text-left">
              <h3 className="text-white font-bold text-sm truncate max-w-[130px]">{jugador.username}</h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-white/40 text-[11px]">
                  {jugador.rango_edad ? `Edad: ${jugador.rango_edad}` : 'Jugador GameMatch'}
                </p>
                {jugador.modo_juego && (
                  <span className="text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded text-[10px] font-medium">
                    {MODOS_LABEL[jugador.modo_juego] || jugador.modo_juego}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs px-2 py-1 rounded-lg inline-block">
              🤝 {jugador.sinergia_porcentaje ?? 50}% Sinergia
            </span>
          </div>
        </div>

        {/* CUENTAS VINCULADAS */}
        <div className="space-y-2 mb-4 text-left">
          {jugador.riot && (
            <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-amber-400 font-bold">⚔️ {jugador.riot.lol_tier || 'UNRANKED'}</span>
                {jugador.lol_winrate > 0 && (
                  <span className="text-emerald-400 font-semibold">{jugador.lol_winrate}% WR</span>
                )}
              </div>
            </div>
          )}

          {jugador.steam && (
            <div className="bg-[#66c0f4]/10 border border-[#66c0f4]/20 rounded-xl p-2.5 text-xs text-[#66c0f4] font-bold">
              🎮 {jugador.steam.steam_username || 'Cuenta Steam'}
            </div>
          )}

          {!jugador.riot && !jugador.steam && (
            <div className="bg-black/20 border border-white/5 rounded-xl p-2.5 text-xs text-white/40 text-center">
              Sin integraciones de juegos
            </div>
          )}
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex gap-2 pt-2 border-t border-white/5">
        <button
          onClick={() => onVerPerfil(jugador.id)}
          className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded-xl text-xs transition cursor-pointer"
        >
          Ver Perfil
        </button>

        <button
          onClick={onBloquear}
          className="bg-surface hover:bg-white/10 text-amber-400 p-2 rounded-xl border border-white/10 transition cursor-pointer"
          title="Bloquear jugador"
        >
          🚫
        </button>

        <button
          onClick={onReportar}
          className="bg-surface hover:bg-white/10 text-red-400 p-2 rounded-xl border border-white/10 transition cursor-pointer"
          title="Reportar jugador"
        >
          🚨
        </button>
      </div>
    </div>
  );
}