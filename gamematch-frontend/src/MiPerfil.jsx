import { useState, useEffect } from 'react';
import { authApi } from './api';

const RANGOS_EDAD = [
  { value: 'menor_18', label: 'Menor de 18' },
  { value: '18_25', label: '18 a 25' },
  { value: '26_35', label: '26 a 35' },
  { value: '36_mas', label: '36 o más' },
];

export default function MiPerfil({ token, usuario, onActualizarUsuario, onVolver }) {
  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [tipoFoto, setTipoFoto] = useState('url');

  // Estados de formularios e interfaces de vinculación
  const [mostrarRiotInput, setMostrarRiotInput] = useState(false);
  const [riotForm, setRiotForm] = useState({ game_name: '', tag_line: '', region: 'las' });

  const [mostrarSteamInput, setMostrarSteamInput] = useState(false);
  const [steamIdInput, setSteamIdInput] = useState('');

  const [cargandoIntegracion, setCargandoIntegracion] = useState(false);
  const [errorIntegracion, setErrorIntegracion] = useState('');

  // Estado proveniente de la API (estructura perfil.steam, perfil.riot, perfil.juegos)
  const [datosRiot, setDatosRiot] = useState(null);
  const [datosSteam, setDatosSteam] = useState(null);
  const [juegosLista, setJuegosLista] = useState([]);

  const [form, setForm] = useState({
    username: usuario?.username || '',
    foto_perfil: usuario?.foto_perfil || '',
    rango_edad: usuario?.rango_edad || '18_25',
    biografia: usuario?.biografia || '',
  });

  // Cargar perfil e integraciones desde el backend
  const cargarPerfil = () => {
    authApi.obtenerMiPerfil(token)
      .then((data) => {        
        const p = data.perfil || data.usuario || data;
        
        const juegosHallados = 
          data.juegos || 
          p.juegos || 
          p.usuario_juegos || 
          p.steam?.juegos || 
          [];

        console.log('Juegos encontrados:', juegosHallados);

        setDatosSteam(p.steam || null);
        setDatosRiot(p.riot || null);
        setJuegosLista(juegosHallados);

        setForm({
          username: p.username || '',
          foto_perfil: p.foto_perfil || '',
          rango_edad: p.rango_edad || '18_25',
          biografia: p.biografia || '',
        });

        if (onActualizarUsuario) onActualizarUsuario(p);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Seleccioná una de menos de 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, foto_perfil: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setCargando(true);

    try {
      const res = await authApi.actualizarMiPerfil(token, form);
      const perfilActualizado = res.perfil || res;
      
      setExito('¡Perfil actualizado con éxito!');
      setEditando(false);

      if (onActualizarUsuario) {
        onActualizarUsuario(perfilActualizado);
      }
    } catch (err) {
      setError(err.message || 'Error al guardar los cambios');
    } finally {
      setCargando(false);
    }
  };

  //Vincular Riot Games
  const handleVincularRiot = async (e) => {
    e.preventDefault();
    setErrorIntegracion('');
    setCargandoIntegracion(true);
    try {
      const res = await authApi.vincularRiot(token, riotForm);
      setDatosRiot(res.integracion);
      setMostrarRiotInput(false);
      setRiotForm({ game_name: '', tag_line: '', region: 'las' });
      setExito('¡Cuenta de Riot Games vinculada!');
    } catch (err) {
      setErrorIntegracion(err.message || 'Error al vincular cuenta de Riot');
    } finally {
      setCargandoIntegracion(false);
    }
  };

  // Vincular Steam
  const handleVincularSteam = async (e) => {
    e.preventDefault();
    setErrorIntegracion('');
    setCargandoIntegracion(true);
    try {
      const res = await authApi.vincularSteam(token, steamIdInput);
      setDatosSteam(res.integracion);
      setMostrarSteamInput(false);
      setSteamIdInput('');
      
      const imp = res.importacion?.importados || 0;
      setExito(`¡Cuenta de Steam vinculada! Se importaron ${imp} juegos al catálogo.`);
      
      cargarPerfil();
    } catch (err) {
      setErrorIntegracion(err.message || 'Error al vincular cuenta de Steam');
    } finally {
      setCargandoIntegracion(false);
    }
  };

  // Desvincular integraciones
  const handleDesvincular = async (plataforma) => {
    if (!window.confirm(`¿Seguro que querés desvincular tu cuenta de ${plataforma}?`)) return;
    setErrorIntegracion('');
    try {
      await authApi.desvincularIntegracion(token, plataforma);
      if (plataforma === 'riot') setDatosRiot(null);
      if (plataforma === 'steam') {
        setDatosSteam(null);
        cargarPerfil();
      }
      setExito(`¡Cuenta de ${plataforma} desvinculada con éxito!`);
    } catch (err) {
      setErrorIntegracion(err.message || 'Error al desvincular cuenta');
    }
  };

  const rangoTexto = RANGOS_EDAD.find((r) => r.value === form.rango_edad)?.label || form.rango_edad;
  const esMayorDeEdad = form.rango_edad && form.rango_edad !== 'menor_18';

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <button
        onClick={onVolver}
        className="text-white/60 hover:text-white text-xs mb-4 flex items-center gap-1 transition"
      >
        ← Volver
      </button>

      <div className="bg-card border border-white/10 rounded-2xl p-6 shadow-xl">
        {/* Cabecera del Perfil */}
        <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-white/10 pb-6 mb-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-surface border-2 border-primary/50 overflow-hidden flex items-center justify-center text-3xl font-bold text-white shadow-lg">
              {form.foto_perfil ? (
                <img src={form.foto_perfil} alt={form.username} className="w-full h-full object-cover" />
              ) : (
                (form.username?.[0] || 'U').toUpperCase()
              )}
            </div>
          </div>

          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              {form.username}
            </h2>
            <p className="text-white/50 text-xs mt-1">{usuario?.email}</p>
            <span className="inline-block mt-2 bg-primary/20 text-primary border border-primary/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              {rangoTexto}
            </span>
          </div>

          {!editando && (
            <button
              onClick={() => { setEditando(true); setExito(''); setError(''); }}
              className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-md"
            >
              Editar perfil
            </button>
          )}
        </div>

        {/* Mensajes de Estado */}
        {error && <p className="bg-repRojo/10 text-repRojo text-xs p-3 rounded-xl mb-4">{error}</p>}
        {exito && <p className="bg-repVerde/10 text-repVerde text-xs p-3 rounded-xl mb-4">{exito}</p>}

        {!editando ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs uppercase text-white/40 font-semibold mb-1">Sobre mí</h3>
              <p className="text-white/80 text-sm bg-surface/50 p-3 rounded-xl border border-white/5 min-h-[60px]">
                {form.biografia || 'Sin descripción por el momento.'}
              </p>
            </div>

            {/* CUENTAS VINCULADAS */}
            <div>
              <h3 className="text-xs uppercase text-white/40 font-semibold mb-2">Cuentas Vinculadas</h3>
              
              {errorIntegracion && (
                <p className="bg-repRojo/10 text-repRojo text-xs p-2.5 rounded-xl mb-3">{errorIntegracion}</p>
              )}

              <div className="space-y-3">
                {/* RIOT GAMES */}
                <div className="bg-surface/50 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs">
                        Riot
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">Riot Games</p>
                        <p className="text-[11px] text-white/40">
                          {datosRiot ? `${datosRiot.riot_username} (${datosRiot.region?.toUpperCase()})` : 'No vinculada'}
                        </p>
                      </div>
                    </div>

                    {!datosRiot ? (
                      <button
                        onClick={() => setMostrarRiotInput(!mostrarRiotInput)}
                        className="text-xs bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg transition"
                      >
                        {mostrarRiotInput ? 'Cancelar' : 'Vincular'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDesvincular('riot')}
                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1 rounded-lg transition"
                      >
                        Desvincular
                      </button>
                    )}
                  </div>

                  {mostrarRiotInput && !datosRiot && (
                    <form onSubmit={handleVincularRiot} className="pt-2 border-t border-white/5 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nombre (ej: Faker)"
                          value={riotForm.game_name}
                          onChange={(e) => setRiotForm({ ...riotForm, game_name: e.target.value })}
                          className="flex-1 bg-surface border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary"
                          required
                        />
                        <input
                          type="text"
                          placeholder="#Tag (ej: KR1)"
                          value={riotForm.tag_line}
                          onChange={(e) => setRiotForm({ ...riotForm, tag_line: e.target.value })}
                          className="w-24 bg-surface border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary"
                          required
                        />
                        <select
                          value={riotForm.region}
                          onChange={(e) => setRiotForm({ ...riotForm, region: e.target.value })}
                          className="bg-surface border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-primary"
                        >
                          <option value="las">LAS</option>
                          <option value="lan">LAN</option>
                          <option value="br1">BR</option>
                          <option value="na1">NA</option>
                          <option value="euw1">EUW</option>
                          <option value="kr">KR</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={cargandoIntegracion}
                        className="w-full bg-primary hover:bg-primary/90 text-white text-xs py-1.5 rounded-lg font-medium transition disabled:opacity-50"
                      >
                        {cargandoIntegracion ? 'Verificando...' : 'Guardar Riot ID'}
                      </button>
                    </form>
                  )}

                  {/* Detalle Rango de Riot */}
                  {datosRiot && (
                    <div className="pt-2 border-t border-white/5 bg-black/20 p-2.5 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-yellow-400 font-bold">Rango del LoL:</span>
                      <span className="text-white font-medium">
                        {datosRiot.rango_lol || 'Sin Clasificar / Unranked'}
                      </span>
                    </div>
                  )}
                </div>

                {/*STEAM */}
                <div className="bg-surface/50 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        Steam
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">Steam</p>
                        <p className="text-[11px] text-white/40">
                          {datosSteam ? `ID: ${datosSteam.steam_id}` : 'No vinculada'}
                        </p>
                      </div>
                    </div>

                    {!datosSteam ? (
                      <button
                        onClick={() => setMostrarSteamInput(!mostrarSteamInput)}
                        className="text-xs bg-surface hover:bg-white/10 text-white border border-white/10 px-3 py-1.5 rounded-lg transition"
                      >
                        {mostrarSteamInput ? 'Cancelar' : 'Vincular'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDesvincular('steam')}
                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1 rounded-lg transition"
                      >
                        Desvincular
                      </button>
                    )}
                  </div>

                  {mostrarSteamInput && !datosSteam && (
                    <form onSubmit={handleVincularSteam} className="pt-2 border-t border-white/5 space-y-2">
                      <input
                        type="text"
                        placeholder="SteamID64 (ej: 76561198860923712)"
                        value={steamIdInput}
                        onChange={(e) => setSteamIdInput(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary"
                        required
                      />
                      <button
                        type="submit"
                        disabled={cargandoIntegracion}
                        className="w-full bg-primary hover:bg-primary/90 text-white text-xs py-1.5 rounded-lg font-medium transition disabled:opacity-50"
                      >
                        {cargandoIntegracion ? 'Importando juegos...' : 'Vincular SteamID'}
                      </button>
                    </form>
                  )}

                  {/* Juegos Importados de Steam */}
                  {datosSteam && (
                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      <p className="text-[11px] font-semibold text-white/50">
                        Juegos vinculados en tu catálogo ({juegosLista?.length || 0}):
                      </p>

                      {juegosLista && juegosLista.length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                          {juegosLista.map((juego, index) => {
                            const horas = juego.horas_steam ?? (juego.playtime_forever ? Math.round(juego.playtime_forever / 60) : 0);
                            
                            return (
                              <div
                                key={juego.id || juego.appid || index}
                                className="bg-black/40 border border-white/10 hover:border-white/20 text-white/90 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-all group"
                              >
                                {/* Imagen / Miniatura del juego */}
                                {juego.imagen_url ? (
                                  <img
                                    src={juego.imagen_url}
                                    alt={juego.nombre || juego.name}
                                    className="w-5 h-5 rounded object-cover bg-white/5"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : (
                                  <span className="text-xs">🎮</span>
                                )}

                                {/* Nombre del juego */}
                                <span className="font-medium">{juego.nombre || juego.name}</span>

                                {/* Horas jugadas */}
                                {horas > 0 && (
                                  <span className="text-primary font-bold text-[11px] bg-primary/10 px-1.5 py-0.5 rounded">
                                    {horas} hs
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-400/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                          No se detectaron juegos. Asegurate de que los <b>"Detalles de los juegos"</b> estén en <b>Público</b> en la privacidad de tu perfil de Steam.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGuardar} className="space-y-4">
            <div>
              <label className="block text-xs text-white/60 mb-1 font-medium">Nombre de usuario</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-2 font-medium">Foto de perfil</label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setTipoFoto('url')}
                  className={`text-xs px-3 py-1 rounded-lg transition ${
                    tipoFoto === 'url' ? 'bg-primary text-white font-semibold' : 'bg-surface text-white/50 hover:text-white'
                  }`}
                >
                  Pegar URL
                </button>
                <button
                  type="button"
                  onClick={() => setTipoFoto('archivo')}
                  className={`text-xs px-3 py-1 rounded-lg transition ${
                    tipoFoto === 'archivo' ? 'bg-primary text-white font-semibold' : 'bg-surface text-white/50 hover:text-white'
                  }`}
                >
                  Subir foto desde el PC
                </button>
              </div>

              {tipoFoto === 'url' ? (
                <input
                  type="url"
                  name="foto_perfil"
                  placeholder="https://ejemplo.com/mi-avatar.jpg"
                  value={form.foto_perfil}
                  onChange={handleChange}
                  className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-primary transition"
                />
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80 transition cursor-pointer"
                />
              )}
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1 font-medium">Rango de edad</label>
              <select
                name="rango_edad"
                value={form.rango_edad}
                onChange={handleChange}
                className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-primary transition"
              >
                {RANGOS_EDAD.map((r) => {
                  const opcionBloqueada = esMayorDeEdad && r.value === 'menor_18';
                  return (
                    <option key={r.value} value={r.value} disabled={opcionBloqueada}>
                      {r.label} {opcionBloqueada ? '(No permitido)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1 font-medium">Biografía / Presentación</label>
              <textarea
                name="biografia"
                rows="3"
                value={form.biografia}
                onChange={handleChange}
                placeholder="¡Contanos qué juegos te gustan o cuándo jugas!"
                className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-primary transition resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="bg-surface hover:bg-white/10 text-white/70 text-xs px-4 py-2 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando}
                className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-5 py-2 rounded-xl transition disabled:opacity-50"
              >
                {cargando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}