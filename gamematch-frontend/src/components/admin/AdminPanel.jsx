import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { authApi } from '../../api';
import TextoExpandible from '../TextoExpandible';

export default function AdminPanel({ token, onVolver }) {
  const [pestaña, setPestaña] = useState('reportes');
  const [reportes, setReportes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [cargandoReportes, setCargandoReportes] = useState(false);
  const [chatEvidencia, setChatEvidencia] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);

  const cargarReportes = async () => {
    setCargandoReportes(true);
    try {
      const res = await authApi.adminObtenerReportes(token, filtroEstado);
      setReportes(res.reportes || []);
    } catch (err) {
      console.error('Error al cargar reportes:', err);
    } finally {
      setCargandoReportes(false);
    }
  };

  const cargarUsuarios = async () => {
    setCargandoUsuarios(true);
    try {
      const res = await authApi.adminObtenerUsuarios(token, busquedaUsuario);
      setUsuarios(Array.isArray(res) ? res : res.usuarios || []);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setCargandoUsuarios(false);
    }
  };

  useEffect(() => {
    if (pestaña === 'reportes') cargarReportes();
    if (pestaña === 'usuarios') cargarUsuarios();
  }, [pestaña, filtroEstado]);

  const handleResolver = async (reporteId, estado, accion = null) => {
    try {
      await authApi.adminResolverReporte(token, reporteId, { estado, accion });
      cargarReportes();
    } catch (err) {
      alert(err.message || 'Error al resolver reporte');
    }
  };

  const handleToggleSuspension = async (usuarioId, estaSuspendido) => {
    try {
      await authApi.adminToggleSuspension(token, usuarioId, !estaSuspendido);
      cargarUsuarios();
      if (pestaña === 'reportes') cargarReportes();
    } catch (err) {
      alert(err.message || 'Error al cambiar estado del usuario');
    }
  };

  const obtenerEvidenciaReal = (r) => {
    const candidatos = [r.evidencia_chat, r.evidenciaChat, r.descripcion, r.comentario];
    for (const item of candidatos) {
      if (!item) continue;
      if (Array.isArray(item) && item.length > 0) return item;
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed !== '' && trimmed !== '[]' && trimmed !== '-') return trimmed;
      }
      if (typeof item === 'object' && Object.keys(item).length > 0) return item;
    }
    return null;
  };

  const obtenerMensajesEvidencia = (evidencia) => {
    if (!evidencia) return [];

    if (Array.isArray(evidencia)) return evidencia;

    if (typeof evidencia === 'string') {
      try {
        const parsed = JSON.parse(evidencia);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        if (typeof parsed === 'object' && parsed !== null) return [parsed];
      } catch (e) {
        return [{ emisor: 'IA Moderación', texto: evidencia }];
      }
    }

    if (typeof evidencia === 'object') return [evidencia];

    return [{ emisor: 'IA Moderación', texto: String(evidencia) }];
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6 text-left relative">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h2 className="text-xl font-bold text-white">Panel de Administración</h2>
            <p className="text-xs text-white/50">Gestión de moderación, usuarios y métricas de GameMatch</p>
          </div>
        </div>

        <button onClick={onVolver} className="text-xs bg-surface hover:bg-white/10 text-white/70 px-3 py-1.5 rounded-xl transition">
          Volver a Búsqueda
        </button>
      </div>

      {/* NAVEGACIÓN POR PESTAÑAS */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setPestaña('reportes')}
          className={`text-xs px-4 py-2 rounded-xl transition font-medium flex items-center gap-2 ${
            pestaña === 'reportes' ? 'bg-primary text-white' : 'bg-surface text-white/60 hover:text-white'
          }`}
        >
          <span>🚨</span> Reportes
        </button>
        <button
          onClick={() => setPestaña('usuarios')}
          className={`text-xs px-4 py-2 rounded-xl transition font-medium flex items-center gap-2 ${
            pestaña === 'usuarios' ? 'bg-primary text-white' : 'bg-surface text-white/60 hover:text-white'
          }`}
        >
          <span>👥</span> Usuarios
        </button>
      </div>

      {/* GESTIÓN DE REPORTES */}
      {pestaña === 'reportes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white/90">Listado de Denuncias</h3>

            <div className="flex gap-2">
              {['pendiente', 'revisado', 'desestimado'].map((est) => (
                <button
                  key={est}
                  onClick={() => setFiltroEstado(est)}
                  className={`text-xs px-3 py-1 rounded-lg capitalize transition ${
                    filtroEstado === est
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {est}
                </button>
              ))}
            </div>
          </div>

          {cargandoReportes ? (
            <p className="text-xs text-white/50 py-8 text-center">Cargando reportes...</p>
          ) : reportes.length === 0 ? (
            <div className="bg-card border border-white/10 rounded-2xl p-8 text-center text-white/40 text-xs italic">
              No hay reportes en estado "{filtroEstado}".
            </div>
          ) : (
            <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-white/80">
                <thead className="bg-surface/80 border-b border-white/10 text-white/50 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Reportador</th>
                    <th className="p-3">Reportado</th>
                    <th className="p-3">Motivo</th>
                    <th className="p-3">Comentario</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Evidencia Chat</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reportes.map((r) => {
                    const evidenciaValida = obtenerEvidenciaReal(r);

                    return (
                      <tr key={r.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-medium text-white">@{r.reportador?.username || 'Anónimo'}</td>
                        <td className="p-3 font-medium text-red-400">
                          @{r.reportado?.username || 'Desconocido'}
                          {r.reportado?.suspendido && (
                            <span className="ml-1 text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">
                              SUSPENDIDO
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-md font-mono text-[11px]">
                            {r.motivo}
                          </span>
                        </td>
                        <td className="p-3 max-w-xs text-white/70 break-words" title={r.comentario}>
                          <TextoExpandible texto={r.comentario} limite={45} />
                        </td>
                        <td className="p-3 capitalize">{r.estado}</td>
                        <td className="p-3">
                          {evidenciaValida ? (
                            <button
                              onClick={() => setChatEvidencia(evidenciaValida)}
                              className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 font-medium transition cursor-pointer"
                            >
                              <span>💬</span> Ver evidencia
                            </button>
                          ) : (
                            <span className="text-white/30 text-[11px] italic">Sin registro</span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {r.estado === 'pendiente' ? (
                            <>
                              <button
                                onClick={() => handleResolver(r.id, 'revisado', 'suspender')}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-2.5 py-1 rounded-lg transition font-medium cursor-pointer"
                                title="Suspender al usuario reportado"
                              >
                                Suspender
                              </button>
                              <button
                                onClick={() => handleResolver(r.id, 'desestimado')}
                                className="bg-surface hover:bg-white/10 text-white/60 px-2.5 py-1 rounded-lg transition font-medium cursor-pointer"
                              >
                                Desestimar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleToggleSuspension(r.reportado?.id, r.reportado?.suspendido)}
                              className={`px-2.5 py-1 rounded-lg transition font-medium cursor-pointer ${
                                r.reportado?.suspendido
                                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                              }`}
                            >
                              {r.reportado?.suspendido ? 'Reactivar' : 'Suspender'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GESTIÓN DE USUARIOS */}
      {pestaña === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-white/90">Buscar Usuarios</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Filtrar por nombre o email..."
                value={busquedaUsuario}
                onChange={(e) => setBusquedaUsuario(e.target.value)}
                className="bg-surface border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary w-64"
              />
              <button
                onClick={cargarUsuarios}
                className="bg-primary hover:bg-primary/80 text-white text-xs px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                Buscar
              </button>
            </div>
          </div>

          {cargandoUsuarios ? (
            <p className="text-xs text-white/50 py-8 text-center">Cargando usuarios...</p>
          ) : (
            <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-white/80">
                <thead className="bg-surface/80 border-b border-white/10 text-white/50 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Usuario</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-mono text-white/50">#{u.id}</td>
                      <td className="p-3 font-medium text-white flex items-center gap-2">
                        <span>{u.username}</span>
                        {u.es_premium && <span title="Premium">⭐</span>}
                      </td>
                      <td className="p-3 text-white/60">{u.email}</td>
                      <td className="p-3 capitalize">{u.rol || 'usuario'}</td>
                      <td className="p-3">
                        {u.suspendido ? (
                          <span className="text-red-400 font-semibold">Suspendido</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">Activo</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleSuspension(u.id, u.suspendido)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                            u.suspendido
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {u.suspendido ? 'Reactivar' : 'Suspender'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE EVIDENCIA DE CHAT */}
      {chatEvidencia && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-lg relative shadow-2xl flex flex-col max-h-[80vh]">
            <button
              onClick={() => setChatEvidencia(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white text-lg transition cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
              <span>💬</span> Historial de Chat (Evidencia del Reporte)
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 my-2">
              {obtenerMensajesEvidencia(chatEvidencia).map((msg, idx) => (
                <div key={idx} className="bg-surface/80 border border-white/5 p-3 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-white/40">
                    <span className="font-bold text-primary">@{msg.emisor || msg.username || 'IA Moderación'}</span>
                    {msg.fecha && (
                      <span>
                        {new Date(msg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-white/90 text-xs break-words">{msg.texto || msg.contenido || msg.mensaje || String(msg)}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setChatEvidencia(null)}
              className="w-full bg-surface hover:bg-white/10 text-white text-xs py-2 rounded-xl transition mt-3 font-semibold cursor-pointer"
            >
              Cerrar evidencia
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}