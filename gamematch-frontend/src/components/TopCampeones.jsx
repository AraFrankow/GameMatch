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
  if (!campeones || campeones.length === 0) return null;

  return (
    <div className="space-y-1.5 pt-2 border-t border-white/5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
        Mains / Campeones Destacados
      </p>
      <div className="grid grid-cols-3 gap-2">
        {campeones.map((c, index) => (
          <CampeonItem
            key={c.championId || index}
            championId={c.championId}
            level={c.championLevel}
            points={c.championPoints}
          />
        ))}
      </div>
    </div>
  );
}