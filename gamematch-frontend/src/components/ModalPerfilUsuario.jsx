import { useState, useEffect } from 'react';
import { authApi } from '../api';
import TarjetaRiot from './TarjetaRiot';
import TarjetaSteam from './TarjetaSteam';
import BadgeSinergia from './BadgeSinergia';
import ModalCalificarJugador from './ModalCalificarJugador';
import EtiquetasDestacadas from './EtiquetasDestacadas';

const ESTADO_COLOR = {
  online: 'bg-emerald-500',
  jugando: 'bg-purple-500',
  ausente: 'bg-amber-500',
  offline: 'bg-white/30',
};

const ESTADO_LABEL = {
  online: 'En línea',
  jugando: 'Jugando',
  ausente: 'Ausente',
  offline: 'Desconectado',
};

function InsigniasUsuario({ usuario }) {
  if (!usuario) return null;
  const esMenor = usuario.rango_edad === 'menor_18';
  const labelEdad = esMenor ? 'Menor' : 'Adulto';

  const esPremium = Boolean(usuario.es_premium || usuario.esPremium || Number(usuario.es_premium) === 1);
  const estaVerificado = Boolean(usuario.verificado || usuario.estaVerificado);

  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap my-2">
      {/* 1. Adulto / Menor */}
      <span
        className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
          esMenor
            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}
      >
        {labelEdad}
      </span>

      {/* 2. Verificado */}
      {estaVerificado && (
        <span
          className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1"
          title="Cuenta verificada"
        >
          ✓ Verificado
        </span>
      )}

      {/* 3. Suscripto Premium */}
      {esPremium && (
        <span
          className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1"
          title="Suscripción Premium activa"
        >
          ⭐ Suscripto
        </span>
      )}
    </div>
  );
}

export default function ModalPerfilUsuario({ token, usuarioId, usuarioActual, onClose, onIrAlChat }) {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pestana, setPestana] = useState('riot');
  const [mostrarModalCalificar, setMostrarModalCalificar] = useState(false);

  const esUsuarioActualPremium = Boolean(
    usuarioActual?.es_premium === true ||
      usuarioActual?.es_premium === 1 ||
      usuarioActual?.es_premium === '1' ||
      usuarioActual?.es_premium === 'true'
  );

  useEffect(() => {
    if (!usuarioId) return;
    setCargando(true);
    authApi
      .perfilPublico(token, usuarioId)
      .then((data) => {
        const u = data.usuario || data.perfil || data;
        const riot = data.riot || u.riot || u.IntegracionRiot || null;
        const steam = data.steam || u.steam || u.IntegracionSteam || null;

        const sinergiaGlobal =
          typeof u.sinergia_porcentaje === 'object' && u.sinergia_porcentaje !== null
            ? u.sinergia_porcentaje.global
            : typeof u.sinergia === 'object' && u.sinergia !== null
            ? u.sinergia.global
            : typeof data.sinergia === 'object' && data.sinergia !== null
            ? data.sinergia.global
            : (u.sinergia_porcentaje ?? u.sinergia ?? 50);

        const puedeCalificarBackend = Boolean(
          data.puede_calificar || u.puede_calificar || u.interactuado
        );

        setPerfil({
          ...u,
          sinergia_porcentaje: sinergiaGlobal,
          riot,
          steam,
          puede_calificar: puedeCalificarBackend,
          desglose_etiquetas: data.desglose_etiquetas || u.desglose_etiquetas || []
        });

        if (!riot && steam) setPestana('steam');
        else setPestana('riot');
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [usuarioId, token]);

  const iniciarChatPrivado = async () => {
    try {
      const res = await authApi.crearSala(token, {
        tipo: 'privada',
        participante_id: usuarioId,
      });
      onClose();
      if (onIrAlChat) {
        onIrAlChat(res.sala);
      }
    } catch (err) {
      alert(err.message || 'No se pudo iniciar el chat privado');
    }
  };

  if (!usuarioId) return null;

  const esPerfilMio = Boolean(usuarioActual?.id && perfil?.id && usuarioActual.id === perfil.id);
  const esPremiumPerfil = perfil ? Boolean(perfil.es_premium || perfil.esPremium || Number(perfil.es_premium) === 1) : false;
  const puedeCalificar = Boolean(perfil?.puede_calificar || perfil?.interactuado);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white text-lg transition"
        >
          ✕
        </button>

        {cargando && <p className="text-white/50 text-center py-8">Cargando perfil...</p>}
        {error && <p className="text-repRojo text-center py-8">{error}</p>}

        {perfil && !cargando && (
          <div className="flex flex-col items-center text-center space-y-3">
            <div
              className={`w-20 h-20 rounded-full bg-surface overflow-hidden flex items-center justify-center text-2xl font-bold text-white border-2 ${
                esPremiumPerfil ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-primary'
              }`}
            >
              {perfil.foto_perfil ? (
                <img src={perfil.foto_perfil} alt={perfil.username} className="w-full h-full object-cover" />
              ) : (
                perfil.username?.[0]?.toUpperCase()
              )}
            </div>

            <div className="w-full">
              <h2 className="text-white font-bold text-lg truncate">{perfil.username}</h2>

              <InsigniasUsuario usuario={perfil} />

              <div className="flex items-center justify-center gap-1.5 text-xs text-white/50 mb-3">
                <span className={`w-2 h-2 rounded-full ${ESTADO_COLOR[perfil.estado] || 'bg-white/30'}`} />
                <span>{ESTADO_LABEL[perfil.estado] || 'Desconectado'}</span>
                {perfil.reputacion_porcentaje !== null && perfil.reputacion_porcentaje !== undefined && (
                  <span className="font-semibold text-emerald-400">· {perfil.reputacion_porcentaje}% rep</span>
                )}
              </div>

              {/* BADGE DE SINERGIA */}
              {esUsuarioActualPremium && perfil && perfil.sinergia_porcentaje !== undefined && (
                <BadgeSinergia porcentaje={perfil.sinergia_porcentaje} />
              )}

              {/* ETIQUETAS DESTACADAS (VISIBLES O BLOQUEADAS SEGÚN SINO ES PREMIUM) */}
              <EtiquetasDestacadas
                porcentajeReputacion={perfil.reputacion_porcentaje}
                etiquetas={perfil.desglose_etiquetas}
                esUsuarioPremium={esUsuarioActualPremium}
              />

              {/* PESTAÑAS Y PLATAFORMAS (RIOT / STEAM) */}
              <div className="w-full space-y-3 pt-2">
                {(perfil.riot || perfil.steam) && (
                  <div className="flex gap-2 w-full bg-surface/50 p-1 rounded-xl border border-white/5">
                    {perfil.riot && (
                      <button
                        onClick={() => setPestana('riot')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          pestana === 'riot'
                            ? 'bg-primary text-white shadow-md'
                            : 'text-white/50 hover:text-white'
                        }`}
                      >
                        <span>⚔️</span> League of Legends
                      </button>
                    )}

                    {perfil.steam && (
                      <button
                        onClick={() => setPestana('steam')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          pestana === 'steam'
                            ? 'bg-[#66c0f4]/20 border border-[#66c0f4]/40 text-[#66c0f4] shadow-md'
                            : 'text-white/50 hover:text-white'
                        }`}
                      >
                        <span>🎮</span> Steam
                      </button>
                    )}
                  </div>
                )}

                {/* TARJETA SEGÚN PESTAÑA ACTIVA */}
                {pestana === 'riot' && perfil.riot && (
                  <TarjetaRiot
                    riot={perfil.riot}
                    token={token}
                    esMiPerfil={esPerfilMio}
                    esUsuarioPremium={esUsuarioActualPremium}
                    usuarioLogueado={usuarioActual}
                  />
                )}
                {pestana === 'steam' && perfil.steam && (
                  <TarjetaSteam steam={perfil.steam} juegosEnComun={perfil.juegos_en_comun || []} />
                )}

                {!perfil.riot && !perfil.steam && (
                  <div className="bg-black/20 border border-white/5 p-3 rounded-xl text-center text-xs text-white/40">
                    Sin cuentas de juego vinculadas
                  </div>
                )}
              </div>
            </div>

            {usuarioActual?.id !== perfil?.id && (
              <div className="flex flex-col w-full gap-2 pt-3 border-t border-white/5 mt-3">
                
                {/* CASO 1: Incompatibilidad  (Adulto vs Menor) */}
                {(usuarioActual?.rango_edad === 'menor_18') !== (perfil?.rango_edad === 'menor_18') ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs p-2.5 rounded-xl text-center">
                    🚫 No se permiten chats entre usuarios de distintos entornos de edad.
                  </div>

                ) : /* CASO 2: Entorno de Adultos y alguno no está verificado */
                usuarioActual?.rango_edad !== 'menor_18' && !perfil.verificado ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs p-2.5 rounded-xl text-center">
                    ⚠️ Este usuario requiere verificar su cuenta para recibir chats privados.
                  </div>

                ) : usuarioActual?.rango_edad !== 'menor_18' && !usuarioActual?.verificado ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs p-2.5 rounded-xl text-center">
                    🔒 Debes verificar tu rostro en tu perfil para iniciar chats privados.
                  </div>

                ) : (
                  /* CASO 3: Menores de edad O Adultos ambos verificados -> HABILITADO */
                  <div className="flex gap-2">
                    <button
                      onClick={iniciarChatPrivado}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg"
                    >
                      Hablar por privado
                    </button>

                    {puedeCalificar && (
                      <button
                        onClick={() => setMostrarModalCalificar(true)}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold px-3 py-2.5 rounded-xl transition text-xs flex items-center gap-1 shrink-0"
                        title="Calificar a este jugador"
                      >
                        ⭐ Calificar
                      </button>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* SUBMODAL DE CALIFICACIÓN */}
        {mostrarModalCalificar && perfil && (
          <ModalCalificarJugador
            token={token}
            jugador={perfil}
            onClose={() => setMostrarModalCalificar(false)}
            onCalificado={(nuevaRep) => {
              setPerfil((prev) => (prev ? { ...prev, reputacion_porcentaje: nuevaRep } : prev));
            }}
          />
        )}
      </div>
    </div>
  );
}