import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import SalasScreen from '../screens/SalasScreen';
import PerfilScreen from '../screens/PerfilScreen';

import { salasApi } from '../api';
import { storage } from '../services/storage';
import { conectarSocket, obtenerSocket } from '../services/socket';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator({ usuario, onCerrarSesion }) {
  const insets = useSafeAreaInsets();
  const [totalSinLeer, setTotalSinLeer] = useState(0);

  useEffect(() => {
    let socketInstancia = null;

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
      if (socketInstancia) {
        socketInstancia.off('mensaje_nuevo');
      }
    };
  }, [usuario]);

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
        {(props) => <PerfilScreen {...props} usuario={usuario} onCerrarSesion={onCerrarSesion} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}