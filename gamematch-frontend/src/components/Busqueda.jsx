import React, { useState, useEffect } from 'react';
import { authApi } from '../api';
import PanelFiltros from './PanelFiltros';
import TarjetaJugador from './TarjetaJugador';

export default function Busqueda({ token, usuario, onVerPerfil }) {
  const [jugadores, setJugadores] = useState([]);
  const [premiumDestacados, setPremiumDestacados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const [reportandoId, setReportandoId] = useState(null);
  const [motivoReporte, setMotivoReporte] = useState('');
  const [mensajeModal, setMensajeModal] = useState('');
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('lenguaje_inapropiado');
  const [comentarioReporte, setComentarioReporte] = useState('');

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
    if (!comentarioReporte.trim()) return;

    try {
      await authApi.reportar(token, {
        reportado_id: Number(reportandoId),
        motivo: motivoSeleccionado,
        comentario: comentarioReporte.trim()
      });

      setMensajeModal('Reporte enviado correctamente.');
      setTimeout(() => {
        setReportandoId(null);
        setComentarioReporte('');
        setMotivoSeleccionado('lenguaje_inapropiado');
        setMensajeModal('');
      }, 1500);
    } catch (err) {
      alert(err.message || 'Error al enviar reporte');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6 text-left">
      <h2 className="text-xl font-bold text-white">Buscar jugadores</h2>

      {/* FILTROS ARRIBA */}
      <PanelFiltros
        filtros={filtros}
        setFiltros={setFiltros}
        esPremium={Boolean(usuario?.es_premium)}
        onBuscar={handleBuscar}
      />

      {/* GRILLA DE JUGADORES ENCONTRADOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-sm font-bold text-white/90">Jugadores encontrados</h3>
          <span className="text-xs text-white/40">{jugadores.length} resultados</span>
        </div>

        {cargando && (
          <p className="text-center text-xs text-white/50 py-8">Buscando compañeros de juego...</p>
        )}

        {error && (
          <p className="text-center text-xs text-red-400 py-4">{error}</p>
        )}

        {!cargando && !error && jugadores.length === 0 && (
          <p className="text-center text-xs text-white/40 italic py-8">
            No se encontraron jugadores que coincidan con los filtros.
          </p>
        )}

        {!cargando && jugadores.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jugadores.map((j) => (
              <TarjetaJugador
                key={j.id}
                jugador={j}
                onVerPerfil={onVerPerfil}
                onBloquear={() => handleBloquear(j.id, j.username)}
                onReportar={() => setReportandoId(j.id)}
              />
            ))}
          </div>
        )}
      </div>

      {reportandoId && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md relative shadow-2xl space-y-4">
            <button
              onClick={() => {
                setReportandoId(null);
                setComentarioReporte('');
                setMensajeModal('');
              }}
              className="absolute top-4 right-4 text-white/50 hover:text-white text-lg transition"
            >
              ✕
            </button>

            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <span>🚨</span> Reportar Jugador
            </h3>

            {mensajeModal ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-center text-sm font-medium">
                {mensajeModal}
              </div>
            ) : (
              <form onSubmit={handleEnviarReporte} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Motivo principal
                  </label>
                  <select
                    value={motivoSeleccionado}
                    onChange={(e) => setMotivoSeleccionado(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  >
                    <option value="lenguaje_inapropiado">Lenguaje Inapropiado</option>
                    <option value="acoso">Acoso</option>
                    <option value="spam">Spam / Enlaces no deseados</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Detalle o comentario
                  </label>
                  <textarea
                    value={comentarioReporte}
                    onChange={(e) => setComentarioReporte(e.target.value)}
                    placeholder="Explicá brevemente la situación..."
                    rows={3}
                    className="w-full bg-surface border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportandoId(null)}
                    className="px-4 py-2 rounded-xl bg-surface hover:bg-white/10 text-xs font-medium text-white/70 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-xs font-semibold text-white transition"
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