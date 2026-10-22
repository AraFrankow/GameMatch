import { useState, useEffect } from 'react';
import { authApi } from '../api';
import TarjetaRiot from './TarjetaRiot';
import BadgeSinergia from './BadgeSinergia';

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
  const esUsuarioActualPremium = Boolean(usuarioActual?.es_premium);

  useEffect(() => {
    if (!usuarioId) return;
    setCargando(true);
    authApi
      .perfilPublico(token, usuarioId)
      .then((data) => {
        const u = data.usuario || data.perfil || data;
        const riot = data.riot || u.riot || u.IntegracionRiot || null;
        const steam = data.steam || u.steam || u.IntegracionSteam || null;

        setPerfil({
          ...u,
          riot,
          steam,
        });
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

  const esPremium = perfil ? Boolean(perfil.es_premium || perfil.esPremium || Number(perfil.es_premium) === 1) : false;
  const riot = perfil?.riot;

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
                esPremium ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-primary'
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
                  <span>· {perfil.reputacion_porcentaje}% rep</span>
                )}
              </div>

              {esUsuarioActualPremium && perfil && perfil.sinergia_porcentaje !== undefined && (
                <BadgeSinergia porcentaje={perfil.sinergia_porcentaje} />
              )}

              {/* INTEGRACIÓN RIOT GAMES */}
              {riot && <TarjetaRiot riot={riot} />}
            </div>

            {usuarioActual?.id !== perfil.id && (
              <div className="flex flex-col w-full gap-2 pt-1">
                <button
                  onClick={iniciarChatPrivado}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg"
                >
                  Hablar por privado
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}