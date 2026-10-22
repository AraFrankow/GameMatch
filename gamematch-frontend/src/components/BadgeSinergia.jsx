import React from 'react';

export default function BadgeSinergia({ porcentaje }) {
  if (porcentaje === undefined || porcentaje === null) return null;

  let colorStyle = 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300';
  let etiqueta = 'Sinergia Alta';

  if (porcentaje < 60) {
    colorStyle = 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300';
    etiqueta = 'Sinergia Media';
  } else if (porcentaje < 45) {
    colorStyle = 'from-red-500/20 to-rose-500/20 border-red-500/40 text-red-300';
    etiqueta = 'Sinergia Baja';
  }

  return (
    <div
      className={`bg-gradient-to-r ${colorStyle} border rounded-xl p-2.5 flex items-center justify-between text-xs my-2 shadow-sm`}
      title="Calculado según rango, compatibilidad y comportamiento"
    >
      <div className="flex items-center gap-2">
        <span className="text-base">⚡</span>
        <div>
          <p className="font-bold leading-none">{etiqueta}</p>
          <p className="text-[10px] opacity-70 mt-0.5">Compatibilidad de Duo/Squad</p>
        </div>
      </div>
      <span className="font-mono font-extrabold text-sm bg-black/40 px-2 py-1 rounded-lg">
        {porcentaje}%
      </span>
    </div>
  );
}