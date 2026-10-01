import { useState, useEffect } from 'react';
import { authApi } from './api';
import ModalPerfilUsuario from './ModalPerfilUsuario';

const MODOS = [
  { value: '', label: 'Cualquiera' }, { value: 'competitivo', label: 'Competitivo' },
  { value: 'casual', label: 'Casual' }, { value: 'ambos', label: 'Ambos' },
];
const RANGOS = [
  { value: '', label: 'Cualquiera' }, { value: 'menor_18', label: 'Menor de 18' },
  { value: '18_25', label: '18 a 25' }, { value: '26_35', label: '26 a 35' }, { value: '36_mas', label: '36 o más' },
];
const PLATAFORMAS = [
  { value: '', label: 'Cualquiera' }, { value: 'pc', label: 'PC' }, { value: 'consola', label: 'Consola' }, { value: 'mobile', label: 'Mobile' },
];
const MOTIVOS = [
  { value: 'lenguaje_inapropiado', label: 'Lenguaje inapropiado' }, { value: 'acoso', label: 'Acoso' },
  { value: 'spam', label: 'Spam' }, { value: 'otro', label: 'Otro' },
];
const ESTADO_COLOR = { disponible: 'bg-repVerde', ocupado: 'bg-repAmarillo', en_partida: 'bg-repRojo' };
const ESTADO_LABEL = { disponible: 'Disponible', ocupado: 'Ocupado', en_partida: 'En partida' };

function Select({ label, ...props }) {
  return (
    <label className="block">
      <span className="block text-xs text-white/50 mb-1">{label}</span>
      <select {...props} className="w-full bg-surface border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm">{props.children}</select>
    </label>
  );
}

export default function Busqueda({ token, usuario, onVolver, onIrAlChat }) {
  const [juegosCatalogo, setJuegosCatalogo] = useState([]);
  const [filtros, setFiltros] = useState({ juego_id: '', modo_juego: '', rango_edad: '', usa_microfono: '', plataforma: '' });
  const [resultados, setResultados] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarBloqueados, setMostrarBloqueados] = useState(false);

  useEffect(() => { authApi.juegos(token).then((d) => setJuegosCatalogo(d.juegos)).catch(() => {}); }, [token]);
  const actualizarFiltro = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

  const buscar = async () => {
    setCargando(true); setError('');
    try { setResultados((await authApi.buscar(token, filtros)).resultados); }
    catch (err) { setError(err.message); } finally { setCargando(false); }
  };
  useEffect(() => { buscar(); }, []);

  const handleBloqueado = (id) => setResultados((prev) => prev.filter((u) => u.id !== id));
  if (mostrarBloqueados) return <MisBloqueados token={token} onVolver={() => setMostrarBloqueados(false)} />;

  return (
    <div className="min-h-screen bg-gm-gradient p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Buscar jugadores</h1>
          <div className="flex gap-3">
            <button onClick={() => setMostrarBloqueados(true)} className="text-white/50 text-sm hover:text-white">Bloqueados</button>
          </div>
        </div>

        <div className="bg-card border border-white/10 rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <Select label="Juego" name="juego_id" value={filtros.juego_id} onChange={actualizarFiltro}>
              <option value="">Cualquiera</option>
              {juegosCatalogo.map((j) => <option key={j.id} value={j.id}>{j.nombre}</option>)}
            </Select>
            <Select label="Modo" name="modo_juego" value={filtros.modo_juego} onChange={actualizarFiltro}>{MODOS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</Select>
            <Select label="Rango de edad" name="rango_edad" value={filtros.rango_edad} onChange={actualizarFiltro}>{RANGOS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select>
            <Select label="Plataforma" name="plataforma" value={filtros.plataforma} onChange={actualizarFiltro}>{PLATAFORMAS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select>
            <Select label="Micrófono" name="usa_microfono" value={filtros.usa_microfono} onChange={actualizarFiltro}>
              <option value="">Cualquiera</option><option value="true">Con mic</option><option value="false">Sin mic</option>
            </Select>
          </div>
          {!usuario.es_premium && <p className="text-premium/70 text-xs mb-3">⭐ Con premium podés filtrar por verificados, reputación mínima y rol.</p>}
          <button onClick={buscar} disabled={cargando} className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-lg py-2 text-sm transition disabled:opacity-50">
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {error && <p className="text-repRojo text-sm mb-3 bg-repRojo/10 rounded-lg px-3 py-2">{error}</p>}
        <div className="space-y-2">
          {resultados && resultados.length === 0 && <p className="text-white/40 text-sm text-center py-8">No se encontraron jugadores con esos filtros.</p>}
          {resultados && resultados.map((u) => (
            <CardUsuario
              key={u.id}
              usuario={u}
              usuarioActual={usuario}
              token={token}
              onBloqueado={handleBloqueado}
              onIrAlChat={onIrAlChat}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CardUsuario({ usuario, usuarioActual, token, onBloqueado, onIrAlChat }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [formReporte, setFormReporte] = useState(false);
  const [verPerfil, setVerPerfil] = useState(false);
  const [motivo, setMotivo] = useState('lenguaje_inapropiado');
  const [comentario, setComentario] = useState('');
  const [estadoAccion, setEstadoAccion] = useState('');
  const [cargando, setCargando] = useState(false);

  const iniciarChatPrivado = async () => {
    setCargando(true);
    try {
      const res = await authApi.crearSala(token, {
        tipo: 'privada',
        participante_id: usuario.id,
      });
      if (onIrAlChat) {
        onIrAlChat(res.sala);
      } else {
        alert('Chat creado. Podés ingresar desde la pestaña de Chat.');
      }
    } catch (err) {
      setEstadoAccion('error');
    } finally {
      setCargando(false);
    }
  };

  const bloquear = async () => {
    setCargando(true);
    try { await authApi.bloquear(token, usuario.id); onBloqueado(usuario.id); }
    catch (err) { setEstadoAccion('error'); } finally { setCargando(false); }
  };

  const enviarReporte = async () => {
    setCargando(true);
    try {
      await authApi.reportar(token, { reportado_id: usuario.id, motivo, comentario: comentario || undefined });
      setEstadoAccion('ok_reporte'); setFormReporte(false); setMenuAbierto(false);
    } catch (err) { setEstadoAccion('error'); } finally { setCargando(false); }
  };

  return (
    <div className="bg-card border border-white/10 rounded-xl p-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-surface flex items-center justify-center text-white/40 text-lg overflow-hidden shrink-0 cursor-pointer" onClick={() => setVerPerfil(true)}>
          {usuario.foto_perfil ? <img src={usuario.foto_perfil} alt="" className="w-full h-full object-cover" /> : usuario.username[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium truncate cursor-pointer hover:underline" onClick={() => setVerPerfil(true)}>{usuario.username}</span>
            {usuario.es_premium && <span className="text-premium text-xs">⭐</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${ESTADO_COLOR[usuario.estado]}`} />
            <span className="text-white/50 text-xs">{ESTADO_LABEL[usuario.estado]}</span>
            {usuario.reputacion_porcentaje !== null && <span className="text-white/40 text-xs">· {usuario.reputacion_porcentaje}% rep</span>}
          </div>
          {usuario.juegos.length > 0 && <p className="text-white/40 text-xs mt-1 truncate">{usuario.juegos.map((j) => j.nombre).join(', ')}</p>}
          <p className="text-white/30 text-xs mt-0.5">id: {usuario.id}</p>
        </div>
        <div className="flex gap-1 shrink-0">{usuario.plataformas.map((p) => <span key={p} className="text-[10px] bg-surface text-white/50 px-1.5 py-0.5 rounded">{p}</span>)}</div>
        <button onClick={() => setMenuAbierto(!menuAbierto)} className="text-white/30 hover:text-white/70 text-lg leading-none px-1 shrink-0">⋮</button>
      </div>

      {menuAbierto && !formReporte && (
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
          <button onClick={iniciarChatPrivado} disabled={cargando} className="bg-primary hover:bg-primary/90 text-white text-xs rounded-lg py-1.5 transition disabled:opacity-50">
            Hablar
          </button>
          <button onClick={() => setVerPerfil(true)} className="bg-surface hover:bg-white/10 text-white/80 text-xs rounded-lg py-1.5 transition">
            Ver perfil
          </button>
          <button onClick={bloquear} disabled={cargando} className="bg-surface hover:bg-white/10 text-white/80 text-xs rounded-lg py-1.5 transition disabled:opacity-50">
            Bloquear
          </button>
          <button onClick={() => setFormReporte(true)} className="bg-surface hover:bg-white/10 text-white/80 text-xs rounded-lg py-1.5 transition">
            Reportar
          </button>
        </div>
      )}

      {formReporte && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full bg-surface border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs">
            {MOTIVOS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <input value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Comentario (opcional)" className="w-full bg-surface border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs" />
          <div className="flex gap-2">
            <button onClick={enviarReporte} disabled={cargando} className="flex-1 bg-repRojo/80 hover:bg-repRojo text-white text-xs rounded-lg py-1.5 transition disabled:opacity-50">Enviar reporte</button>
            <button onClick={() => setFormReporte(false)} className="flex-1 bg-surface hover:bg-white/10 text-white/70 text-xs rounded-lg py-1.5 transition">Cancelar</button>
          </div>
        </div>
      )}

      {estadoAccion === 'ok_reporte' && <p className="text-repVerde text-xs mt-2">Reporte enviado</p>}
      {estadoAccion === 'error' && <p className="text-repRojo text-xs mt-2">Hubo un error, intentá de nuevo</p>}

      {verPerfil && (
        <ModalPerfilUsuario
          token={token}
          usuarioId={usuario.id}
          usuarioActual={usuarioActual}
          onClose={() => setVerPerfil(false)}
          onIrAlChat={onIrAlChat}
        />
      )}
    </div>
  );
}

function MisBloqueados({ token, onVolver }) {
  const [bloqueados, setBloqueados] = useState(null);
  const [error, setError] = useState('');
  const cargar = async () => { try { setBloqueados((await authApi.listarBloqueos(token)).bloqueos); } catch (err) { setError(err.message); } };
  useEffect(() => { cargar(); }, []);
  const desbloquear = async (id) => {
    try { await authApi.desbloquear(token, id); setBloqueados((prev) => prev.filter((b) => b.bloqueado.id !== id)); }
    catch (err) { setError(err.message); }
  };
  return (
    <div className="min-h-screen bg-gm-gradient p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Bloqueados</h1>
          <button onClick={onVolver} className="text-white/50 text-sm hover:text-white">← Volver a buscar</button>
        </div>
        {error && <p className="text-repRojo text-sm mb-3 bg-repRojo/10 rounded-lg px-3 py-2">{error}</p>}
        {bloqueados && bloqueados.length === 0 && <p className="text-white/40 text-sm text-center py-8">No bloqueaste a nadie todavía.</p>}
        <div className="space-y-2">
          {bloqueados && bloqueados.map((b) => (
            <div key={b.id} className="bg-card border border-white/10 rounded-xl p-3 flex items-center justify-between">
              <span className="text-white text-sm">{b.bloqueado.username}</span>
              <button onClick={() => desbloquear(b.bloqueado.id)} className="text-primary text-xs hover:underline">Desbloquear</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}