import React, { createContext, useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppState } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import SalasScreen from '../screens/SalasScreen';
import PerfilScreen from '../screens/PerfilScreen';

import { salasApi } from '../api';
import { storage } from '../services/storage';
import { conectarSocket, obtenerSocket } from '../services/socket';

const Tab = createBottomTabNavigator();
export const AuthContext = createContext();

export default function MainTabNavigator({ usuario, onCerrarSesion }) {
  const insets = useSafeAreaInsets();
  const [totalSinLeer, setTotalSinLeer] = useState(0);
  const [estadoUsuario, setEstadoUsuario] = useState(usuario?.estado || 'conectado');

  const appStateRef = useRef(AppState.currentState);
  const estadoUsuarioRef = useRef(estadoUsuario);

  useEffect(() => {
    estadoUsuarioRef.current = estadoUsuario;
  }, [estadoUsuario]);

  useEffect(() => {
    let socketInstancia = null;
    let appStateSubscription = null;

    const inicializarGlobal = async () => {
      const user = usuario || (await storage.obtener('usuario'));
      if (!user) return;

      await conectarSocket();
      socketInstancia = obtenerSocket();

      try {
        const data = await salasApi.listarMisSalas();
        const lista = Array.isArray(data) ? data : data.salas || [];

        let conteo = 0;
        lista.forEach((s) => {
          const sinLeer = Number(
            s.mensajes_sin_leer ?? s.sin_leer ?? s.no_leidos ?? s.cant_sin_leer ?? s.unread_count ?? s.unread ?? 0
          );
          conteo += sinLeer;

          if (socketInstancia) {
            socketInstancia.emit('unirse_sala', { sala_id: s.id });
          }
        });

        setTotalSinLeer(conteo);
      } catch (err) {
        console.error('Error al obtener no leídos globales:', err);
      }

      if (socketInstancia) {
        if (estadoUsuarioRef.current !== 'desconectado') {
          socketInstancia.emit('cambiar_estado_manual', { estado: 'conectado' });
          setEstadoUsuario('conectado');
        }

        appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
          if (estadoUsuarioRef.current === 'desconectado') {
            appStateRef.current = nextAppState;
            return;
          }

          if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
            socketInstancia.emit('cambiar_estado_manual', { estado: 'conectado' });
            setEstadoUsuario('conectado');
          } else if (nextAppState.match(/inactive|background/)) {
            socketInstancia.emit('cambiar_estado_manual', { estado: 'ausente' });
            setEstadoUsuario('ausente');
          }
          appStateRef.current = nextAppState;
        });

        const handleNuevoMensajeGlobal = (mensaje) => {
          const miId = user?.id || user?.usuario?.id;
          const emisorId = mensaje.emisor_id || mensaje.emisor?.id || mensaje.usuario_id;

          if (miId && Number(emisorId) !== Number(miId)) {
            setTotalSinLeer((prev) => prev + 1);
          }
        };

        socketInstancia.off('mensaje_nuevo', handleNuevoMensajeGlobal);
        socketInstancia.on('mensaje_nuevo', handleNuevoMensajeGlobal);
      }
    };

    inicializarGlobal();

    return () => {
      if (appStateSubscription) appStateSubscription.remove();
      if (socketInstancia) {
        socketInstancia.off('mensaje_nuevo');
      }
    };
  }, [usuario]);

  const handleCambiarEstado = (nuevoEstado) => {
    const socketInstancia = obtenerSocket();
    if (socketInstancia) {
      socketInstancia.emit('cambiar_estado_manual', { estado: nuevoEstado });
      setEstadoUsuario(nuevoEstado);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: 'rgba(255,255,255,0.08)',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Buscar') iconName = 'game-controller-outline';
          else if (route.name === 'Salas') iconName = 'chatbubbles-outline';
          else if (route.name === 'Perfil') iconName = 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Buscar" component={HomeScreen} options={{ tabBarLabel: 'Buscar Dúo' }} />
      <Tab.Screen
        name="Salas"
        component={SalasScreen}
        options={{
          title: 'Chats',
          tabBarLabel: 'Chats',
          tabBarBadge: totalSinLeer > 0 ? (totalSinLeer > 99 ? '99+' : totalSinLeer) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#6366f1',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: 'bold',
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen name="Perfil">
        {(props) => (
          <PerfilScreen
            {...props}
            usuario={usuario}
            estadoUsuario={estadoUsuario}
            onCambiarEstado={handleCambiarEstado}
            onCerrarSesion={onCerrarSesion}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}