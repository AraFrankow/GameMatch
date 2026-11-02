import { storage } from './services/storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function manejarRespuesta(res) {
  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error(`Error (${res.status}): Servidor no disponible`);
  }

  if (!res.ok) {
    if (res.status === 403 && data.error?.includes('suspendida')) {
      await storage.eliminar('token');
      await storage.eliminar('usuario');
    }
    throw new Error(data.error || 'Error inesperado');
  }
  return data;
}

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });
const jsonHeaders = (token) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

export const authApi = {
  login: (body) => 
    fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(manejarRespuesta),
  
  google: (body) => 
    fetch(`${API_URL}/api/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(manejarRespuesta),

  me: (token) => 
    fetch(`${API_URL}/api/auth/me`, { headers: authHeaders(token) }).then(manejarRespuesta),
  
  buscarUsuarios: (token, q = '') =>
    fetch(`${API_URL}/api/usuarios?q=${encodeURIComponent(q)}`, { headers: authHeaders(token) }).then(manejarRespuesta),

  misSalas: (token) => 
    fetch(`${API_URL}/api/salas`, { headers: authHeaders(token) }).then(manejarRespuesta),
  
  crearSala: (token, body) => 
    fetch(`${API_URL}/api/salas`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(body) }).then(manejarRespuesta),

  invitarASala: (token, salaId, datos) => 
    fetch(`${API_URL}/api/salas/${salaId}/invitar`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(datos) }).then(manejarRespuesta),

  verificarEdad: (token, imagenBase64) => 
    fetch(`${API_URL}/api/usuarios/verificar-edad`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify({ imagen: imagenBase64 }) }).then(manejarRespuesta),
};

export default api;