import React from 'react';

export const SeccionPremiumDestacados = ({ usuarios = [], onVerPerfil }) => {
  if (!usuarios || usuarios.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-4 space-y-3">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⭐</span>
          <h3 className="text-amber-300 font-bold text-sm sm:text-base">
            Jugadores Premium Destacados
          </h3>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-semibold">
            Prioridad
          </span>
        </div>
        <p className="text-white/40 text-xs hidden sm:block">Aparecé acá obteniendo Premium</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pt-2.5 pb-2 px-1 scrollbar-thin scrollbar-thumb-amber-500/30">
        {usuarios.map((user) => (
          <div
            key={user.id}
            onClick={() => onVerPerfil && onVerPerfil(user.id)}
            className="shrink-0 w-36 bg-surface/90 hover:bg-surface border border-amber-500/30 hover:border-amber-400/60 rounded-xl p-3 flex flex-col items-center text-center cursor-pointer transition-all duration-200 transform hover:-translate-y-1 shadow-md hover:shadow-amber-500/10 space-y-2 group"
          >
            {/* Avatar con borde dorado */}
            <div className="relative shrink-0">
              <img
                src={user.foto_perfil || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=27272a&color=f59e0b`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=27272a&color=f59e0b`;
                }}
                alt={user.username}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-400 ring-offset-2 ring-offset-background"
              />
              <span className="absolute -bottom-1 -right-1 text-xs">⭐</span>
            </div>

            {/* Datos del usuario */}
            <div className="w-full">
              <p className="text-white font-semibold text-xs truncate group-hover:text-amber-300 transition">
                {user.username}
              </p>
              {user.rango_edad && (
                <p className="text-white/50 text-[10px] mt-0.5">
                  {user.rango_edad === 'menor_18' ? 'Menor' : 'Adulto'}
                </p>
              )}
            </div>

            <button className="w-full text-[11px] bg-amber-500/20 hover:bg-amber-500 text-amber-300 border border-amber-500/40 py-1 rounded-lg transition font-medium">
              Ver perfil
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};