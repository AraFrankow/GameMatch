import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import tw from 'twrnc';

import { storage } from '../services/storage';
import { obtenerSocket } from '../services/socket';
import { authApi } from '../api';

const OPCIONES_ESTADO = [
  { clave: 'conectado', label: 'Conectado', color: 'bg-green-500' },
  { clave: 'ausente', label: 'Ausente', color: 'bg-amber-500' },
  { clave: 'desconectado', label: 'Invisible', color: 'bg-slate-500' },
];

export default function PerfilScreen({ usuario, estadoUsuario, onCambiarEstado, onCerrarSesion }) {
  const estadoActual = estadoUsuario || usuario?.estado || 'conectado';

  const [cargandoConfig, setCargandoConfig] = useState(true);
  const [config, setConfig] = useState({
    invitaciones: true,
    mensajes: true,
    sistema: true,
  });

  useEffect(() => {
    let montado = true;
    const cargarPreferencias = async () => {
      try {
        const res = await authApi.obtenerConfigNotificaciones();
        if (montado && res?.config) {
          setConfig({
            invitaciones: Boolean(res.config.invitaciones),
            mensajes: Boolean(res.config.mensajes),
            sistema: Boolean(res.config.sistema),
          });
        }
      } catch (e) {
        console.log('Error cargando preferencias de notificaciones:', e);
      } finally {
        if (montado) setCargandoConfig(false);
      }
    };
    cargarPreferencias();
    return () => { montado = false; };
  }, []);

  const handleToggle = async (campo, valor) => {
    const nuevaConfig = { ...config, [campo]: valor };
    setConfig(nuevaConfig);
    try {
      await authApi.actualizarConfigNotificaciones(nuevaConfig);
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar la preferencia en el servidor.');
      setConfig(config);
    }
  };

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
    <View style={tw`flex-1 bg-slate-900 p-5 justify-center`}>
      <View style={tw`items-center mb-6`}>
        <Text style={tw`text-[22px] font-bold text-white`}>Mi Perfil</Text>
        <Text style={tw`text-base text-slate-400 mt-1`}>
          ¡Hola, {usuario?.nombre || usuario?.username || usuario?.email || 'Jugador'}!
        </Text>
      </View>

      {/* COMPONENTE SELECTOR DE ESTADO */}
      <View style={tw`w-full bg-slate-800/80 p-3.5 rounded-2xl border border-white/10 mb-4`}>
        <Text style={tw`text-xs text-slate-400 mb-2.5 font-medium text-center`}>Estado de Disponibilidad</Text>
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

      {/* CONFIGURACIÓN DE PREFERENCIAS */}
      <View style={tw`w-full bg-slate-800/80 p-4 rounded-2xl border border-white/10 mb-6`}>
        <Text style={tw`text-xs font-bold text-white mb-3 flex-row items-center`}>
          🔔 Preferencias de Notificaciones Push
        </Text>

        {cargandoConfig ? (
          <ActivityIndicator color="#818cf8" style={tw`py-4`} />
        ) : (
          <>
            <View style={tw`flex-row items-center justify-between py-2 border-b border-white/5`}>
              <View style={tw`flex-1 mr-2`}>
                <Text style={tw`text-xs font-semibold text-white`}>Invitaciones a Salas</Text>
                <Text style={tw`text-[10px] text-slate-400`}>Avisos push al ser invitado a un grupo</Text>
              </View>
              <Switch
                value={config.invitaciones}
                onValueChange={(val) => handleToggle('invitaciones', val)}
                trackColor={{ false: '#334155', true: '#6366f1' }}
                thumbColor={config.invitaciones ? '#ffffff' : '#94a3b8'}
              />
            </View>

            <View style={tw`flex-row items-center justify-between py-2 border-b border-white/5`}>
              <View style={tw`flex-1 mr-2`}>
                <Text style={tw`text-xs font-semibold text-white`}>Nuevos Mensajes</Text>
                <Text style={tw`text-[10px] text-slate-400`}>Avisos push al recibir un mensaje privado</Text>
              </View>
              <Switch
                value={config.mensajes}
                onValueChange={(val) => handleToggle('mensajes', val)}
                trackColor={{ false: '#334155', true: '#6366f1' }}
                thumbColor={config.mensajes ? '#ffffff' : '#94a3b8'}
              />
            </View>

            <View style={tw`flex-row items-center justify-between py-2 pt-3`}>
              <View style={tw`flex-1 mr-2`}>
                <Text style={tw`text-xs font-semibold text-white`}>Notificaciones del Sistema</Text>
                <Text style={tw`text-[10px] text-slate-400`}>Novedades y alertas administrativas</Text>
              </View>
              <Switch
                value={config.sistema}
                onValueChange={(val) => handleToggle('sistema', val)}
                trackColor={{ false: '#334155', true: '#6366f1' }}
                thumbColor={config.sistema ? '#ffffff' : '#94a3b8'}
              />
            </View>
          </>
        )}
      </View>

      <TouchableOpacity 
        style={tw`bg-red-500/90 py-3.5 px-6 rounded-xl w-full items-center`} 
        onPress={handleCerrarSesion}
      >
        <Text style={tw`text-white font-bold text-xs`}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}