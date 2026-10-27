import React, { useState } from 'react';
import TopCampeones from './TopCampeones';
import { authApi } from '../api';

const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
const MODOS_ESPECIALES = ['ARAM', 'ARENA', 'CHERRY', 'ESPECIAL', 'GRIETA'];

function IconoRiot({ rango }) {
  const rangoUpper = (rango || '').toUpperCase();

  if (rangoUpper.includes('CHALLENGER')) {
    return (
      <div
        className="w-11 h-11 rounded-full border-2 border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)] flex items-center justify-center font-extrabold text-xs shrink-0"
        title={rango}
      >
        <span className="text-cyan-200 drop-shadow-[0_0_6px_rgba(34,211,238,0.9)]">👑 C</span>
      </div>
    );
  }
  if (rangoUpper.includes('GRANDMASTER')) {
    return (
      <div
        className="w-11 h-11 rounded-full border-2 border-red-500 bg-red-950/80 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center justify-center font-extrabold text-xs shrink-0"
        title={rango}
      >
        <span className="text-red-300 drop-shadow-[0_0_6px_rgba(239,68,68,0.9)]">GM</span>
      </div>
    );
  }
  if (rangoUpper.includes('MASTER')) {
    return (
      <div
        className="w-11 h-11 rounded-full border-2 border-purple-400 bg-purple-950/80 text-purple-300 shadow-[0_0_12px_rgba(192,132,252,0.4)] flex items-center justify-center font-extrabold text-xs shrink-0"
        title={rango}
      >
        <span className="text-purple-200">⚡ M</span>
      </div>
    );
  }
  if (rangoUpper.includes('DIAMOND')) {
    return (
      <div
        className="w-11 h-11 rounded-full border-2 border-blue-400 bg-blue-950/70 text-blue-300 shadow-[0_0_10px_rgba(96,165,250,0.3)] flex items-center justify-center font-bold text-xs shrink-0"
        title={rango}
      >
        💎
      </div>
    );
  }
  if (rangoUpper.includes('EMERALD')) {
    return (
      <div
        className="w-11 h-11 rounded-full border-2 border-emerald-400 bg-emerald-950/70 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)] flex items-center justify-center font-bold text-xs shrink-0"
        title={rango}
      >
        ❇️
      </div>
    );
  }
  if (rangoUpper.includes('GOLD')) {
    return (
      <div
        className="w-11 h-11 rounded-full border-2 border-amber-400 bg-amber-950/60 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0"
        title={rango}
      >
        🥇
      </div>
    );
  }
  if (rangoUpper.includes('SILVER')) {
    return (
      <div
        className="w-11 h-11 rounded-full border border-slate-300 bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs shrink-0"
        title={rango}
      >
        🥈
      </div>
    );
  }
  if (rangoUpper.includes('BRONZE')) {
    return (
      <div
        className="w-11 h-11 rounded-full border border-amber-700 bg-amber-950/80 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0"
        title={rango}
      >
        🥉
      </div>
    );
  }

  return (
    <div
      className="w-11 h-11 rounded-full border border-white/10 bg-white/5 text-white/40 flex items-center justify-center font-semibold text-xs shrink-0"
      title={rango || 'Unranked'}
    >
      LoL
    </div>
  );
}

function safeParse(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export default function TarjetaRiot({
  riot,
  token,
  esMiPerfil,
  onActualizar,
  esUsuarioPremium,
  es_premium,
  usuarioLogueado,
  usuario,
}) {
  if (!riot) return null;

  const [editandoRol, setEditandoRol] = useState(false);
  const [rolActual, setRolActual] = useState(riot.lol_posicion_principal || '');
  const [verHistorial, setVerHistorial] = useState(false);

  const valorPremium =
    esUsuarioPremium !== undefined
      ? esUsuarioPremium
      : es_premium !== undefined
      ? es_premium
      : usuarioLogueado?.es_premium !== undefined
      ? usuarioLogueado.es_premium
      : usuario?.es_premium;

  const esPremiumValido = Boolean(
    valorPremium === true ||
      valorPremium === 1 ||
      valorPremium === '1' ||
      valorPremium === 'true'
  );

  const puedeVerStats = Boolean(esMiPerfil || esPremiumValido);

  let campeonesMaestria = riot.top_champions;
  if (typeof campeonesMaestria === 'string') {
    try {
      campeonesMaestria = JSON.parse(campeonesMaestria);
    } catch (e) {
      campeonesMaestria = [];
    }
  }

  const partidas = safeParse(riot.ultimas_partidas);
  const statsCampeones = safeParse(riot.stats_campeones);

  const handleGuardarRol = async (nuevoRol) => {
    try {
      setRolActual(nuevoRol);
      setEditandoRol(false);
      if (token) {
        await authApi.actualizarRolRiot(token, nuevoRol);
        if (onActualizar) onActualizar();
      }
    } catch (err) {
      alert('Error al actualizar rol');
    }
  };

  const tienePartidas = riot.lol_wins > 0 || riot.lol_losses > 0;
  const winrate = tienePartidas
    ? Math.round((riot.lol_wins / (riot.lol_wins + riot.lol_losses)) * 100)
    : 0;

  return (
    <div className="w-full bg-black/20 border border-white/10 rounded-xl p-3 space-y-3 text-left">
      <div className="flex items-center gap-3">
        <IconoRiot rango={riot.rango_lol} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-bold text-amber-400 truncate">
              {riot.rango_lol || 'UNRANKED'}
            </p>
            {riot.lol_lp !== undefined && riot.lol_lp > 0 && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-semibold shrink-0">
                {riot.lol_lp} LP
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-[11px] text-white/70 truncate">
              {riot.riot_username || riot.game_name} {riot.nivel_invocador ? `(Niv. ${riot.nivel_invocador})` : ''}
            </p>

            {/* MOSTRAR / EDITAR ROL PRINCIPAL */}
            <div className="flex items-center gap-1 shrink-0">
              {editandoRol ? (
                <select
                  value={rolActual}
                  onChange={(e) => handleGuardarRol(e.target.value)}
                  className="bg-surface border border-amber-400 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded outline-none cursor-pointer"
                  autoFocus
                >
                  <option value="">Sin Rol</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  disabled={!esMiPerfil}
                  onClick={() => setEditandoRol(true)}
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase transition flex items-center gap-1 ${
                    rolActual
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-purple-900/40 text-purple-300 border border-purple-500/40'
                  } ${esMiPerfil ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}`}
                  title={esMiPerfil ? 'Hacé clic para cambiar tu rol' : ''}
                >
                  {rolActual ? `Rol: ${rolActual}` : 'SIN ROL ✏️'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE DE ESTADÍSTICAS AVANZADAS O PREMIUM */}
      {puedeVerStats ? (
        <>
          {/* ESTADÍSTICAS GENERALES (WINRATE SOLOQ + KDA PROMEDIO) */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] flex-wrap gap-2">
            {tienePartidas && (
              <div className="flex items-center gap-1">
                <span className="text-white/40">SoloQ:</span>
                <span className="text-white font-medium">
                  {riot.lol_wins}W / {riot.lol_losses}L
                </span>
                <span className="text-emerald-400 font-bold ml-1">({winrate}% WR)</span>
              </div>
            )}

            {riot.kda_promedio !== undefined && (
              <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                <span className="text-white/50 text-[10px]">KDA Promedio:</span>
                <span className="text-cyan-300 font-mono font-bold">{riot.kda_promedio}</span>
              </div>
            )}
          </div>

          {/* STATS POR CAMPEÓN RECIENTE */}
          {statsCampeones && statsCampeones.length > 0 && (
            <div className="pt-2 border-t border-white/5 space-y-1.5">
              <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                Rendimiento Reciente por Campeón
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {statsCampeones.slice(0, 4).map((c, i) => (
                  <div
                    key={i}
                    className="bg-black/40 border border-white/5 p-1.5 rounded-lg flex items-center justify-between text-[11px]"
                  >
                    <span className="font-bold text-white/90 truncate">{c.campeon}</span>
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span className={c.winrate >= 50 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {c.winrate}%
                      </span>
                      <span className="text-white/40">({c.jugadas}p)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {campeonesMaestria && campeonesMaestria.length > 0 && (
            <TopCampeones campeones={campeonesMaestria} />
          )}

          {/* HISTORIAL DESPLEGABLE DE 10 PARTIDAS */}
          <div className="pt-2 border-t border-white/5">
            <button
              onClick={() => setVerHistorial(!verHistorial)}
              className="w-full text-[11px] bg-surface/80 hover:bg-white/10 text-white/80 py-1.5 rounded-lg transition font-semibold flex items-center justify-center gap-1.5"
            >
              <span>{verHistorial ? '▲ Ocultar Historial' : '⚔️ Ver últimas 10 partidas'}</span>
              {partidas.length > 0 && (
                <span className="bg-primary/30 text-primary text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {partidas.length}
                </span>
              )}
            </button>

            {verHistorial && (
              <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {partidas.length > 0 ? (
                  partidas.map((p, idx) => {
                    const esVictoria = p.resultado === 'Victoria';
                    const posUpper = (p.posicion || '').toUpperCase();
                    const esModo = MODOS_ESPECIALES.includes(posUpper);

                    return (
                      <div
                        key={p.id || idx}
                        className={`flex items-center justify-between p-2 rounded-lg text-[11px] border transition ${
                          esVictoria
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/10 border-red-500/20 text-red-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{p.campeon}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold border ${
                              esModo
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                            }`}
                          >
                            <span className="opacity-60 mr-1">{esModo ? 'Modo:' : 'Rol:'}</span>
                            {p.posicion || 'Juego'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 font-mono">
                          <span className="text-white/90">
                            {p.kills}/{p.deaths}/{p.assists}
                          </span>
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase ${
                              esVictoria ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {esVictoria ? 'Victoria' : 'Derrota'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-[10px] text-white/40 py-3">
                    Sin datos de partidas recientes cargados.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        /* BANNER INFORMATIVO PARA USUARIOS NO PREMIUM */
        <div className="pt-2 border-t border-white/5">
          <div className="bg-gradient-to-r from-purple-900/30 via-amber-950/20 to-purple-900/30 border border-amber-500/30 rounded-lg p-3 text-center space-y-1.5 shadow-lg">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-extrabold uppercase tracking-wide">
              <span>👑 Feature Premium</span>
            </div>
            <p className="text-[11px] text-white/80 leading-snug">
              Necesitás ser usuario <strong className="text-amber-300">Premium</strong> para ver el KDA promedio, maestrías y el historial de partidas de otros jugadores.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}