import { useRef, useState, useEffect } from 'react';

const URL_API_BACKEND = 'http://localhost:3000/api/usuarios/verificar-edad';

export default function VerificacionCamara({ token, onSuccess }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [dispositivos, setDispositivos] = useState([]);
  const [dispositivoSeleccionado, setDispositivoSeleccionado] = useState('');
  
  const [cargandoCamara, setCargandoCamara] = useState(false);
  const [procesandoIA, setProcesandoIA] = useState(false);
  const [error, setError] = useState('');
  const [camaraActiva, setCamaraActiva] = useState(false);

  useEffect(() => {
    async function obtenerCamaras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setDispositivos(videoDevices);
        if (videoDevices.length > 0) {
          setDispositivoSeleccionado(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error al listar cámaras:', err);
      }
    }
    obtenerCamaras();
  }, []);

  const iniciarCamara = async (deviceId = dispositivoSeleccionado) => {
    setError('');
    setCargandoCamara(true);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCamaraActiva(true);
    } catch (err) {
      console.error(err);
      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('La cámara está en uso por otra app. Cerrala e intentá de nuevo.');
      } else if (err.name === 'NotAllowedError') {
        setError('Permiso de cámara denegado. Permitila desde el candado de la URL.');
      } else {
        setError('No se pudo acceder a la cámara: ' + err.message);
      }
    } finally {
      setCargandoCamara(false);
    }
  };

  useEffect(() => {
    if (camaraActiva && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [camaraActiva, stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Capturar y enviar imagen
  const capturarYVerificar = async () => {
    if (!videoRef.current) return;

    setProcesandoIA(true);
    setError('');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const imagenBase64 = canvas.toDataURL('image/jpeg', 0.6);

      const res = await fetch(URL_API_BACKEND, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ imagen: imagenBase64 })
      });

      const text = await res.text();
      let data = {};

      try {
        data = JSON.parse(text);
      } catch (_) {
        if (!res.ok) {
          throw new Error(`El servidor devolvió un error ${res.status} (no JSON). Verificá que la ruta "${URL_API_BACKEND}" exista en tu backend.`);
        }
      }

      if (!res.ok || data.exito === false) {
        throw new Error(data.message || `Error ${res.status} al verificar la imagen.`);
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (onSuccess) onSuccess(data);
    } catch (err) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError(`No se pudo conectar con el servidor en ${URL_API_BACKEND}. Verificá que el backend esté encendido.`);
      } else {
        setError(err.message || 'No se pudo verificar la imagen.');
      }
    } finally {
      setProcesandoIA(false);
    }
  };

  return (
    <div className="space-y-4 text-center p-2">
      {dispositivos.length > 1 && (
        <div className="max-w-xs mx-auto mb-2">
          <label className="block text-[11px] text-white/50 mb-1">Cámara detectada:</label>
          <select
            value={dispositivoSeleccionado}
            onChange={(e) => {
              setDispositivoSeleccionado(e.target.value);
              if (camaraActiva) iniciarCamara(e.target.value);
            }}
            className="w-full bg-surface border border-white/10 text-white text-xs rounded-lg p-1.5 outline-none"
          >
            {dispositivos.map((d, index) => (
              <option key={d.deviceId || index} value={d.deviceId}>
                {d.label || `Cámara ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {!camaraActiva ? (
        <div className="py-2">
          <button
            onClick={() => iniciarCamara()}
            disabled={cargandoCamara}
            className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            {cargandoCamara ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Iniciando cámara...</span>
              </>
            ) : (
              <span>Activar Cámara</span>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative max-w-sm mx-auto rounded-xl overflow-hidden border border-white/10 bg-black shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto object-cover"
            />

            {procesandoIA && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-10">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-white text-xs font-semibold mb-2">Analizando rostro con IA...</p>
                <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-pulse w-full" />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-2">
            <button
              onClick={capturarYVerificar}
              disabled={procesandoIA}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2 rounded-xl transition shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {procesandoIA ? 'Procesando...' : '📸 Tomar Foto y Verificar'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl max-w-sm mx-auto text-left">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}