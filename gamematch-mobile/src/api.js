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
  perfilPublico: async (token, usuarioId) => {
    const { data } = await api.get(`/perfil/${usuarioId}`);
    return data;
  },
  verificarEdad: async (imagenBase64) => {
    const { data } = await api.post('/usuarios/verificar-edad', { imagen: imagenBase64 });
    return data;
  },
};

export default api;