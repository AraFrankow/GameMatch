import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { authApi } from './api';
import { socket } from './socket';
import ModalPerfilUsuario from './ModalPerfilUsuario';

export default function Chat({ token, usuario, onVolver, mensajesNoLeidos = {}, setMensajesNoLeidos, setSalaActivaId }) {
  const [salas, setSalas] = useState([]);
  const [salaActiva, setSalaActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const [avisoBloqueo, setAvisoBloqueo] = useState('');
  const [nuevoParticipanteId, setNuevoParticipanteId] = useState('');
  const [modalPerfilId, setModalPerfilId] = useState(null);
  const [modalMiembros, setModalMiembros] = useState(false);

  const mensajesRef = useRef(null);
  const salaActivaRef = useRef(null);

  // Voz (Agora + Socket)
  const [enVoz, setEnVoz] = useState(false);
  const [micActivo, setMicActivo] = useState(true);
  const [errorVoz, setErrorVoz] = useState('');
  const [participantesVoz, setParticipantesVoz] = useState([]);
  const [usuariosEnVozSala, setUsuariosEnVozSala] = useState([]);
  const clienteAgoraRef = useRef(null);
  const trackLocalRef = useRef(null);

  // Sincronizar sala activa con App.jsx y mantener referencia actualizada
  useEffect(() => {
    salaActivaRef.current = salaActiva;
    if (setSalaActivaId) {
      setSalaActivaId(salaActiva ? salaActiva.id : null);
    }
  }, [salaActiva, setSalaActivaId]);

  // Limpieza al salir de la vista Chat
  useEffect(() => {
    return () => {
      if (setSalaActivaId) setSalaActivaId(null);
    };
  }, [setSalaActivaId]);

  // Función para cargar salas y refrescar la sala activa
  const cargarSalas = useCallback(async () => {
    try {
      const data = await authApi.misSalas(token);
      const nuevasSalas = data.salas || [];
      setSalas(nuevasSalas);

      // Si hay una sala activa abierta, actualizar sus datos (ej: nuevos miembros)
      if (salaActivaRef.current) {
        const salaActualizada = nuevasSalas.find(s => Number(s.id) === Number(salaActivaRef.current.id));
        if (salaActualizada) {
          setSalaActiva(salaActualizada);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    cargarSalas();
  }, [cargarSalas]);

  // Escuchadores de Sockets
  useEffect(() => {
    const handleMensajeNuevo = (msg) => {
      const msgSalaId = Number(msg.sala_id);
      const salaActivaId = salaActivaRef.current ? Number(salaActivaRef.current.id) : null;

      if (salaActivaId && msgSalaId === salaActivaId) {
        setMensajes((prev) => [...prev, msg]);
      }
    };

    const handleEstadoVoz = ({ sala_id, usuariosVoz }) => {
      if (salaActivaRef.current && Number(sala_id) === Number(salaActivaRef.current.id)) {
        setUsuariosEnVozSala(usuariosVoz || []);
      }
    };

    const handleMensajeBloqueado = (info) => {
      setAvisoBloqueo(`Tu mensaje fue bloqueado (${info.categoria || 'contenido inapropiado'})`);
      setTimeout(() => setAvisoBloqueo(''), 4000);
    };

    const handleErrorChat = (info) => setError(info.error || 'Error en el chat');

    const handleSalaActualizada = () => {
      cargarSalas();
    };

    socket.on('mensaje_nuevo', handleMensajeNuevo);
    socket.on('estado_voz_actualizado', handleEstadoVoz);
    socket.on('mensaje_bloqueado', handleMensajeBloqueado);
    socket.on('error_chat', handleErrorChat);
    socket.on('sala_actualizada', handleSalaActualizada);

    return () => {
      socket.off('mensaje_nuevo', handleMensajeNuevo);
      socket.off('estado_voz_actualizado', handleEstadoVoz);
      socket.off('mensaje_bloqueado', handleMensajeBloqueado);
      socket.off('error_chat', handleErrorChat);
      socket.off('sala_actualizada', handleSalaActualizada);
    };
  }, [cargarSalas]);

  const entrarASala = async (sala) => {
    setError('');
    setMensajes([]);
    setUsuariosEnVozSala([]);
    setSalaActiva(sala);

    if (setMensajesNoLeidos) {
      setMensajesNoLeidos((prev) => ({ ...prev, [sala.id]: 0 }));
    }

    try {
      const data = await authApi.historialMensajes(token, sala.id);
      setMensajes(data.mensajes || []);
      socket.emit('unirse_sala', { sala_id: sala.id });
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajes]);

  const enviarMensaje = (e) => {
    e.preventDefault();
    if (!texto.trim() || !salaActiva) return;
    socket.emit('enviar_mensaje', { sala_id: salaActiva.id, contenido: texto });
    setTexto('');
  };

  const crearSalaGrupal = async () => {
    setError('');
    try {
      const nombre = prompt('Nombre de la sala grupal:');
      if (!nombre) return;
      await authApi.crearSala(token, { tipo: 'grupal', nombre });
      cargarSalas();
    } catch (err) {
      setError(err.message);
    }
  };

  const invitar = async () => {
    if (!nuevoParticipanteId || !salaActiva) return;
    setError('');
    try {
      await authApi.invitarASala(token, salaActiva.id, Number(nuevoParticipanteId));
      setNuevoParticipanteId('');
      alert('¡Invitación enviada correctamente!');
    } catch (err) {
      setError(err.message);
    }
  };

  const unirseAVoz = async () => {
    setErrorVoz('');
    try {
      const { appId, channel, token: rtcToken, uid } = await authApi.tokenVoz(token, salaActiva.id);
      const cliente = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clienteAgoraRef.current = cliente;

      cliente.on('user-joined', (u) => setParticipantesVoz((prev) => [...new Set([...prev, u.uid])]));
      cliente.on('user-left', (u) => setParticipantesVoz((prev) => prev.filter((id) => id !== u.uid)));
      cliente.on('user-published', async (remoteUser, mediaType) => {
        await cliente.subscribe(remoteUser, mediaType);
        if (mediaType === 'audio') remoteUser.audioTrack?.play();
        setParticipantesVoz((prev) => [...new Set([...prev, remoteUser.uid])]);
      });

      await cliente.join(appId, channel, rtcToken, uid);
      const usuariosPrevios = cliente.remoteUsers.map((u) => u.uid);
      setParticipantesVoz(usuariosPrevios);

      try {
        const trackLocal = await AgoraRTC.createMicrophoneAudioTrack();
        trackLocalRef.current = trackLocal;
        await cliente.publish([trackLocal]);
      } catch (mErr) {
        setErrorVoz('Te uniste a la llamada pero no se pudo habilitar el micrófono.');
      }

      setEnVoz(true);
      setMicActivo(true);
      socket.emit('unirse_voz_socket', { sala_id: salaActiva.id });
    } catch (err) {
      setErrorVoz(err.message || 'No se pudo conectar al canal de voz');
    }
  };

  const salirDeVoz = async () => {
    try {
      trackLocalRef.current?.close();
      await clienteAgoraRef.current?.leave();
    } catch (err) { /* noop */ }
    setEnVoz(false);
    setParticipantesVoz([]);

    if (salaActiva) {
      socket.emit('salir_voz_socket', { sala_id: salaActiva.id });
    }
  };

  const toggleMic = async () => {
    if (!trackLocalRef.current) return;
    const nuevoEstado = !micActivo;
    await trackLocalRef.current.setEnabled(nuevoEstado);
    setMicActivo(nuevoEstado);
  };

  const salirDeGrupo = async () => {
    if (!salaActiva) return;
    if (!confirm(`¿Seguro que querés salir de "${salaActiva.nombre || 'esta sala'}"?`)) return;

    try {
      if (enVoz) await salirDeVoz();

      await authApi.salirDeSala(token, salaActiva.id);
      
      socket.emit('notificar_salida_sala', { sala_id: salaActiva.id });

      setSalaActiva(null);
      setMensajes([]);
      cargarSalas();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => () => { salirDeVoz(); }, []);

  const otroUsuario = salaActiva?.tipo === 'privada'
    ? salaActiva.participantes?.find((p) => (p.usuario_id || p.id) !== usuario.id) ||
      salaActiva.Usuarios?.find((u) => u.id !== usuario.id)
    : null;

  const listaMiembros = salaActiva?.tipo === 'grupal'
    ? (salaActiva.participantes || salaActiva.Usuarios || []).map((p) => ({
        id: p.usuario_id || p.id || p.Usuario?.id,
        username: p.username || p.Usuario?.username || 'Usuario',
        foto_perfil: p.foto_perfil || p.Usuario?.foto_perfil,
      }))
    : [];

  return (
    <div className="h-[calc(100vh-3.8rem)] w-full bg-gm-gradient flex overflow-hidden">
      {/* Lista de salas */}
      <div className="w-64 bg-surface border-r border-white/10 p-3 flex flex-col h-full shrink-0">
        <button onClick={onVolver} className="text-white/50 text-sm hover:text-white mb-3 text-left">← Volver</button>
        <button onClick={crearSalaGrupal} className="bg-primary hover:bg-primary/90 text-white text-sm rounded-lg py-2 mb-3 shrink-0 font-medium">
          + Sala grupal
        </button>
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {salas.map((s) => {
            const otro = s.tipo === 'privada'
              ? s.participantes?.find((p) => (p.usuario_id || p.id) !== usuario.id) || s.Usuarios?.find((u) => u.id !== usuario.id)
              : null;
            const cantidadNoLeidos = mensajesNoLeidos[s.id] || 0;

            return (
              <button
                key={s.id}
                onClick={() => entrarASala(s)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
                  salaActiva?.id === s.id ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <span className="truncate">
                  {s.tipo === 'grupal' ? `${s.nombre || 'Sala grupal'}` : `${otro?.username || 'Chat'}`}
                </span>

                {cantidadNoLeidos > 0 && salaActiva?.id !== s.id && (
                  <span className="bg-repRojo text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2 shrink-0 animate-pulse">
                    {cantidadNoLeidos}
                  </span>
                )}
              </button>
            );
          })}
          {salas.length === 0 && <p className="text-white/30 text-xs px-2">No tenés salas todavía.</p>}
        </div>
      </div>

      {/* Área principal del Chat */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {!salaActiva ? (
          <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
            Elegí una sala de la izquierda
          </div>
        ) : (
          <>
            {/* Encabezado */}
            <div className="bg-card border-b border-white/10 p-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {salaActiva.tipo === 'grupal' ? (
                  <>
                    <button
                      onClick={() => setModalMiembros(true)}
                      className="flex items-center gap-2 hover:opacity-80 transition text-left group"
                      title="Ver miembros del grupo"
                    >
                      <span className="text-white font-medium flex items-center gap-1.5">
                        {salaActiva.nombre || 'Sala grupal'}
                        <span className="text-[11px] text-white/40 font-normal">
                          ({listaMiembros.length} miembros)
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={salirDeGrupo}
                      className="text-repRojo hover:bg-repRojo/10 border border-repRojo/30 text-xs rounded px-2 py-1 transition"
                      title="Salir de la sala"
                    >
                      Salir
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => otroUsuario?.id && setModalPerfilId(otroUsuario.id)}
                    className="flex items-center gap-2 hover:opacity-80 transition text-left group"
                  >
                    <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                      {otroUsuario?.foto_perfil ? (
                        <img src={otroUsuario.foto_perfil} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (otroUsuario?.username?.[0] || 'U').toUpperCase()
                      )}
                    </div>
                    <span className="text-white font-medium flex items-center gap-1.5">
                      {otroUsuario?.username || 'Usuario'}
                    </span>
                  </button>
                )}
              </div>

              {salaActiva.tipo === 'grupal' && (
                <div className="flex gap-2">
                  <input
                    value={nuevoParticipanteId}
                    onChange={(e) => setNuevoParticipanteId(e.target.value)}
                    placeholder="id de usuario"
                    className="bg-surface border border-white/10 rounded px-2 py-1 text-white text-xs w-24 outline-none focus:border-primary"
                  />
                  <button onClick={invitar} className="bg-surface hover:bg-white/10 text-white/80 text-xs rounded px-2 py-1">Invitar</button>
                </div>
              )}

              {/* Controles de Voz */}
              <div className="flex items-center gap-2">
                {usuariosEnVozSala.length > 0 && (
                  <span className="text-repVerde text-xs flex items-center gap-1 font-medium bg-repVerde/10 px-2.5 py-1 rounded-md border border-repVerde/20">
                    <span className="w-2 h-2 rounded-full bg-repVerde animate-pulse" />
                    {usuariosEnVozSala.length} en llamada
                  </span>
                )}

                {!enVoz ? (
                  <button onClick={unirseAVoz} className="bg-repVerde/80 hover:bg-repVerde text-white text-xs rounded-lg px-3 py-1.5 transition">
                    Unirse a la llamada {usuariosEnVozSala.length > 0 ? `(${usuariosEnVozSala.length})` : ''}
                  </button>
                ) : (
                  <>
                    <span className="text-white/50 text-xs">{participantesVoz.length + 1} en voz</span>
                    <button onClick={toggleMic} className="bg-surface hover:bg-white/10 text-white text-xs rounded-lg px-3 py-1.5 transition">
                      {micActivo ? 'Mic ON' : 'Mic OFF'}
                    </button>
                    <button onClick={salirDeVoz} className="bg-repRojo/80 hover:bg-repRojo text-white text-xs rounded-lg px-3 py-1.5 transition">
                      Salir de la llamada
                    </button>
                  </>
                )}
              </div>
            </div>

            {errorVoz && <p className="bg-repRojo/10 text-repRojo text-xs px-3 py-2 shrink-0">{errorVoz}</p>}

            {/* Mensajes */}
            <div ref={mensajesRef} className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
              {mensajes.map((m) => {
                const esMio = (m.emisor?.id || m.emisor_id) === usuario.id;
                return (
                  <div key={m.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs rounded-xl px-3 py-2 text-sm ${esMio ? 'bg-primary text-white' : 'bg-card text-white/90'}`}>
                      {!esMio && <p className="text-xs text-primary/70 mb-0.5">{m.emisor?.username || 'Usuario'}</p>}
                      <p>{m.contenido}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {avisoBloqueo && <p className="bg-repRojo/10 text-repRojo text-xs px-3 py-1.5 text-center shrink-0">{avisoBloqueo}</p>}

            {/* Input de envío */}
            <form onSubmit={enviarMensaje} className="p-3 bg-card border-t border-white/10 flex gap-2 shrink-0">
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              />
              <button type="submit" className="bg-primary hover:bg-primary/90 text-white text-sm px-4 py-2 rounded-lg font-medium transition">
                Enviar
              </button>
            </form>
          </>
        )}
      </div>

      {/* Modal Ver Miembros del Grupo */}
      {modalMiembros && salaActiva && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-white/10 rounded-2xl w-full max-w-sm p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <h3 className="text-white font-semibold text-sm">Miembros de la sala</h3>
              <button onClick={() => setModalMiembros(false)} className="text-white/50 hover:text-white text-xs">✕</button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {listaMiembros.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-surface p-2 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                      {m.foto_perfil ? (
                        <img src={m.foto_perfil} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (m.username?.[0] || 'U').toUpperCase()
                      )}
                    </div>
                    <span className="text-white text-xs font-medium">{m.username} {m.id === usuario.id ? '(Tú)' : ''}</span>
                  </div>
                  {m.id !== usuario.id && (
                    <button
                      onClick={() => {
                        setModalMiembros(false);
                        setModalPerfilId(m.id);
                      }}
                      className="text-[11px] bg-primary/20 hover:bg-primary text-primary hover:text-white px-2 py-1 rounded-lg transition"
                    >
                      Ver perfil
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Perfil de usuario */}
      {modalPerfilId && (
        <ModalPerfilUsuario usuarioId={modalPerfilId} token={token} onClose={() => setModalPerfilId(null)} />
      )}
    </div>
  );
}