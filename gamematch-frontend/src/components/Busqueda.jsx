import React, { useState, useEffect } from 'react';
import { authApi } from '../api';
import PanelFiltros from './PanelFiltros';

export default function Busqueda({ token, usuario, onVerPerfil }) {
  const [jugadores, setJugadores] = useState([]);
  const [premiumDestacados, setPremiumDestacados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const [reportandoId, setReportandoId] = useState(null);
  const [motivoReporte, setMotivoReporte] = useState('');
  const [mensajeModal, setMensajeModal] = useState('');

  const [filtros, setFiltros] = useState({
    modo_juego: '',
    plataforma: '',
    rango_edad: '',
    rango_lol: '',
    winrate_min: '',
    sinergia_min: '',
    rol_preferido: '',
  });

  const cargarDestacados = async () => {
    try {
      const data = await authApi.obtenerPremiumDestacados();
      setPremiumDestacados(data.usuarios || data || []);
    } catch (err) {
      console.error('Error al obtener premium destacados:', err);
    }
  };

  const handleBuscar = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await authApi.buscar(token, filtros);
      const lista = Array.isArray(res) ? res : (res.usuarios || []);
      setJugadores(lista);
    } catch (err) {
      console.error('Error al buscar jugadores:', err);
      setError(err.message || 'Error al realizar la búsqueda');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    handleBuscar();
    cargarDestacados();
  }, []);

  const handleBloquear = async (id, username) => {
    if (!window.confirm(`¿Seguro que querés bloquear a ${username}? No volverás a verlo en tus búsquedas.`)) return;
    try {
      await authApi.bloquear(token, id);
      setJugadores((prev) => prev.filter((j) => j.id !== id));
      setPremiumDestacados((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message || 'Error al bloquear usuario');
    }
  };

  const handleEnviarReporte = async (e) => {
    e.preventDefault();
    if (!motivoReporte.trim()) return;
    try {
      await authApi.reportar(token, { reportado_id: reportandoId, motivo: motivoReporte });
      setMensajeModal('Reporte enviado correctamente.');
      setTimeout(() => {
        setReportandoId(null);
        setMotivoReporte('');
        setMensajeModal('');
      }, 1500);
    } catch (err) {
      alert(err.message || 'Error al enviar reporte');
    }
  };

  const esPremium = Boolean(usuario?.es_premium);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6 text-left">
      <h2 className="text-xl font-bold text-white">Buscar jugadores</h2>

      {/* 1. FILTROS EN LA PARTE SUPERIOR */}
      <PanelFiltros
        filtros={filtros}
        setFiltros={setFiltros}
        esPremium={esPremium}
        onBuscar={handleBuscar}
      />

      {/* 2. JUGADORES PREMIUM DESTACADOS */}
      {premiumDestacados.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-sm">⭐ Jugadores Premium Destacados</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-semibold">
                Prioridad
              </span>
            </div>
            <span className="text-xs text-white/40">Aparecé acá obteniendo Premium</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {premiumDestacados.map((p) => (
              <div
                key={p.id}
                className="bg-card/90 border border-amber-500/40 rounded-xl p-3 flex flex-col items-center text-center space-y-2 hover:border-amber-400 transition shadow-[0_0_10px_rgba(251,191,36,0.1)]"
              >
                <div className="w-12 h-12 rounded-full bg-surface border-2 border-amber-400 overflow-hidden flex items-center justify-center text-base font-bold text-white relative">
                  {p.foto_perfil ? (
                    <img src={p.foto_perfil} alt={p.username} className="w-full h-full object-cover" />
                  ) : (
                    (p.username?.[0] || 'U').toUpperCase()
                  )}
                  <span className="absolute bottom-0 right-0 text-[10px]">⭐</span>
                </div>

                <div className="w-full min-w-0">
                  <p className="text-xs font-bold text-white truncate">{p.username}</p>
                  <p className="text-[10px] text-white/50 truncate">
                    {p.rango_edad ? `Rango: ${p.rango_edad}` : 'Adulto'}
                  </p>
                </div>

                <button
                  onClick={() => onVerPerfil && onVerPerfil(p.id)}
                  className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] py-1 rounded-lg transition font-medium"
                >
                  Ver perfil
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. RESULTADOS DE BÚSQUEDA */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-sm font-bold text-white/90">Jugadores encontrados</h3>
          <span className="text-xs text-white/40">
            {jugadores.length} {jugadores.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        {cargando && (
          <div className="bg-card p-6 rounded-2xl border border-white/5 text-center text-xs text-white/50">
            Buscando jugadores compatibles...
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
            {error}
          </div>
        )}

        {!cargando && !error && jugadores.length === 0 && (
          <div className="bg-card border border-white/10 rounded-2xl p-8 text-center text-white/50 text-xs">
            No se encontraron jugadores con los filtros aplicados.
          </div>
        )}

        {!cargando && jugadores.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jugadores.map((j) => (
              <div
                key={j.id}
                className={`bg-card border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition shadow-md ${
                  j.es_premium ? 'border-amber-500/30' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-surface border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-bold text-white">
                        {j.foto_perfil ? (
                          <img src={j.foto_perfil} alt={j.username} className="w-full h-full object-cover" />
                        ) : (
                          (j.username?.[0] || 'U').toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                          <span>{j.username}</span>
                          {j.es_premium && <span className="text-[10px]">⭐</span>}
                        </p>
                        <p className="text-[10px] text-white/50 truncate">
                          {j.rango_edad ? `Rango: ${j.rango_edad}` : 'Jugador GameMatch'}
                        </p>
                      </div>
                    </div>

                    {/* Badge Sinergia */}
                    {j.sinergia_porcentaje !== undefined && (
                      <span className="bg-primary/20 border border-primary/30 text-primary font-bold text-[11px] px-2 py-0.5 rounded-full shrink-0">
                        ⚡ {j.sinergia_porcentaje}%
                      </span>
                    )}
                  </div>

                  {/* Tarjeta Resumen Riot */}
                  {j.riot && (
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2 text-[11px] flex items-center justify-between">
                      <span className="text-amber-400 font-bold">{j.riot.rango_lol || 'UNRANKED'}</span>
                      {j.lol_winrate > 0 && (
                        <span className="text-emerald-400 font-semibold">{j.lol_winrate}% WR</span>
                      )}
                    </div>
                  )}
                </div>

                {/* BOTONES DE ACCIÓN: VER PERFIL, BLOQUEAR, REPORTAR */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => onVerPerfil && onVerPerfil(j.id)}
                    className="w-full bg-primary/90 hover:bg-primary text-white text-xs py-2 rounded-xl transition font-medium shadow-md"
                  >
                    Ver perfil
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBloquear(j.id, j.username)}
                      className="flex-1 bg-surface hover:bg-red-500/10 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/20 text-[11px] py-1.5 rounded-lg transition"
                    >
                      Bloquear
                    </button>
                    <button
                      onClick={() => setReportandoId(j.id)}
                      className="flex-1 bg-surface hover:bg-amber-500/10 text-white/50 hover:text-amber-400 border border-white/10 hover:border-amber-500/20 text-[11px] py-1.5 rounded-lg transition"
                    >
                      Reportar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE REPORTAR */}
      {reportandoId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-white/10 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Reportar Usuario</h3>
            
            {mensajeModal ? (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                {mensajeModal}
              </p>
            ) : (
              <form onSubmit={handleEnviarReporte} className="space-y-3">
                <textarea
                  rows="3"
                  placeholder="Escribí el motivo del reporte (ej. comportamiento tóxico, cuenta falsa)..."
                  value={motivoReporte}
                  onChange={(e) => setMotivoReporte(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary resize-none"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setReportandoId(null); setMotivoReporte(''); }}
                    className="bg-surface text-white/60 text-xs px-3 py-1.5 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
                  >
                    Enviar Reporte
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}