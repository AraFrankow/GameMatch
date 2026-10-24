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

        {!cargando && jugadores.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jugadores.map((j) => (
              <TarjetaJugador
                key={j.id}
                jugador={j}
                onVerPerfil={onVerPerfil}
                onBloquear={handleBloquear}
                onReportar={(id) => setReportandoId(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}