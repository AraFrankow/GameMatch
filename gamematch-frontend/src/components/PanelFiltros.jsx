import React from 'react';

const RANGOS_LOL = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER'];
const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

export default function PanelFiltros({ filtros, setFiltros, esPremium, onBuscar }) {
  const handleChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const handleLimpiar = () => {
    setFiltros({
      modo_juego: '',
      plataforma: '',
      rango_edad: '',
      rango_lol: '',
      winrate_min: '',
      sinergia_min: '',
      rol_preferido: '',
    });
  };

  return (
    <div className="w-full bg-card border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 text-left">
      {/* CABECERA DE FILTROS */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          Filtros de Búsqueda
        </h3>
        <button
          onClick={handleLimpiar}
          className="text-xs text-white/40 hover:text-white transition"
        >
          Limpiar filtros
        </button>
      </div>

      {/* FILTROS BÁSICOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] text-white/60 mb-1 font-medium">Modo de Juego</label>
          <select
            name="modo_juego"
            value={filtros.modo_juego}
            onChange={handleChange}
            className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary transition"
          >
            <option value="">Todos</option>
            <option value="competitivo">Competitivo</option>
            <option value="casual">Casual</option>
            <option value="ambos">Ambos</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-white/60 mb-1 font-medium">Plataforma</label>
          <select
            name="plataforma"
            value={filtros.plataforma}
            onChange={handleChange}
            className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary transition"
          >
            <option value="">Todas</option>
            <option value="pc">PC</option>
            <option value="consola">Consola</option>
            <option value="mobile">Mobile</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-white/60 mb-1 font-medium">Rango de Edad</label>
          <select
            name="rango_edad"
            value={filtros.rango_edad}
            onChange={handleChange}
            className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary transition"
          >
            <option value="">Todos</option>
            <option value="menor_18">Menor de 18</option>
            <option value="18_25">18 a 25</option>
            <option value="26_35">26 a 35</option>
            <option value="36_mas">36 o más</option>
          </select>
        </div>
      </div>

      {/* FILTROS COMPETITIVOS AVANZADOS (PREMIUM) */}
      <div className="pt-3 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            ⭐ Filtros Competitivos Avanzados
          </span>
          {!esPremium && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-semibold">
              🔒 Solo Premium
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] text-white/60 mb-1 font-medium truncate">Rango LoL Mínimo</label>
            <select
              name="rango_lol"
              disabled={!esPremium}
              value={filtros.rango_lol}
              onChange={handleChange}
              className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <option value="">Cualquiera</option>
              {RANGOS_LOL.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-white/60 mb-1 font-medium truncate">Winrate Mínimo (%WR)</label>
            <select
              name="winrate_min"
              disabled={!esPremium}
              value={filtros.winrate_min}
              onChange={handleChange}
              className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <option value="">Sin Mínimo</option>
              <option value="50">≥ 50% Winrate</option>
              <option value="75">≥ 75% Winrate</option>
              <option value="90">≥ 90% Winrate</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-white/60 mb-1 font-medium truncate">Sinergia Mínima</label>
            <select
              name="sinergia_min"
              disabled={!esPremium}
              value={filtros.sinergia_min}
              onChange={handleChange}
              className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <option value="">Sin Mínimo</option>
              <option value="70">≥ 70% Sinergia</option>
              <option value="80">≥ 80% (Alta)</option>
              <option value="90">≥ 90% (Dúo Perfecto)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-white/60 mb-1 font-medium truncate">Rol Buscado</label>
            <select
              name="rol_preferido"
              disabled={!esPremium}
              value={filtros.rol_preferido}
              onChange={handleChange}
              className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <option value="">Cualquiera</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onBuscar}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-lg"
        >
          Aplicar Filtros y Buscar Jugadores
        </button>
      </div>
    </div>
  );
}