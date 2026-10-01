const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function manejarRespuesta(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error inesperado');
  return data;
}

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });
const jsonHeaders = (token) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

export const authApi = {
  registro: (body) => fetch(`${API_URL}/api/auth/registro`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(manejarRespuesta),
  login: (body) => fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(manejarRespuesta),
  google: (body) => fetch(`${API_URL}/api/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(manejarRespuesta),
  me: (token) => fetch(`${API_URL}/api/auth/me`, { headers: authHeaders(token) }).then(manejarRespuesta),

  buscar: (token, filtros) => {
    const params = new URLSearchParams(Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== '' && v !== undefined)));
    return fetch(`${API_URL}/api/busqueda?${params}`, { headers: authHeaders(token) }).then(manejarRespuesta);
  },
  juegos: (token) => fetch(`${API_URL}/api/juegos`, { headers: authHeaders(token) }).then(manejarRespuesta),

  bloquear: (token, bloqueado_id) => fetch(`${API_URL}/api/bloqueos`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify({ bloqueado_id }) }).then(manejarRespuesta),
  desbloquear: (token, bloqueado_id) => fetch(`${API_URL}/api/bloqueos/${bloqueado_id}`, { method: 'DELETE', headers: authHeaders(token) }).then(manejarRespuesta),
  listarBloqueos: (token) => fetch(`${API_URL}/api/bloqueos`, { headers: authHeaders(token) }).then(manejarRespuesta),
  reportar: (token, body) => fetch(`${API_URL}/api/reportes`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(body) }).then(manejarRespuesta),
  votar: (token, body) => fetch(`${API_URL}/api/reputacion`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(body) }).then(manejarRespuesta),
  companeros: (token) => fetch(`${API_URL}/api/companeros`, { headers: authHeaders(token) }).then(manejarRespuesta),
  partidas: (token, usuarioId) => fetch(`${API_URL}/api/partidas/${usuarioId}`, { headers: authHeaders(token) }).then(manejarRespuesta),
  perfilPublico: (token, id) => fetch(`${API_URL}/api/usuarios/${id}`, { headers: authHeaders(token) }).then(manejarRespuesta),

  // ---- Chat / Salas ----
  crearSala: (token, body) => fetch(`${API_URL}/api/salas`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(body) }).then(manejarRespuesta),
  misSalas: (token) => fetch(`${API_URL}/api/salas`, { headers: authHeaders(token) }).then(manejarRespuesta),
  misInvitaciones: (token) => fetch(`${API_URL}/api/salas/invitaciones`, { headers: authHeaders(token) }).then(manejarRespuesta),
  invitarASala: (token, salaId, usuario_id) => fetch(`${API_URL}/api/salas/${salaId}/invitar`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify({ usuario_id }) }).then(manejarRespuesta),
  unirseASala: (token, salaId) => fetch(`${API_URL}/api/salas/${salaId}/unirse`, { method: 'POST', headers: authHeaders(token) }).then(manejarRespuesta),
  salirDeSala: (token, salaId) => fetch(`${API_URL}/api/salas/${salaId}/salir`, { method: 'POST', headers: authHeaders(token) }).then(manejarRespuesta),
  historialMensajes: (token, salaId) => fetch(`${API_URL}/api/salas/${salaId}/mensajes`, { headers: authHeaders(token) }).then(manejarRespuesta),
  tokenVoz: (token, salaId) => fetch(`${API_URL}/api/salas/${salaId}/token-voz`, { headers: authHeaders(token) }).then(manejarRespuesta),

  rechazarInvitacion: (token, invitacionId) => 
    fetch(`${API_URL}/api/salas/invitaciones/${invitacionId}`, { 
      method: 'DELETE', 
      headers: authHeaders(token) 
    }).then(manejarRespuesta),

  obtenerMiPerfil: (token) => 
    fetch(`${API_URL}/api/perfil/me`, {
      headers: authHeaders(token) 
    }).then(manejarRespuesta),

  actualizarMiPerfil: (token, datos) => fetch(`${API_URL}/api/auth/perfil`, { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify(datos) }).then(manejarRespuesta),

  // ---- Integraciones ----
  vincularSteam: (token, steam_id) => 
    fetch(`${API_URL}/api/integraciones/steam`, { 
      method: 'POST', 
      headers: jsonHeaders(token), 
      body: JSON.stringify({ steam_id }) 
    }).then(manejarRespuesta),

  vincularRiot: (token, { game_name, tag_line, region }) => 
    fetch(`${API_URL}/api/integraciones/riot`, { 
      method: 'POST', 
      headers: jsonHeaders(token), 
      body: JSON.stringify({ game_name, tag_line, region }) 
    }).then(manejarRespuesta),

  desvincularIntegracion: (token, plataforma) => 
    fetch(`${API_URL}/api/integraciones/${plataforma}`, { 
      method: 'DELETE', 
      headers: authHeaders(token) 
    }).then(manejarRespuesta),
};