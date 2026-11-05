import React from 'react';

export default function TerminosServicio({ onVolver }) {
  return (
    <div className="min-h-screen bg-gm-gradient text-white p-4 sm:p-8 flex justify-center">
      <div className="max-w-4xl w-full bg-card border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl relative">
        {onVolver && (
          <button
            onClick={onVolver}
            className="mb-6 text-xs text-white/60 hover:text-white flex items-center gap-1 transition"
          >
            ← Volver
          </button>
        )}

        <h1 className="text-3xl font-bold text-white mb-2">Términos y Condiciones de Servicio</h1>
        <p className="text-xs text-white/50 mb-8">
          Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-6 text-sm text-white/80 leading-relaxed">
          <section className="space-y-2 bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl">
            <h2 className="text-lg font-semibold text-amber-400">1. Protección y Uso por Menores de Edad</h2>
            <p className="text-white/90">
              GameMatch está comprometido con la creación de un entorno seguro para todos los jugadores.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-white/80">
              <li><strong>Entorno Aislado:</strong> Los usuarios declarados en el rango de edad <code>menor_18</code> interactúan exclusivamente con otros usuarios de su mismo rango. Queda estrictamente bloqueado el contacto, chat o emparejamiento con usuarios adultos.</li>
              <li><strong>Consentimiento Parental:</strong> Al crear una cuenta como menor de edad, el usuario declara contar con la autorización de su padre, madre o tutor legal.</li>
              <li><strong>Supervisión:</strong> Los padres o tutores tienen derecho a solicitar en cualquier momento el acceso o la baja definitiva de la cuenta de su tutelado escribiendo a <span className="text-primary font-medium">soporte@gamematch.app</span>.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. Reglas de Convivencia y Tolerancia Cero</h2>
            <p>
              Queda estrictamente prohibido en salas de juego, chats y perfiles públicos:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
              <li>El acoso, ciberbullying, hostigamiento o discurso de odio.</li>
              <li>El lenguaje de índole sexual o cualquier intento de captación no autorizada (grooming).</li>
              <li>La suplantación de identidad o la falsificación del rango de edad real.</li>
            </ul>
            <p className="text-xs text-red-400 font-medium mt-1">
              * El incumplimiento de estas normas resultará en la suspensión inmediata e indefinida de la cuenta.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. Verificación Opcional de Edad (IA)</h2>
            <p>
              Para mantener la integridad de las franjas de edad, la plataforma ofrece una herramienta voluntaria de verificación facial. La imagen procesada en este flujo se analiza efímeramente en memoria RAM y se descarta al instante sin ser almacenada ni guardada en discos o bases de datos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Suscripciones y Pagos (GameMatch Premium)</h2>
            <p>
              Las compras y suscripciones Premium deben ser realizadas por personas mayores de edad o con autorización explícita del titular de la tarjeta. Los pagos se procesan de forma externa a través de la plataforma Stripe.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">5. Limitación de Responsabilidad</h2>
            <p>
              GameMatch provee herramientas activas de moderación, bloqueos y reportes, pero no se responsabiliza por el contenido u opiniones vertidas de forma individual por los usuarios en servicios de voz o plataformas externas vinculadas (Steam, Discord, Riot Games).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}