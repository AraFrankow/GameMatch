import React from 'react';

export default function PoliticaPrivacidad({ onVolver }) {
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

        <h1 className="text-3xl font-bold text-white mb-2">Política de Privacidad</h1>
        <p className="text-xs text-white/50 mb-8">
          Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-6 text-sm text-white/80 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. Información que Recopilamos</h2>
            <p>
              En <strong>GameMatch</strong> recopilamos la información estrictamente necesaria para brindar nuestros servicios de matchmaking y comunicación:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
              <li><strong>Información de cuenta:</strong> Nombre de usuario, correo electrónico, contraseña encriptada (bcrypt), rango de edad y preferencia de modo de juego.</li>
              <li><strong>Autenticación con Google (OAuth 2.0):</strong> Al iniciar sesión con Google, obtenemos tu nombre, correo electrónico e imagen de perfil provista por Google.</li>
              <li><strong>Integraciones de terceros:</strong> Datos públicos de tus perfiles vinculados de Steam y Riot Games (IDs de juego, nombres en plataforma).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. Uso de la Información</h2>
            <p>Utilizamos tus datos para:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-white/70">
              <li>Conectarte con otros jugadores según compatibilidad de juegos y estilo de juego.</li>
              <li>Garantizar el aislamiento seguro por franja de edad entre usuarios menores y adultos.</li>
              <li>Facilitar la comunicación en tiempo real mediante salas de chat y mensajes directos.</li>
              <li>Gestionar suscripciones activas a GameMatch Premium.</li>
            </ul>
          </section>

          <section className="space-y-2 bg-primary/10 border border-primary/30 p-4 rounded-xl">
            <h2 className="text-lg font-semibold text-primary">3. Procesamiento Biométrico Efímero e IA</h2>
            <p className="text-white/90">
              GameMatch incluye una función opcional de verificación de edad asistida por Visión por Computadora e Inteligencia Artificial (OpenCV y DeepFace).
            </p>
            <p className="text-white/80 font-medium mt-1">
              <strong>Garantía de privacidad:</strong> Las capturas fotográficas procesadas para la estimación de edad se evalúan <u>exclusivamente en la memoria RAM del servidor de inferencia</u> de manera efímera. <strong>Ninguna imagen se almacena en disco, bases de datos o servidores externos</strong>, siendo eliminadas de la memoria inmediatamente después de completar el análisis.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Protección Especial de Menores de Edad</h2>
            <p>
              La seguridad de los usuarios menores de 18 años es una prioridad fundamental. La plataforma implementa un entorno de aislamiento estricto donde los usuarios en el rango <code>menor_18</code> solo pueden interactuar, buscar compañeros e ingresar a salas de chat con otros usuarios del mismo rango de edad.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">5. Procesamiento de Pagos (Stripe)</h2>
            <p>
              Las transacciones comerciales para la suscripción GameMatch Premium se realizan de forma segura mediante la pasarela de pagos <strong>Stripe API</strong>. GameMatch no almacena ni procesa directamente números de tarjetas de crédito o credenciales financieras en sus servidores.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">6. Almacenamiento Local (Local Storage / Async Storage)</h2>
            <p>
              Utilizamos almacenamiento local en el navegador (Web) y en el dispositivo (Mobile) para mantener tu sesión activa de manera segura mediante tokens de autenticación JWT (<code>gm_token</code>, <code>gm_usuario</code>). Estos datos son técnicos y necesarios para el funcionamiento de la aplicación.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">7. Derechos del Usuario y Eliminación de Datos</h2>
            <p>
              Tenés derecho a acceder, corregir o solicitar la eliminación definitiva de tu cuenta y todos los datos asociados en cualquier momento. Podés realizar esta solicitud desde la sección de configuración de tu perfil o enviando un correo a nuestro equipo de soporte.
            </p>
          </section>

          <section className="space-y-2 pt-2 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white">8. Contacto</h2>
            <p className="text-white/70">
              Si tenés dudas o consultas sobre esta Política de Privacidad, podés contactarnos en: <span className="text-primary font-medium">soporte@gamematch.app</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}