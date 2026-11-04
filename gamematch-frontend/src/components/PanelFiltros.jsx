import React, { useState, useEffect, useRef } from 'react';
import { authApi } from '../api';

const RANGOS_LOL = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER'];
const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

export default function PanelFiltros({ filtros, setFiltros, esPremium, onBuscar }) {
  const [busquedaJuego, setBusquedaJuego] = useState(filtros.juego_steam || '');
  const [sugerenciasJuegos, setSugerenciasJuegos] = useState([]);
  const [cargandoJuegos, setCargandoJuegos] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setBusquedaJuego(filtros.juego_steam || '');
  }, [filtros.juego_steam]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFiltros({
      ...filtros,
      [name]: type === 'checkbox' ? (checked ? 'true' : '') : value,
    });
  };

  const handleInputChangeJuego = async (e) => {
    const valor = e.target.value;
    setBusquedaJuego(valor);
    setFiltros((prev) => ({ ...prev, juego_steam: valor }));

    if (!valor.trim()) {
      setSugerenciasJuegos([]);
      setMostrarSugerencias(false);
      return;
    }

    setCargandoJuegos(true);
    try {
      const token = localStorage.getItem('token');
      const res = await authApi.buscarJuegosSteam(token, valor.trim());
      const lista = res?.juegos || [];
      setSugerenciasJuegos(lista);
      setMostrarSugerencias(lista.length > 0);
    } catch (err) {
      console.error('Error al buscar juegos de Steam:', err);
      setSugerenciasJuegos([]);
    } finally {
      setCargandoJuegos(false);
    }
  };

  const seleccionarJuego = (nombreJuego) => {
    setBusquedaJuego(nombreJuego);
    setFiltros((prev) => ({ ...prev, juego_steam: nombreJuego }));
    setMostrarSugerencias(false);
  };

  const handleLimpiar = () => {
    setBusquedaJuego('');
    setSugerenciasJuegos([]);
    setMostrarSugerencias(false);
    setFiltros({
      modo_juego: '',
      rango_edad: '',
      juego_steam: '',
      rango_lol: '',
      winrate_min: '',
      sinergia_min: '',
      rol_preferido: '',
      reputacion_min: '',
      solo_premium: '',
      solo_verificados: '',
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
          type="button"
          onClick={handleLimpiar}
          className="text-xs text-white/40 hover:text-white transition"
        >
          Limpiar filtros
        </button>
      </div>

      {/* FILTRO SOLO JUGADORES PREMIUM */}
      <div className="p-3 bg-surface/50 border border-amber-500/30 rounded-xl flex items-center justify-between">
        <label className="flex items-center gap-2.5 text-xs font-bold text-amber-400 cursor-pointer select-none">
          <input
            type="checkbox"
            name="solo_premium"
            checked={filtros.solo_premium === 'true'}
            onChange={handleChange}
            className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
          />
          ⭐ Mostrar solo jugadores Premium
        </label>
      </div>

      {/* FILTROS BÁSICOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] text-white/60 mb-1 font-medium">Modo de Juego</label>
          <select
            name="modo_juego"
            value={filtros.modo_juego || ''}
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
          <label className="block text-[11px] text-white/60 mb-1 font-medium">Rango de Edad</label>
          <select
            name="rango_edad"
            value={filtros.rango_edad || ''}
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

        {/* BUSCADOR AUTOCOMPLETABLE DE JUEGOS DE STEAM */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-[11px] text-white/60 mb-1 font-medium">Juego de Steam</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ej: Counter-Strike, Rust..."
              value={busquedaJuego}
              onChange={handleInputChangeJuego}
              onFocus={() => sugerenciasJuegos.length > 0 && setMostrarSugerencias(true)}
              className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary transition pr-8"
            />
            {cargandoJuegos && (
              <span className="absolute right-2.5 top-2.5 text-[10px] text-primary animate-pulse">
                ⌛
              </span>
            )}
          </div>

          {mostrarSugerencias && sugerenciasJuegos.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-white/10 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
              {sugerenciasJuegos.map((juego, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => seleccionarJuego(juego)}
                  className="w-full text-left px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-primary/20 border-b border-white/5 last:border-0 transition"
                >
                  🎮 {juego}
                </button>
              ))}
            </div>
          )}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] text-white/60 mb-1 font-medium truncate">Verificación</label>
            <label
              className={`flex items-center gap-2 bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer select-none transition ${
                !esPremium ? 'opacity-40 cursor-not-allowed' : 'hover:border-amber-400'
              }`}
            >
              <input
                type="checkbox"
                name="solo_verificados"
                disabled={!esPremium}
                checked={filtros.solo_verificados === 'true'}
                onChange={handleChange}
                className="w-3.5 h-3.5 accent-amber-400 rounded cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="truncate">Verificados</span>
            </label>
          </div>

          <div>
            <label className="block text-[11px] text-white/60 mb-1 font-medium truncate">Rango LoL Mínimo</label>
            <select
              name="rango_lol"
              disabled={!esPremium}
              value={filtros.rango_lol || ''}
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
              value={filtros.winrate_min || ''}
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
              value={filtros.sinergia_min || ''}
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
              value={filtros.rol_preferido || ''}
              onChange={handleChange}
              className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <option value="">Cualquiera</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-white/60 mb-1 font-medium truncate">
              Reputación Mínima
            </label>
            <select
              name="reputacion_min"
              disabled={!esPremium}
              value={filtros.reputacion_min || ''}
              onChange={handleChange}
              className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <option value="">Sin Mínimo</option>
              <option value="50">≥ 50% Positiva</option>
              <option value="75">≥ 75% Buena</option>
              <option value="90">≥ 90% Excelente</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => onBuscar && onBuscar(filtros)}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-lg"
        >
          Aplicar Filtros y Buscar Jugadores
        </button>
      </div>
    </div>
  );
}