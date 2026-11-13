import { io } from 'socket.io-client';
import { storage } from './storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://gamematch-947f.onrender.com/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

let socket = null;

export const conectarSocket = async () => {
  const token = await storage.obtener('token');

  if (socket) {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  return socket;
};

export const obtenerSocket = () => socket;

export const desconectarSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};