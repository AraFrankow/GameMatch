import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';

import { storage } from '../services/storage';
import { obtenerSocket } from '../services/socket';

const OPCIONES_ESTADO = [
  { clave: 'conectado', label: 'Conectado', color: 'bg-green-500' },
  { clave: 'ausente', label: 'Ausente', color: 'bg-amber-500' },
  { clave: 'desconectado', label: 'Invisible', color: 'bg-slate-500' },
];

export default function PerfilScreen({ usuario, estadoUsuario, onCambiarEstado, onCerrarSesion }) {
  const estadoActual = estadoUsuario || usuario?.estado || 'conectado';

  const handleSeleccionarEstado = async (clave) => {
    if (onCambiarEstado) {
      onCambiarEstado(clave);
    }
    try {
      const u = await storage.obtener('usuario');
      if (u) {
        await storage.guardar('usuario', { ...u, estado: clave });
      }
    } catch (e) {
      console.error('Error al guardar estado en storage:', e);
    }
  };

  const handleCerrarSesion = () => {
    const socket = obtenerSocket();
    if (socket && socket.connected) {
      socket.emit('cambiar_estado_manual', { estado: 'desconectado' });
    }
    if (onCerrarSesion) {
      onCerrarSesion();
    }
  };

  return (
    <View style={tw`flex-1 bg-slate-900 justify-center items-center p-5`}>
      <Text style={tw`text-[22px] font-bold text-white`}>Mi Perfil</Text>
      <Text style={tw`text-base text-slate-400 mt-1 mb-4`}>
        ¡Hola, {usuario?.nombre || usuario?.username || usuario?.email || 'Jugador'}!
      </Text>

      <View style={tw`w-full bg-slate-800/80 p-3 rounded-2xl border border-white/10 mb-6`}>
        <Text style={tw`text-xs text-slate-400 mb-2 font-medium text-center`}>Estado de Disponibilidad</Text>
        <View style={tw`flex-row justify-between`}>
          {OPCIONES_ESTADO.map((opcion) => {
            const esSeleccionado = estadoActual === opcion.clave;
            return (
              <TouchableOpacity
                key={opcion.clave}
                activeOpacity={0.7}
                onPress={() => handleSeleccionarEstado(opcion.clave)}
                style={tw.style(
                  'flex-1 flex-row items-center justify-center py-2.5 px-1 rounded-xl mx-0.5 border',
                  esSeleccionado
                    ? 'bg-slate-700/80 border-indigo-500/50'
                    : 'bg-slate-900/50 border-transparent opacity-50'
                )}
              >
                <View style={tw`w-2.5 h-2.5 rounded-full ${opcion.color} mr-1.5`} />
                <Text style={tw.style('text-xs font-bold', esSeleccionado ? 'text-white' : 'text-slate-400')}>
                  {opcion.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity 
        style={tw`bg-red-500/90 py-3 px-6 rounded-xl w-full items-center`} 
        onPress={handleCerrarSesion}
      >
        <Text style={tw`text-white font-bold text-xs`}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}