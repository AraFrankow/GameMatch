import React from 'react';

export default function TarjetaSteam({ steam, juegosEnComun = [] }) {
  if (!steam) return null;

  let topJuegos = [];
  try {
    topJuegos = typeof steam.top_juegos === 'string'
      ? JSON.parse(steam.top_juegos)
      : (Array.isArray(steam.top_juegos) ? steam.top_juegos : []);
  } catch (e) {
    topJuegos = [];
  }

  let listaJuegosEnComun = [];
  try {
    listaJuegosEnComun = typeof juegosEnComun === 'string'
      ? JSON.parse(juegosEnComun)
      : (Array.isArray(juegosEnComun) ? juegosEnComun : []);
  } catch (e) {
    listaJuegosEnComun = [];
  }

  const fallbackSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%2310b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><path d="M6 12h4m-2-2v4m11-3h.01m-3 0h.01"/></svg>`;

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = fallbackSvg;
  };

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 space-y-4 text-left">
      {/* CABECERA STEAM */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#171a21] border border-[#66c0f4]/30 flex items-center justify-center text-xl shadow-[0_0_10px_rgba(102,192,244,0.15)]">
            🎮
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-none">
              {steam.steam_username || 'Cuenta de Steam'}
            </h4>
            <p className="text-[11px] text-[#66c0f4] font-medium mt-1">
              {steam.total_juegos ? `${steam.total_juegos} juegos en biblioteca` : 'Steam Vinculado'}
            </p>
          </div>
        </div>

        {/* ESTADO EN VIVO */}
        {steam.jugando_ahora && (
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] text-emerald-400 font-bold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="truncate max-w-[120px]">{steam.jugando_ahora}</span>
          </div>
        )}
      </div>

    {/* JUEGOS EN COMÚN */}
    {listaJuegosEnComun.length > 0 && (
    <div className="space-y-2 border-b border-white/5 pb-3">
        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
        <span>🤝</span> JUEGOS EN COMÚN ({listaJuegosEnComun.length})
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {listaJuegosEnComun.map((juego, idx) => {
            let imagenUrl = juego.icono || juego.imagen_url || juego.imagen;

            if (imagenUrl && !imagenUrl.includes('header.jpg')) {
            const match = imagenUrl.match(/\/apps\/(\d+)\//);
            if (match && match[1]) {
                imagenUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${match[1]}/header.jpg`;
            }
            }

            return (
            <div
                key={idx}
                className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl flex items-center gap-2 min-w-0"
            >
                <img
                src={imagenUrl || fallbackSvg}
                alt={juego.nombre}
                referrerPolicy="no-referrer"
                onError={handleImageError}
                className="w-8 h-8 rounded shrink-0 object-cover bg-black/40"
                />
                <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-white truncate">{juego.nombre}</p>
                <p className="text-[9px] text-emerald-300 font-mono">
                    Tú: {juego.mis_horas}h | Él: {juego.sus_horas}h
                </p>
                </div>
            </div>
            );
        })}
        </div>
    </div>
    )}

      {/* TOP JUEGOS MÁS JUGADOS */}
      {topJuegos.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
            🔥 MÁS JUGADOS EN STEAM
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {topJuegos.map((juego, idx) => {
              const imagenUrl = juego.icono || juego.imagen_url || juego.imagen;

              return (
                <div
                  key={idx}
                  className="bg-surface/80 border border-white/5 p-2 rounded-xl flex items-center gap-2 min-w-0"
                >
                  <img
                    src={imagenUrl || fallbackSvg}
                    alt={juego.nombre}
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                    className="w-8 h-8 rounded shrink-0 object-cover bg-black/40"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-white truncate">{juego.nombre}</p>
                    <p className="text-[9px] text-white/50 font-mono">{juego.horas} hrs jugadas</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}