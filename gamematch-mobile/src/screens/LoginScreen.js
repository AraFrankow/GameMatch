import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import tw from 'twrnc';

import { authApi } from '../api';
import { storage } from '../services/storage';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  scopes: ['profile', 'email'],
});

export default function LoginScreen({ onLoginExitoso }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleGoogleLogin = async () => {
    setCargando(true);
    setError('');
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      const idToken = response.data?.idToken || response.idToken;

      if (idToken) {
        await autenticarGoogleBackend(idToken);
      } else {
        setError('No se pudo obtener el token de Google');
      }
    } catch (err) {
      if (err.code !== 'ASYNC_OP_IN_PROGRESS') {
        setError(err.message || 'Error al iniciar sesión con Google');
      }
    } finally {
      setCargando(false);
    }
  };

  const autenticarGoogleBackend = async (id_token) => {
    try {
      const res = await authApi.google({ id_token });
      await storage.guardar('token', res.token);
      await storage.guardar('usuario', res.usuario);
      onLoginExitoso(res.token, res.usuario);
    } catch (err) {
      setError(err.message || 'Error al autenticar en el servidor');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return setError('Ingresá email y contraseña');
    setCargando(true);
    setError('');
    try {
      const data = await authApi.login({ email, password });
      await storage.guardar('token', data.token);
      await storage.guardar('usuario', data.usuario);
      onLoginExitoso(data.token, data.usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-slate-900 justify-center p-5`}>
      <View style={tw`bg-slate-800 p-6 rounded-2xl border border-white/10`}>
        <Text style={tw`text-[26px] font-bold text-white text-center`}>GameMatch Mobile</Text>
        <Text style={tw`text-[13px] text-slate-400 text-center mb-6 mt-1`}>Encuentra tu Duo Perfecto</Text>

        {error ? <Text style={tw`text-red-500 text-center mb-3 text-[13px]`}>{error}</Text> : null}

        <TextInput
          style={tw`bg-slate-900 border border-white/10 rounded-xl p-3 text-white mb-3`}
          placeholder="Email..."
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={tw`bg-slate-900 border border-white/10 rounded-xl p-3 text-white mb-3`}
          placeholder="Contraseña..."
          placeholderTextColor="#64748b"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={tw`bg-indigo-500 p-3.5 rounded-xl items-center mt-2`} onPress={handleLogin} disabled={cargando}>
          {cargando ? <ActivityIndicator color="#fff" /> : <Text style={tw`text-white font-semibold`}>Iniciar Sesión</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`bg-white p-3.5 rounded-xl items-center mt-3`}
          onPress={handleGoogleLogin}
          disabled={cargando}
        >
          <Text style={tw`text-slate-900 font-bold`}>Continuar con Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}