import React from 'react';

export default function Footer({ onAbrirPrivacidad, onAbrirTerminos, onAbrirPadres }) {
  return (
    <footer className="w-full bg-card/60 backdrop-blur border-t border-white/10 py-4 px-6 text-xs text-white/50 mt-auto z-20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="font-semibold text-white/70 tracking-wide">
          GameMatch <span className="text-white/40 font-normal">| Arabela Frankow</span>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 text-white/60">
          <button onClick={onAbrirPrivacidad} className="hover:text-white transition underline">
            Política de Privacidad
          </button>
          <span>•</span>
          <button onClick={onAbrirTerminos} className="hover:text-white transition underline">
            Términos de Servicio
          </button>
          {onAbrirPadres && (
            <>
              <span>•</span>
              <button
                onClick={onAbrirPadres}
                className="hover:text-amber-400 transition underline font-medium"
              >
                👨‍👩‍👧‍👦 Info Padres
              </button>
            </>
          )}
        </div>

        <p className="text-center sm:text-right text-white/40">
          Proyecto académico © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}