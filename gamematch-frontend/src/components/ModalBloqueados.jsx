import React, { useState, useEffect } from 'react';
import { authApi } from '../api';

export default function ModalBloqueados({ token, onClose }) {
  const [bloqueados, setBloqueados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setCargando(true);
    authApi
      .obtenerBloqueados(token)
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.bloqueos || [];
        setBloqueados(lista);
      })
      .catch((err) => setError(err.message || 'Error al cargar bloqueados'))
      .finally(() => setCargando(false));
  }, [token]);

  const handleDesbloquear = async (usuarioId) => {
    try {
      await authApi.desbloquearUsuario(token, usuarioId);
      setBloqueados((prev) =>
        prev.filter((b) => b.bloqueado_id !== usuarioId && b.bloqueado?.id !== usuarioId)
      );
    } catch (err) {
      alert(err.message || 'Error al desbloquear usuario');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md relative shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white text-lg transition"
        >
          ✕
        </button>

        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <span>🚫</span> Usuarios Bloqueados
        </h3>

        {cargando && <p className="text-white/50 text-center py-6 text-xs">Cargando lista...</p>}
        {error && <p className="text-red-400 text-center py-4 text-xs">{error}</p>}

        {!cargando && !error && (
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {!Array.isArray(bloqueados) || bloqueados.length === 0 ? (
              <p className="text-white/40 text-xs text-center py-6 italic">
                No tenés usuarios en tu lista de bloqueados.
              </p>
            ) : (
              bloqueados.map((item) => {
                const usuario = item.bloqueado;
                if (!usuario) return null;

                return (
                  <div
                    key={item.id || usuario.id}
                    className="flex items-center justify-between p-3 bg-surface/50 border border-white/5 rounded-xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-surface overflow-hidden flex items-center justify-center font-bold text-xs text-white border border-white/10">
                        {usuario.foto_perfil ? (
                          <img src={usuario.foto_perfil} alt={usuario.username} className="w-full h-full object-cover" />
                        ) : (
                          usuario.username?.[0]?.toUpperCase()
                        )}
                      </div>
                      <span className="text-sm font-medium text-white">{usuario.username}</span>
                    </div>

                    <button
                      onClick={() => handleDesbloquear(usuario.id)}
                      className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg transition font-medium"
                    >
                      Desbloquear
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}