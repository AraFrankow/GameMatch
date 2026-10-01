import { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { authApi } from './api';
import Busqueda from './Busqueda';
import Chat from './Chat';
import MiPerfil from './MiPerfil';
import Landing from './Landing';
import { socket } from './socket';

const RANGOS_EDAD = [
  { value: 'menor_18', label: 'Menor de 18' },
  { value: '18_25', label: '18 a 25' },
  { value: '26_35', label: '26 a 35' },
  { value: '36_mas', label: '36 o más' },
];

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function Campo({ label, ...props }) {
  return (
    <label className="block mb-3">
      <span className="block text-sm text-white/60 mb-1">{label}</span>
      <input {...props} className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition" />
    </label>
  );
}

export default function App() {
  const [modo, setModo] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', rango_edad: '18_25' });

  const [sesion, setSesion] = useState(() => {
    const token = localStorage.getItem('gm_token');
    const usuario = localStorage.getItem('gm_usuario');
    const expira = localStorage.getItem('gm_expira');

    if (token && usuario && expira && Date.now() < Number(expira)) {
      try {
        return { token, usuario: JSON.parse(usuario) };
      } catch (e) {}
    }

    localStorage.removeItem('gm_token');
    localStorage.removeItem('gm_usuario');
    localStorage.removeItem('gm_expira');
    return null;
  });

  const [vista, setVista] = useState(sesion ? 'busqueda' : 'landing');
  const [salaActivaId, setSalaActivaId] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [googlePendiente, setGooglePendiente] = useState(null);
  const [rangoGoogle, setRangoGoogle] = useState('18_25');
  const [notificaciones, setNotificaciones] = useState([]);
  
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState({});

  const vistaRef = useRef(vista);
  const salaActivaIdRef = useRef(salaActivaId);
  const sesionRef = useRef(sesion);

  useEffect(() => { vistaRef.current = vista; }, [vista]);
  useEffect(() => { salaActivaIdRef.current = salaActivaId; }, [salaActivaId]);
  useEffect(() => { sesionRef.current = sesion; }, [sesion]);

  const totalMensajesNoLeidos = Object.values(mensajesNoLeidos).reduce((acc, curr) => acc + curr, 0);

  const guardarSesion = (token, usuario) => {
    const DIAS_EXPIRACION = 7;
    const tiempoExpiracion = Date.now() + DIAS_EXPIRACION * 24 * 60 * 60 * 1000;

    localStorage.setItem('gm_token', token);
    localStorage.setItem('gm_usuario', JSON.stringify(usuario));
    localStorage.setItem('gm_expira', tiempoExpiracion.toString());

    setSesion({ token, usuario });
    setVista('busqueda');
  };

  const handleActualizarUsuario = (nuevoUsuario) => {
    setSesion((prev) => {
      if (!prev) return null;
      const actualizada = { ...prev, usuario: { ...prev.usuario, ...nuevoUsuario } };
      localStorage.setItem('gm_usuario', JSON.stringify(actualizada.usuario));
      return actualizada;
    });
  };

  useEffect(() => {
    if (sesion?.token) {
      authApi.misInvitaciones(sesion.token)
        .then((data) => setNotificaciones(data.invitaciones || []))
        .catch(() => {});

      socket.disconnect();
      socket.auth = { token: sesion.token };
      socket.connect();

      const handleInvitacion = (data) => {
        setNotificaciones((prev) => [data, ...prev.filter((n) => n.id !== data.id)]);
      };

      const handleMensajeNuevo = (msg) => {
        const emisorId = msg.emisor_id || msg.emisor?.id;
        const miId = sesionRef.current?.usuario?.id;

        if (emisorId === miId) return;

        const msgSalaId = Number(msg.sala_id);

        if (vistaRef.current === 'chat' && salaActivaIdRef.current === msgSalaId) {
          return;
        }

        setMensajesNoLeidos((prev) => ({
          ...prev,
          [msgSalaId]: (prev[msgSalaId] || 0) + 1,
        }));
      };

      socket.on('notificacion:invitacion', handleInvitacion);
      socket.on('mensaje_nuevo', handleMensajeNuevo);

      return () => {
        socket.off('notificacion:invitacion', handleInvitacion);
        socket.off('mensaje_nuevo', handleMensajeNuevo);
        socket.disconnect();
      };
    }
  }, [sesion]);

  const aceptarInvitacion = async (notificacion) => {
    if (!sesion?.token || !sesion?.usuario) return;
    try {
      await authApi.unirseASala(sesion.token, notificacion.sala_id);
      socket.emit('notificar_union_sala', { 
        sala_id: notificacion.sala_id,
        usuario_id: sesion.usuario.id 
      });
      setNotificaciones((prev) => prev.filter((n) => n.id !== notificacion.id));
      setVista('chat');
    } catch (err) {
      console.error('Error al aceptar invitación:', err);
      alert(err.message || 'No se pudo unirse a la sala');
    }
  };

  const rechazarInvitacion = async (notif) => {
    try {
      if (authApi.rechazarInvitacion && sesion?.token) {
        await authApi.rechazarInvitacion(sesion.token, notif.id);
      }
      setNotificaciones((prev) => prev.filter((n) => n.id !== notif.id));
    } catch (err) {
      setNotificaciones((prev) => prev.filter((n) => n.id !== notif.id));
    }
  };

  const actualizarCampo = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const data = modo === 'registro' ? await authApi.registro(form) : await authApi.login({ email: form.email, password: form.password });
      guardarSesion(data.token, data.usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      const data = await authApi.google({ id_token: credentialResponse.credential });
      guardarSesion(data.token, data.usuario);
    } catch (err) {
      if (err.message.includes('rango_edad')) setGooglePendiente(credentialResponse.credential);
      else setError(err.message);
    }
  };

  const completarGoogleConEdad = async () => {
    setError('');
    setCargando(true);
    try {
      const data = await authApi.google({ id_token: googlePendiente, rango_edad: rangoGoogle });
      guardarSesion(data.token, data.usuario);
      setGooglePendiente(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    socket.disconnect();
    setSesion(null);
    setVista('landing');
    setSalaActivaId(null);
    setNotificaciones([]);
    setMensajesNoLeidos({});
    setForm({ username: '', email: '', password: '', rango_edad: '18_25' });
    localStorage.removeItem('gm_token');
    localStorage.removeItem('gm_usuario');
    localStorage.removeItem('gm_expira');
  };

  if (!sesion) {
    if (vista === 'landing') {
      return (
        <Landing
          onNavigateToLogin={() => { setModo('login'); setVista('auth'); }}
          onNavigateToRegister={() => { setModo('registro'); setVista('auth'); }}
        />
      );
    }

    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="min-h-screen bg-gm-gradient flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <button
              onClick={() => setVista('landing')}
              className="text-white/60 hover:text-white text-xs mb-4 flex items-center gap-1 transition"
            >
              ← Volver al inicio
            </button>
            <h1 className="text-2xl font-bold text-white text-center mb-1">GameMatch</h1>
            <p className="text-white/50 text-center text-sm mb-6">Ingresá a tu cuenta para jugar</p>

            <div className="bg-card border border-white/10 rounded-2xl p-6 shadow-xl">
              {googlePendiente ? (
                <div>
                  <p className="text-white text-sm mb-4">Es tu primera vez con esta cuenta de Google. Elegí tu rango de edad para terminar de crear tu cuenta.</p>
                  <label className="block mb-4">
                    <span className="block text-sm text-white/60 mb-1">Rango de edad</span>
                    <select value={rangoGoogle} onChange={(e) => setRangoGoogle(e.target.value)} className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white">
                      {RANGOS_EDAD.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </label>
                  <button onClick={completarGoogleConEdad} disabled={cargando} className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-lg py-2 transition disabled:opacity-50">
                    {cargando ? 'Creando cuenta...' : 'Continuar'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex mb-5 bg-surface rounded-lg p-1">
                    <button onClick={() => { setModo('login'); setError(''); }} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${modo === 'login' ? 'bg-primary text-white' : 'text-white/50'}`}>Iniciar sesión</button>
                    <button onClick={() => { setModo('registro'); setError(''); }} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${modo === 'registro' ? 'bg-primary text-white' : 'text-white/50'}`}>Registrarme</button>
                  </div>

                  <form onSubmit={handleSubmit}>
                    {modo === 'registro' && <Campo label="Nombre de usuario" name="username" value={form.username} onChange={actualizarCampo} required />}
                    <Campo label="Email" type="email" name="email" value={form.email} onChange={actualizarCampo} required />
                    <Campo label="Contraseña" type="password" name="password" value={form.password} onChange={actualizarCampo} required />
                    {modo === 'registro' && (
                      <label className="block mb-4">
                        <span className="block text-sm text-white/60 mb-1">Rango de edad</span>
                        <select name="rango_edad" value={form.rango_edad} onChange={actualizarCampo} className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white">
                          {RANGOS_EDAD.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      </label>
                    )}
                    {error && <p className="text-repRojo text-sm mb-3 bg-repRojo/10 rounded-lg px-3 py-2">{error}</p>}
                    <button type="submit" disabled={cargando} className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-lg py-2 transition disabled:opacity-50 mb-4">
                      {cargando ? 'Cargando...' : modo === 'registro' ? 'Crear cuenta' : 'Entrar'}
                    </button>
                  </form>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px bg-white/10 flex-1" />
                    <span className="text-white/40 text-xs">o continuar con</span>
                    <div className="h-px bg-white/10 flex-1" />
                  </div>

                  <div className="flex justify-center">
                    {GOOGLE_CLIENT_ID ? (
                      <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('No se pudo iniciar sesión con Google')} theme="filled_black" shape="pill" />
                    ) : (
                      <p className="text-white/40 text-xs text-center">Falta VITE_GOOGLE_CLIENT_ID en el .env</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </GoogleOAuthProvider>
    );
  }

  // --- RENDERIZADO SI EL USUARIO SÍ TIENE SESIÓN ---
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-gm-gradient flex flex-col">
        <header className="bg-card/80 backdrop-blur border-b border-white/10 px-4 py-2.5 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <span className="text-white font-bold text-lg cursor-pointer" onClick={() => setVista('busqueda')}>GameMatch</span>
            <div className="flex gap-2">
              <button onClick={() => setVista('busqueda')} className={`text-xs px-3 py-1.5 rounded-lg transition ${vista === 'busqueda' ? 'bg-primary text-white' : 'text-white/60 hover:text-white'}`}>Buscar</button>
              <button onClick={() => setVista('chat')} className={`text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${vista === 'chat' ? 'bg-primary text-white' : 'text-white/60 hover:text-white'}`}>
                Chat
                {totalMensajesNoLeidos > 0 && (
                  <span className="bg-repRojo text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                    {totalMensajesNoLeidos}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setVista('perfil')}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-xl transition ${
                vista === 'perfil' ? 'bg-primary/20 border border-primary/50 text-white' : 'hover:bg-white/5 text-white/80'
              }`}
              title="Mi perfil"
            >
              <div className="w-6 h-6 rounded-full bg-surface border border-white/20 flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0">
                {sesion.usuario?.foto_perfil ? (
                  <img src={sesion.usuario.foto_perfil} alt="" className="w-full h-full object-cover" />
                ) : (
                  (sesion.usuario?.username?.[0] || 'U').toUpperCase()
                )}
              </div>
              <span className="text-xs font-medium hidden sm:inline">{sesion.usuario?.username}</span>
            </button>

            <Campanita notificaciones={notificaciones} onAceptar={aceptarInvitacion} onRechazar={rechazarInvitacion} />
            <button onClick={cerrarSesion} className="text-xs bg-surface hover:bg-white/10 text-white/70 px-3 py-1.5 rounded-lg transition">Salir</button>
          </div>
        </header>

        <main className="flex-1">
          {vista === 'busqueda' ? (
            <Busqueda token={sesion.token} usuario={sesion.usuario} onVolver={() => setVista('busqueda')} />
          ) : vista === 'chat' ? (
            <Chat 
              token={sesion.token} 
              usuario={sesion.usuario} 
              onVolver={() => setVista('busqueda')}
              mensajesNoLeidos={mensajesNoLeidos}
              setMensajesNoLeidos={setMensajesNoLeidos}
              setSalaActivaId={setSalaActivaId}
            />
          ) : vista === 'perfil' ? (
            <MiPerfil
              token={sesion.token}
              usuario={sesion.usuario}
              onActualizarUsuario={handleActualizarUsuario}
              onVolver={() => setVista('busqueda')}
            />
          ) : null}
        </main>
      </div>
    </GoogleOAuthProvider>
  );
}

function Campanita({ notificaciones, onAceptar, onRechazar }) {
  const [abierto, setAbierto] = useState(false);
  const sinLeer = notificaciones.length;

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        className="relative p-2 bg-surface hover:bg-white/10 rounded-full transition text-base text-white flex items-center justify-center"
        title="Notificaciones"
      >
        🔔
        {sinLeer > 0 && (
          <span className="absolute -top-1 -right-1 bg-repRojo text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-card">
            {sinLeer}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-72 bg-card border border-white/10 rounded-2xl shadow-2xl p-3 z-50">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="text-white text-xs font-semibold">Notificaciones</span>
            <span className="text-white/40 text-[10px]">{sinLeer} pendientes</span>
          </div>

          {notificaciones.length === 0 ? (
            <p className="text-white/40 text-xs text-center py-4">Sin notificaciones pendientes</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notificaciones.map((n) => (
                <div key={n.id || n.sala_id} className="bg-surface border border-white/5 p-2 rounded-xl text-xs text-white">
                  <p className="font-medium text-white text-[11px] mb-0.5">Invitación a sala</p>
                  <p className="text-white/70 text-[11px] mb-2">
                    <span className="text-primary font-bold">{n.invitado_por}</span> te invitó a la sala <span className="text-white font-semibold">"{n.nombre_sala}"</span>.
                  </p>
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => onRechazar(n)}
                      className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white/80 rounded text-[10px] transition"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={() => { onAceptar(n); setAbierto(false); }}
                      className="px-2 py-0.5 bg-primary hover:bg-primary/90 text-white font-medium rounded text-[10px] transition"
                    >
                      Unirme
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}