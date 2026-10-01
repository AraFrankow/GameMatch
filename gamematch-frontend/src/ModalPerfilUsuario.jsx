import { useState, useEffect } from 'react';
import { authApi } from './api';

export default function ModalPerfilUsuario({ token, usuarioId, usuarioActual, onClose, onIrAlChat }) {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!usuarioId) return;
    setCargando(true);
    authApi.perfilPublico(token, usuarioId)
      .then((data) => setPerfil(data.usuario))
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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white text-lg"
        >
          ✕
        </button>

        {cargando && <p className="text-white/50 text-center py-8">Cargando perfil...</p>}
        {error && <p className="text-repRojo text-center py-8">{error}</p>}

        {perfil && !cargando && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-surface border-2 border-primary overflow-hidden flex items-center justify-center text-2xl font-bold text-white">
              {perfil.foto_perfil ? (
                <img src={perfil.foto_perfil} alt={perfil.username} className="w-full h-full object-cover" />
              ) : (
                perfil.username?.[0]?.toUpperCase()
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">{perfil.username}</h3>
              <span className="text-xs bg-surface border border-white/10 text-white/60 px-2.5 py-0.5 rounded-full">
                {perfil.rango_edad === 'menor_18' ? 'Menor de 18' : 'Adulto'}
              </span>
            </div>

            {usuarioActual?.id !== perfil.id && (
              <div className="flex flex-col w-full gap-2 pt-2">
                <button
                  onClick={iniciarChatPrivado}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded-xl transition text-sm flex items-center justify-center gap-2"
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