import React, { useState } from 'react';
import { authApi } from '../api';

const ETIQUETAS_POSITIVAS = ['Buen compañero', 'Juega en equipo', 'Buena onda'];
const ETIQUETAS_NEGATIVAS = ['Tóxico', 'AFK', 'Jugador Individualista', 'Troll'];

export default function ModalCalificarJugador({ token, jugador, onClose, onCalificado }) {
  const [tipo, setTipo] = useState('positiva');
  const [etiqueta, setEtiqueta] = useState('');
  const [comentario, setComentario] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  if (!jugador) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      const res = await authApi.calificarJugador(token, jugador.id, {
        tipo,
        etiqueta,
        comentario,
      });

      if (res.exito) {
        if (onCalificado) onCalificado(res.reputacion_porcentaje);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Error al enviar la calificación');
    } finally {
      setCargando(false);
    }
  };

  const listaEtiquetas = tipo === 'positiva' ? ETIQUETAS_POSITIVAS : ETIQUETAS_NEGATIVAS;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md relative shadow-2xl space-y-4 text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white text-lg transition"
        >
          ✕
        </button>

        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-white">Calificar a {jugador.username}</h3>
          <p className="text-xs text-white/50">Evaluá tu experiencia de juego reciente.</p>
        </div>

        {error && <p className="bg-repRojo/10 text-repRojo text-xs p-2.5 rounded-xl text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setTipo('positiva');
                setEtiqueta('');
              }}
              className={`py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                tipo === 'positiva'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-surface/50 text-white/40 border-white/5 hover:text-white'
              }`}
            >
              <span>👍</span> Positivo
            </button>

            <button
              type="button"
              onClick={() => {
                setTipo('negativa');
                setEtiqueta('');
              }}
              className={`py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                tipo === 'negativa'
                  ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'bg-surface/50 text-white/40 border-white/5 hover:text-white'
              }`}
            >
              <span>👎</span> Negativo
            </button>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-2 font-medium">Etiqueta principal</label>
            <div className="flex flex-wrap gap-1.5">
              {listaEtiquetas.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setEtiqueta(etiqueta === item ? '' : item)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    etiqueta === item
                      ? tipo === 'positiva'
                        ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                        : 'bg-red-500 text-white border-red-400 font-bold'
                      : 'bg-surface border-white/10 text-white/70 hover:border-white/30'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1 font-medium">Comentario opcional</label>
            <textarea
              rows="2"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Escribí detalles sobre tu experiencia..."
              className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary transition resize-none"
              maxLength={255}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-surface hover:bg-white/10 text-white/70 text-xs py-2.5 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium text-xs py-2.5 rounded-xl transition shadow-lg disabled:opacity-50"
            >
              {cargando ? 'Enviando...' : 'Guardar calificación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}