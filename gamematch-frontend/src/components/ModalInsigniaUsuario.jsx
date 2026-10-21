export function InsigniasUsuario({ usuario }) {
  const esMenor = usuario.rango_edad === 'menor_18';
  const labelEdad = esMenor ? 'Menor' : 'Adulto';

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
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
      {Boolean(usuario.verificado) && (
        <span
          className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1"
          title="Cuenta verificada"
        >
          ✓ Verificado
        </span>
      )}

      {/* 3. Suscripto Premium */}
      {Boolean(usuario.es_premium) && (
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