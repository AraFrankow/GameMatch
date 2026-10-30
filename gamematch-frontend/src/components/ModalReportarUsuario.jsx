import React, { useState } from 'react';
import { authApi } from '../api';

export default function ModalReportarUsuario({ token, reportadoId, usernameReportado, onClose }) {
  const [motivo, setMotivo] = useState('Comportamiento tóxico');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!descripcion.trim()) {
      setError('Por favor, ingresá un detalle o motivo del reporte.');
      return;
    }

    setEnviando(true);
    setError('');

    try {
      await authApi.reportar(token, {
        reportado_id: reportadoId,
        motivo,
        descripcion
      });
      setExito(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message || 'Error al enviar el reporte.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md relative shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white text-lg transition"
        >
          ✕
        </button>

        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <span>🚨</span> Reportar a @{usernameReportado}
        </h3>

        {exito ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-center text-sm font-medium">
            Reporte enviado correctamente. Un administrador revisará el caso.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs p-2.5 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Motivo del reporte
              </label>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              >
                <option value="Comportamiento tóxico">Comportamiento tóxico</option>
                <option value="Acoso o lenguaje ofensivo">Acoso o lenguaje ofensivo</option>
                <option value="Perfil falso o suplantación">Perfil falso o suplantación</option>
                <option value="Trampa o AFK frecuente">Trampa o AFK frecuente</option>
                <option value="Spam o enlaces maliciosos">Spam o enlaces maliciosos</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Detalle / Evidencia breve
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Explicá brevemente lo sucedido..."
                rows={3}
                className="w-full bg-surface border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-surface hover:bg-white/10 text-xs font-medium text-white/70 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-xs font-semibold text-white transition disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Enviar Reporte'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}