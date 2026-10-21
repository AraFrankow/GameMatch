import { useState } from 'react';

export default function BotonPremium({ token, esPremium }) {
  const [cargando, setCargando] = useState(false);

  const handleComprar = async () => {
    setCargando(true);
    try {
      const res = await fetch('http://localhost:3000/api/stripe/crear-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.url) {
        // Redirige a la pasarela de pago segura de Stripe
        window.location.href = data.url;
      } else {
        alert('No se pudo iniciar el pago.');
      }
    } catch (err) {
      alert('Error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  if (esPremium) {
    return (
      <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-2 text-yellow-300 text-xs font-semibold">
        <span>⭐</span>
        <span>¡Sos usuario GameMatch Premium!</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleComprar}
      disabled={cargando}
      className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-bold py-2.5 px-4 rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
    >
      <span>⭐</span>
      <span>{cargando ? 'Redirigiendo a Stripe...' : 'Obtener Premium ($4.99/mes)'}</span>
    </button>
  );
}