import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, titulo, children, className = '' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className={`bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto relative shadow-2xl ${className}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white text-lg transition cursor-pointer z-10"
        >
          ✕
        </button>
        {titulo && (
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            {titulo}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}