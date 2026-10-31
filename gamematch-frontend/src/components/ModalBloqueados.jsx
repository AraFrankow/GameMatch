import React, { useState, useEffect } from 'react';
import { authApi } from '../api';

export default function ModalBloqueados({ token, onClose, onDesbloquear }) {
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
        prev.filter((item) => {
          const u = item.bloqueado || item;
          const idActual = u.id || item.bloqueado_id;
          return idActual !== usuarioId;
        })
      );

      if (onDesbloquear) {
        onDesbloquear(usuarioId);
      }
    } catch (err) {
      alert(err.message || 'Error al desbloquear usuario');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
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
                const u = item.bloqueado || item;
                const usuarioId = u.id || item.bloqueado_id;

                return (
                  <div key={item.id || u.id} className="flex items-center justify-between p-3 bg-surface border border-white/5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-card border border-white/10 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0">
                        {u.foto_perfil ? (
                          <img src={u.foto_perfil} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (u.username?.[0] || 'U').toUpperCase()
                        )}
                      </div>
                      <span className="text-xs font-semibold text-white">@{u.username}</span>
                    </div>

                    <button
                      onClick={() => handleDesbloquear(usuarioId)}
                      className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg transition font-medium"
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