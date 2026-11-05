import React, { useEffect } from 'react';

export default function ModalPadres({ onClose }) {
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overscroll-contain"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative z-[10000] max-h-[85vh] flex flex-col overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3 shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Información para Padres
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white text-sm p-1 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto pr-2 space-y-4 flex-1 text-xs text-white/80 leading-relaxed overscroll-contain">
          <p className="text-white/70">
            En GameMatch la seguridad de los menores es lo primero. Garantizamos que:
          </p>

          <ul className="space-y-2 list-disc list-inside text-white/80">
            <li>Los menores de 18 años <strong>solo interactúan con otros menores</strong>.</li>
            <li>No existen canales de comunicación cruzados entre adultos y menores.</li>
            <li>Contamos con herramientas directas de reporte y bloqueo inmediato.</li>
            <li>No compartimos ni comercializamos datos personales con terceros.</li>
          </ul>

          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-[11px] text-amber-300">
            <p className="font-semibold mb-1">Control Parental:</p>
            <p className="text-amber-200/80">
              Cualquier padre o tutor legal puede solicitar la baja definitiva de la cuenta o consultar sobre el entorno seguro enviando un correo a <span className="font-medium text-amber-300">soporte@gamematch.app</span>.
            </p>
          </div>
        </div>

        <div className="pt-4 mt-2 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-semibold py-2.5 rounded-xl transition cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}