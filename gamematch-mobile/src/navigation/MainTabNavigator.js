import React, { createContext, useEffect, useRef, useState } from 'react';
import { View, AppState } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import HomeScreen from '../screens/HomeScreen';
import SalasScreen from '../screens/SalasScreen';
import PerfilScreen from '../screens/PerfilScreen';
import CampanitaModal from '../components/CampanitaModal';

import { salasApi, authApi, usuariosApi } from '../api';
import { storage } from '../services/storage';
import { conectarSocket, obtenerSocket } from '../services/socket';
import registrarNotificacionesPush from '../services/notifications';

const Tab = createBottomTabNavigator();
export const AuthContext = createContext();

export default function MainTabNavigator({ usuario, onCerrarSesion }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [totalSinLeer, setTotalSinLeer] = useState(0);
  const [estadoUsuario, setEstadoUsuario] = useState(usuario?.estado || 'conectado');

  const [notificaciones, setNotificaciones] = useState([]);
  const [modalCampanitaVisible, setModalCampanitaVisible] = useState(false);

  const appStateRef = useRef(AppState.currentState);
  const estadoUsuarioRef = useRef(estadoUsuario);

  useEffect(() => {
    estadoUsuarioRef.current = estadoUsuario;
  }, [estadoUsuario]);

  useEffect(() => {
    const procesarRespuestaNotificacion = (response) => {
      if (!response) return;

      const data = response.notification?.request?.content?.data || {};
      const tipo = data.tipo;
      const salaId = data.sala_id || data.salaId;

      if (salaId && tipo !== 'invitacion_sala') {
        navigation.navigate('Salas', {
          salaDirecta: {
            id: Number(salaId),
            emisor: {
              id: data.emisor_id,
              username: data.emisor_nombre,
              foto_perfil: data.emisor_foto
            }
          }
        });
      } else {
        navigation.navigate('Buscar');
        setModalCampanitaVisible(true);
      }
    };

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      procesarRespuestaNotificacion(response);
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        procesarRespuestaNotificacion(response);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  useEffect(() => {
    let socketInstancia = null;
    let appStateSubscription = null;

    const inicializarGlobal = async () => {
      const user = usuario || (await storage.obtener('usuario'));
      if (!user) return;

      try {
        const tokenPush = await registrarNotificacionesPush();
        if (tokenPush && usuariosApi?.actualizarPushToken) {
          await usuariosApi.actualizarPushToken(tokenPush);
        }
      } catch (e) {
        console.log('Aviso al guardar push token:', e?.message || e);
      }

      try {
        if (authApi.misInvitaciones) {
          const resInv = await authApi.misInvitaciones();
          setNotificaciones(resInv.invitaciones || resInv || []);
        }
      } catch (err) {
        console.log('Error al cargar invitaciones:', err);
      }

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

        const handleNuevaInvitacion = (invitacion) => {
          setNotificaciones((prev) => [invitacion, ...prev]);
        };

        socketInstancia.off('notificacion:invitacion', handleNuevaInvitacion);
        socketInstancia.on('notificacion:invitacion', handleNuevaInvitacion);

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
        socketInstancia.off('notificacion:invitacion');
      }
    };
  }, [usuario]);

  const handleAceptarInvitacion = async (notif) => {
    try {
      if (authApi.unirseASala) {
        await authApi.unirseASala(notif.sala_id);
      }
      const socketInstancia = obtenerSocket();
      if (socketInstancia) {
        socketInstancia.emit('notificar_union_sala', {
          sala_id: notif.sala_id,
          usuario_id: usuario?.id,
        });
      }
      setNotificaciones((prev) => prev.filter((n) => (n.id || n.sala_id) !== (notif.id || notif.sala_id)));
      setModalCampanitaVisible(false);
    } catch (err) {
      console.error('Error al aceptar invitación:', err);
    }
  };

  const handleRechazarInvitacion = async (notif) => {
    try {
      if (authApi.rechazarInvitacion) {
        await authApi.rechazarInvitacion(notif.id || notif.sala_id);
      }
      setNotificaciones((prev) => prev.filter((n) => (n.id || n.sala_id) !== (notif.id || notif.sala_id)));
    } catch (err) {
      setNotificaciones((prev) => prev.filter((n) => (n.id || n.sala_id) !== (notif.id || notif.sala_id)));
    }
  };

  const handleCambiarEstado = (nuevoEstado) => {
    const socketInstancia = obtenerSocket();
    if (socketInstancia) {
      socketInstancia.emit('cambiar_estado_manual', { estado: nuevoEstado });
      setEstadoUsuario(nuevoEstado);
    }
  };

  const renderCampanita = () => (
    <CampanitaModal
      notificaciones={notificaciones}
      visible={modalCampanitaVisible}
      onOpen={() => setModalCampanitaVisible(true)}
      onClose={() => setModalCampanitaVisible(false)}
      onAceptar={handleAceptarInvitacion}
      onRechazar={handleRechazarInvitacion}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
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
        <Tab.Screen name="Buscar">
          {(props) => <HomeScreen {...props} usuario={usuario} campanita={renderCampanita()} />}
        </Tab.Screen>

        <Tab.Screen
          name="Salas"
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
          }}
        >
          {(props) => <SalasScreen {...props} usuario={usuario} campanita={renderCampanita()} />}
        </Tab.Screen>

        <Tab.Screen name="Perfil">
          {(props) => (
            <PerfilScreen
              {...props}
              usuario={usuario}
              estadoUsuario={estadoUsuario}
              onCambiarEstado={handleCambiarEstado}
              onCerrarSesion={onCerrarSesion}
              campanita={renderCampanita()}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
}