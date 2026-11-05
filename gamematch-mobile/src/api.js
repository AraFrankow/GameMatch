import { storage } from './services/storage';
import axios from 'axios';
import { Alert } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await storage.obtener('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;
      let mensajeOriginal = data?.error || data?.mensaje || '';
      const msgLower = typeof mensajeOriginal === 'string' ? mensajeOriginal.toLowerCase() : '';

      if (status === 403) {
        if (msgLower.includes('menor') || msgLower.includes('edad') || msgLower.includes('entorno')) {
          Alert.alert(
            'Restricción de Edad',
            'No podés interactuar ni iniciar chats con usuarios de un entorno de edad distinto (Menores / Adultos).'
          );
        } else if (msgLower.includes('suspendida')) {
          Alert.alert('Cuenta Suspendida', mensajeOriginal);
          await storage.eliminar('token');
          await storage.eliminar('usuario');
        } else {
          Alert.alert('Acceso Restringido (403)', mensajeOriginal || 'Acción no permitida por la plataforma');
        }
      } else if (status === 401) {
        Alert.alert('Sesión Expirada', 'Por favor, volvé a iniciar sesión.');
        await storage.eliminar('token');
        await storage.eliminar('usuario');
      }
    }
    return Promise.reject(error);
  }
);

export const usuariosApi = {
  obtenerPerfil: async (usuarioId) => {
    const { data } = await api.get(`/perfil/${usuarioId}`);
    return data;
  },
  bloquear: async (bloqueado_id) => {
    const { data } = await api.post('/bloqueos', { bloqueado_id });
    return data;
  },
  reportar: async (reportado_id, motivo, comentario) => {
    const { data } = await api.post('/reportes', { reportado_id, motivo, comentario });
    return data;
  },
  obtenerCompaneros: async () => {
    const { data } = await api.get('/companeros');
    return data;
  },
  verificarInteraccion: async (usuarioId) => {
    const companeros = await usuariosApi.obtenerCompaneros();
    const lista = Array.isArray(companeros) ? companeros : companeros.data || [];
    const interactuaron = lista.some(
      (c) => Number(c.id || c.usuario_id) === Number(usuarioId)
    );
    return { interactuaron };
  },
  actualizarPushToken: async (push_token) => {
    const { data } = await api.put('/usuarios/push-token', { push_token });
    return data;
  },
  obtenerConfigNotificaciones: async () => {
    const { data } = await api.get('/usuarios/notificaciones-config');
    return data;
  },
  actualizarConfigNotificaciones: async (config) => {
    const { data } = await api.put('/usuarios/notificaciones-config', config);
    return data;
  },
};

export const salasApi = {
  listarMisSalas: async () => {
    const { data } = await api.get('/salas');
    return data;
  },
  obtenerHistorial: async (salaId) => {
    const { data } = await api.get(`/salas/${salaId}/mensajes`);
    return data;
  },
  crearSala: async (datos) => {
    const { data } = await api.post('/salas', datos);
    return data;
  },
  invitarUsuario: async (salaId, usuarioId) => {
    const { data } = await api.post(`/salas/${salaId}/invitar`, { usuarioId });
    return data;
  },
};

export const perfilApi = {
  obtenerPerfilPublico: async (usuarioId) => {
    const { data } = await api.get(`/perfil/${usuarioId}`);
    return data;
  },
  calificarJugador: async (usuarioId, calificacion) => {
    const { data } = await api.post(`/usuarios/${usuarioId}/calificar`, calificacion);
    return data;
  },
};

export const authApi = {
  registro: async (body) => {
    const { data } = await api.post('/auth/registro', body);
    return data;
  },
  login: async (body) => {
    const { data } = await api.post('/auth/login', body);
    return data;
  },
  google: async (body) => {
    const { data } = await api.post('/auth/google', body);
    return data;
  },
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
  buscarUsuarios: async (q = '') => {
    const { data } = await api.get(`/usuarios?q=${encodeURIComponent(q)}`);
    return data;
  },
  misSalas: async () => {
    const { data } = await api.get('/salas');
    return data;
  },
  crearSala: async (body) => {
    const { data } = await api.post('/salas', body);
    return data;
  },
  invitarASala: async (salaId, datos) => {
    const { data } = await api.post(`/salas/${salaId}/invitar`, datos);
    return data;
  },
  perfilPublico: async (usuarioId) => {
    const { data } = await api.get(`/perfil/${usuarioId}`);
    return data;
  },
  verificarEdad: async (imagenBase64) => {
    const { data } = await api.post('/usuarios/verificar-edad', { imagen: imagenBase64 });
    return data;
  },
  buscarJuegosSteam: async (arg1, arg2) => {
    const q = typeof arg2 === 'string' ? arg2 : typeof arg1 === 'string' ? arg1 : '';
    const { data } = await api.get(`/juegos/steam-autocomplete?q=${encodeURIComponent(q)}`);
    return data;
  },
  guardarPushToken: async (push_token) => {
    const { data } = await api.put('/usuarios/push-token', { push_token });
    return data;
  },
  misInvitaciones: async () => {
    const { data } = await api.get('/salas/invitaciones');
    return data;
  },
  unirseASala: async (salaId) => {
    const { data } = await api.post(`/salas/${salaId}/unirse`);
    return data;
  },
  rechazarInvitacion: async (notifId) => {
    const { data } = await api.delete(`/salas/invitaciones/${notifId}`);
    return data;
  },
  obtenerConfigNotificaciones: async () => {
    const { data } = await api.get('/usuarios/notificaciones-config');
    return data;
  },
  actualizarConfigNotificaciones: async (config) => {
    const { data } = await api.put('/usuarios/notificaciones-config', config);
    return data;
  },
  obtenerMiPerfil: async () => {
    const { data } = await api.get('/perfil/me');
    return data;
  },
  actualizarPerfil: async (datosForm) => {
    const { data } = await api.put('/perfil', datosForm);
    return data;
  },
  vincularRiot: async (datosRiot) => {
    const { data } = await api.post('/integraciones/riot', datosRiot);
    return data;
  },
  desvincularRiot: async () => {
    const { data } = await api.delete('/integraciones/riot');
    return data;
  },
  vincularSteam: async (steamId) => {
    const payload = typeof steamId === 'object' ? steamId : { steam_id: steamId };
    const { data } = await api.post('/integraciones/steam', payload);
    return data;
  },
  desvincularSteam: async () => {
    const { data } = await api.delete('/integraciones/steam');
    return data;
  },
  cancelarSuscripcion: async () => {
    const { data } = await api.post('/suscripcion/cancelar');
    return data;
  },
};

export default api;