import React, { useState } from 'react';

function CampeonItem({ championId, level, points }) {
  const [error, setError] = useState(false);

  const puntosFormateados = points > 999 
    ? `${(points / 1000).toFixed(0)}k pts` 
    : `${points} pts`;

  return (
    <div className="flex items-center gap-2 bg-black/30 border border-white/10 p-2 rounded-lg">
      {!error ? (
        <img
          src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`}
          alt="Campeón"
          className="w-8 h-8 rounded-full border border-amber-400/50 object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
          M{level}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-amber-300 uppercase leading-none">
          Maestría {level}
        </p>
        <p className="text-[10px] text-white/60 font-mono mt-0.5">
          {puntosFormateados}
        </p>
      </div>
    </div>
  );
}

export default function TopCampeones({ campeones }) {
  let lista = campeones;

  if (typeof lista === 'string') {
    try {
      lista = JSON.parse(lista);
    } catch (e) {
      lista = [];
    }
  }

  if (typeof lista === 'string') {
    try {
      lista = JSON.parse(lista);
    } catch (e) {
      lista = [];
    }
  }

  if (!Array.isArray(lista) || lista.length === 0) {
    return null;
  }

  return (
    <div className="pt-2 border-t border-white/5 space-y-1 text-left">
      <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
        Maestrías Principales
      </p>
      <div className="flex gap-2">
        {lista.map((c, index) => (
          <div
            key={c.championId || index}
            className="bg-black/30 border border-white/10 px-2 py-1 rounded text-xs flex items-center gap-1.5"
          >
            <span className="font-bold text-amber-300">Niv. {c.championLevel}</span>
            <span className="text-white/60 font-mono text-[10px]">
              ({Math.round(c.championPoints / 1000)}k pts)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}