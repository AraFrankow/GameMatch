import React, { useState } from 'react';
import TopCampeones from './TopCampeones';
import { authApi } from '../api';

const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

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

export default function TarjetaRiot({ riot, token, esMiPerfil, onActualizar }) {
  if (!riot) return null;

  const [editandoRol, setEditandoRol] = useState(false);
  const [rolActual, setRolActual] = useState(riot.lol_posicion_principal || '');

  let campeones = riot.top_champions;
  if (typeof campeones === 'string') {
    try {
      campeones = JSON.parse(campeones);
    } catch (e) {
      campeones = [];
    }
  }

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
              {riot.riot_username} {riot.nivel_invocador ? `(Nivel ${riot.nivel_invocador})` : ''}
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

      {tienePartidas && (
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
          <span className="text-white/40">Rendimiento SoloQ:</span>
          <span className="text-white font-medium">
            {riot.lol_wins}W / {riot.lol_losses}L{' '}
            <span className="text-emerald-400 font-bold ml-1">({winrate}% WR)</span>
          </span>
        </div>
      )}

      {/* RENDERIZADO DE MAESTRÍAS DE CAMPEONES */}
      {campeones && campeones.length > 0 && <TopCampeones campeones={campeones} />}
    </div>
  );
}