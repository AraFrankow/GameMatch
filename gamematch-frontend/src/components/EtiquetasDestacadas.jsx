import React from 'react';

export default function EtiquetasDestacadas({ porcentajeReputacion, etiquetas, esUsuarioPremium }) {
  const rep = porcentajeReputacion ?? 100;

  return (
    <div className="w-full space-y-2 mt-3 text-left bg-surface/30 p-3 rounded-xl border border-white/5">
      {/* 1. SECCIÓN PÚBLICA: Porcentaje y barra de reputación */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white/70">Reputación comunitaria</span>
          <span
            className={`font-bold ${
              rep >= 70 ? 'text-emerald-400' : rep >= 40 ? 'text-amber-400' : 'text-red-400'
            }`}
          >
            {rep}% Positiva
          </span>
        </div>

        {/* Barra visual de porcentaje */}
        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              rep >= 70 ? 'bg-emerald-500' : rep >= 40 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${rep}%` }}
          />
        </div>
      </div>

      {/* 2. SECCIÓN EXCLUSIVA PREMIUM: Desglose de etiquetas */}
      {esUsuarioPremium ? (
        <div className="pt-2 border-t border-white/5 space-y-1.5">
          <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
            Etiquetas elegidas por la comunidad
          </p>
          {!etiquetas || etiquetas.length === 0 ? (
            <p className="text-[11px] text-white/40 italic">
              Aún no registró etiquetas de otros jugadores.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {etiquetas.map((item, index) => {
                const esPositiva = item.tipo === 'positiva' || item.tipo === 'positivo';
                return (
                  <span
                    key={index}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 ${
                      esPositiva
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-300 border-red-500/20'
                    }`}
                  >
                    <span>{esPositiva ? '👍' : '👎'}</span>
                    <span>{item.etiqueta}</span>
                    <span className="text-[10px] opacity-70 bg-black/40 px-1.5 py-0.5 rounded-full font-bold">
                      x{item.cantidad}
                    </span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Bloqueo Free */
        <div className="mt-2 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-amber-300 text-xs font-bold">
            <span>🔒</span> Desglose de etiquetas bloqueado
          </div>
          <p className="text-[10px] text-white/60 leading-tight">
            Suscribite a <strong className="text-amber-400">Premium</strong> para ver qué etiquetas específicas (como "Líder táctico" o "Mente fría") le asignaron otros jugadores.
          </p>
        </div>
      )}
    </div>
  );
}