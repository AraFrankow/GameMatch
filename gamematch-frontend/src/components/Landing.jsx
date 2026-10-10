import React from 'react';

export default function Landing({ onNavigateToRegister, onNavigateToLogin }) {
  return (
    <div style={{ backgroundColor: '#0A0914', color: '#ffffff', minHeight: '100vh', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

        .font-display { font-family: 'Chakra Petch', sans-serif; }
        
        .gm-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; border-bottom: 1px solid rgba(255,255,255,0.06); position: relative; z-index: 10; }
        .gm-container { max-width: 1150px; margin: 0 auto; padding: 0 24px; }
        .gm-hero { padding: 60px 24px 80px; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 48px; align-items: center; position: relative; z-index: 10; }
        
        /* BOTÓN PRIMARIO (Morado) */
        .gm-btn-primary { 
          background-color: #7C3AED; 
          color: #ffffff; 
          padding: 14px 28px; 
          border-radius: 8px; 
          border: none; 
          font-weight: 600; 
          cursor: pointer; 
          transition: all 0.2s ease-in-out;
        }
        .gm-btn-primary:hover { 
          background-color: #6D28D9;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
        }
        
        /* BOTÓN SECUNDARIO (Blanco) */
        .gm-btn-secondary { 
          background-color: #ffffff; 
          color: #0A0914; 
          padding: 8px 18px; 
          border-radius: 8px; 
          border: none; 
          font-weight: 600; 
          cursor: pointer; 
          transition: all 0.2s ease-in-out;
        }
        .gm-btn-secondary:hover { 
          background-color: #E2E8F0;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
        }

        /* BOTÓN DE TEXTO SIMPLE (Header) */
        .gm-btn-text {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          cursor: pointer;
          transition: color 0.2s ease-in-out;
        }
        .gm-btn-text:hover {
          color: #ffffff;
        }

        /* BOTÓN DE SUBRAYADO */
        .gm-btn-link {
          background: none;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.7);
          padding: 12px 0;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        .gm-btn-link:hover {
          color: #ffffff;
          border-bottom-color: #7C3AED;
        }

        /* TARJETA Y LUCES */
        .gm-card { background-color: #15122A; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); transform: perspective(1000px) rotateY(-4deg) rotateX(2deg); }
        .gm-card-item { background-color: rgba(255,255,255,0.03); padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .gm-glow-1 { position: absolute; top: -150px; left: -100px; width: 500px; height: 500px; background-color: rgba(124, 58, 237, 0.2); border-radius: 50%; filter: blur(120px); pointer-events: none; }
        .gm-glow-2 { position: absolute; top: 100px; right: 0; width: 400px; height: 400px; background-color: rgba(245, 158, 11, 0.1); border-radius: 50%; filter: blur(120px); pointer-events: none; }
        .gm-line { height: 1px; background: linear-gradient(90deg, transparent, #7C3AED, transparent); max-width: 1150px; margin: 0 auto; }
        
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        .pulse { animation: pulse-dot 2s ease-in-out infinite; }
      `}</style>

      {/* Luces decorativas */}
      <div className="gm-glow-1"></div>
      <div className="gm-glow-2"></div>

      {/* HEADER */}
      <header className="gm-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="font-display" style={{ fontWeight: '600', fontSize: '18px', color: '#ffffff' }}>GameMatch</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button className="gm-btn-text" onClick={onNavigateToLogin}>
            Iniciar sesión
          </button>
          <button className="gm-btn-secondary" onClick={onNavigateToRegister}>
            Crear cuenta
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="gm-container gm-hero">
        <div>
          <h1 className="font-display" style={{ fontSize: '48px', lineHeight: '1.08', fontWeight: '600', color: '#ffffff', margin: 0 }}>
            Tu próximo compañero de partida no debería ser una apuesta.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '18px', marginTop: '24px', lineHeight: '1.6', maxWidth: '440px' }}>
            GameMatch verifica el nivel real de cada jugador con Steam y Riot, modera la toxicidad antes de que te llegue, y separa a los menores de los adultos.
          </p>

          <div style={{ display: 'flex', gap: '16px', marginTop: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="gm-btn-primary" onClick={onNavigateToRegister}>
              Buscar compañeros
            </button>
            <button className="gm-btn-link" onClick={onNavigateToLogin}>
              Ya tengo cuenta
            </button>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '40px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80' }}></span> Verificación por API</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80' }}></span> Moderación automática</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80' }}></span> Edades segregadas</span>
          </div>
        </div>

        {/* CARD MOCKUP */}
        <div style={{ position: 'relative' }}>
          <div className="gm-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>SALA · Ranked Duo</span>
              <span style={{ color: '#4ADE80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80' }}></span> En vivo
              </span>
            </div>

            <div className="gm-card-item">
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>L</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>Lucas_22</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Diamante II · Support</p>
              </div>
              <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>98% rep</span>
            </div>

            <div className="gm-card-item">
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>N</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>Naty.gg</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Diamante I · Mid</p>
              </div>
              <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>94% rep</span>
            </div>

            <div style={{ border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
              Esperando 1 jugador más...
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(124, 58, 237, 0.4)', border: '2px solid #15122A' }}></div>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(167, 139, 250, 0.4)', border: '2px solid #15122A', marginLeft: '-8px' }}></div>
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>🎙️ Voz activa</span>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '-16px', left: '-16px', backgroundColor: '#0A0914', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 16px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Última partida</p>
            <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>Victoria · 12/3/24</p>
          </div>
        </div>
      </section>

      <div className="gm-line"></div>

      {/* SECCIÓN CARACTERÍSTICAS */}
      <section className="gm-container" style={{ padding: '80px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px', position: 'relative', zIndex: 10 }}>
        <div>
          <h2 className="font-display" style={{ fontSize: '28px', color: '#ffffff', margin: 0, fontWeight: '600' }}>Lo que decís que sos, lo confirmamos.</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '16px', lineHeight: '1.6' }}>
            Nada de rangos autodeclarados que nadie chequea. Vinculás tu cuenta y tus estadísticas hablan por vos.
          </p>
          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(124,58,237,0.15)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>S</div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>Vinculación con Steam</p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>Tus juegos y horas jugadas, importados automáticamente.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(124,58,237,0.15)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>R</div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>Vinculación con Riot Games</p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>Tu rango real de League of Legends, no el que decís tener.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-display" style={{ fontSize: '28px', color: '#ffffff', margin: 0, fontWeight: '600' }}>La toxicidad se filtra antes de llegar.</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '16px', lineHeight: '1.6' }}>
            Cada mensaje pasa por moderación automática. Si alguien se pasa de la raya, del otro lado nadie se entera.
          </p>
          <div style={{ marginTop: '24px', backgroundColor: '#15122A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(167,139,250,0.3)' }}></div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>buena partida, gg!</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', opacity: 0.5 }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.3)' }}></div>
              <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#FCA5A5' }}>
                🚫 Mensaje bloqueado por contenido inapropiado
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="gm-line"></div>

      {/* SECCIÓN PASOS */}
      <section className="gm-container" style={{ padding: '80px 24px', position: 'relative', zIndex: 10 }}>
        <h2 className="font-display" style={{ fontSize: '28px', color: '#ffffff', textAlign: 'center', marginBottom: '48px', fontWeight: '600' }}>
          Tres niveles para tu primera partida
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
          <div>
            <div className="font-display" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #7C3AED', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '16px' }}>01</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>Armá tu perfil</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.5' }}>Tu rango de edad, tus juegos y cómo preferís jugar: casual o competitivo.</p>
          </div>
          <div>
            <div className="font-display" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #7C3AED', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '16px' }}>02</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>Filtrá y elegí</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.5' }}>Buscá por juego, rango y disponibilidad. Vas a ver quién está activo ahora mismo.</p>
          </div>
          <div>
            <div className="font-display" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #F59E0B', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '16px' }}>03</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>Entrá a la sala</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.5' }}>Chat de texto y voz en el momento. Sin salir de la plataforma, sin pasar Discord.</p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="gm-container" style={{ padding: '60px 24px 80px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <h2 className="font-display" style={{ fontSize: '32px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.2', fontWeight: '600' }}>
          Dejá de jugar a la ruleta con desconocidos.
        </h2>
        <button className="gm-btn-primary" style={{ marginTop: '32px' }} onClick={onNavigateToRegister}>
          Crear mi cuenta gratis
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', position: 'relative', zIndex: 10 }}>
        © 2026 GameMatch — Todos los derechos reservados.
      </footer>
    </div>
  );
}
