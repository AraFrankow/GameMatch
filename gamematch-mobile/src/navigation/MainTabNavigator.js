import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import SalasScreen from '../screens/SalasScreen';
import PerfilScreen from '../screens/PerfilScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator({ usuario, onCerrarSesion }) {
  const insets = useSafeAreaInsets();

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
      <Tab.Screen name="Salas" component={SalasScreen} options={{ tabBarLabel: 'Salas' }} />
      <Tab.Screen name="Perfil">
        {(props) => <PerfilScreen {...props} usuario={usuario} onCerrarSesion={onCerrarSesion} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}