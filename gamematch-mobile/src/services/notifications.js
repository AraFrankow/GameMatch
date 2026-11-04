import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const esExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export async function registrarNotificacionesPush() {
  if (esExpoGo) {
    console.log('Modo Expo Go: Las notificaciones nativas con FCM requieren un Development Build.');
    return null;
  }

  try {
    const Device = require('expo-device');
    const Notifications = require('expo-notifications');

    if (!Device?.isDevice) return null;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : {});

    return tokenData?.data || null;
  } catch (error) {
    console.log('Aviso notificaciones push:', error.message);
    return null;
  }
}

export default registrarNotificacionesPush;