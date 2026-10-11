export default function BadgeVerificado({ verificado, edadEstimada }) {
  const esVerificado = Boolean(verificado);
  if (!esVerificado) return null;

  return (
    <span 
      className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 shadow-sm"
      title={edadEstimada ? `Edad verificada por AWS (${edadEstimada} años)` : 'Usuario Verificado'}
    >
      <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
      </svg>
      <span>Verificado</span>
    </span>
  );
}