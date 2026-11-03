import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { registrarNotificacionesPush } from './src/services/notifications';
import { navigationRef, navegarASala } from './src/navigation/navigationRef';
import LoginScreen from './src/screens/LoginScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import { storage } from './src/services/storage';

const esExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export default function App() {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    try {
      const tokenGuardado = await storage.obtener('token');
      const usuarioGuardado = await storage.obtener('usuario');
      if (tokenGuardado) {
        setToken(tokenGuardado);
        setUsuario(usuarioGuardado);
      }
    } catch (e) {
      console.error('Error al recuperar sesión:', e);
    } finally {
      setCargando(false);
    }
  };

  const handleLoginExitoso = (nuevoToken, datosUsuario) => {
    setToken(nuevoToken);
    setUsuario(datosUsuario);
  };

  const handleCerrarSesion = async () => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.log('Google SignOut error:', error);
    }
    await storage.eliminar('token');
    await storage.eliminar('usuario');
    setToken(null);
    setUsuario(null);
  };

  useEffect(() => {
    if (!esExpoGo && token) {
      registrarNotificacionesPush();
    }
  }, [token]);

  useEffect(() => {
    if (esExpoGo || !token || !isNavigationReady || !lastResponse) return;

    const sala_id = lastResponse.notification.request.content.data?.sala_id;
    if (sala_id) {
      setTimeout(() => navegarASala(sala_id), 300);
    }
  }, [lastResponse, token, isNavigationReady]);

  useEffect(() => {
    if (esExpoGo || !token || !isNavigationReady) return;

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const sala_id = response.notification.request.content.data?.sala_id;
      if (sala_id) navegarASala(sala_id);
    });

    return () => subscription.remove();
  }, [token, isNavigationReady]);

  if (cargando) {
    return (
      <SafeAreaProvider>
        <View style={styles.cargandoContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer 
        ref={navigationRef} 
        onReady={() => setIsNavigationReady(true)}
      >
        {token ? (
          <MainTabNavigator usuario={usuario} onCerrarSesion={handleCerrarSesion} />
        ) : (
          <LoginScreen onLoginExitoso={handleLoginExitoso} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  cargandoContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});