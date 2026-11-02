import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titulo}>GameMatch Mobile</Text>
        <Text style={styles.subtitulo}>Encuentra tu Duo Perfecto</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email..."
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña..."
          placeholderTextColor="#64748b"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.boton} onPress={handleLogin} disabled={cargando}>
          {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBoton}>Iniciar Sesión</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boton, styles.botonGoogle]}
          onPress={handleGoogleLogin}
          disabled={cargando}
        >
          <Text style={styles.textoBotonGoogle}>Continuar con Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#1e293b', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtitulo: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 24, marginTop: 4 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 12, color: '#fff', marginBottom: 12 },
  boton: { backgroundColor: '#6366f1', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  botonGoogle: { backgroundColor: '#fff', marginTop: 12 },
  textoBoton: { color: '#fff', fontWeight: '600' },
  textoBotonGoogle: { color: '#0f172a', fontWeight: 'bold' },
  error: { color: '#ef4444', textAlign: 'center', marginBottom: 12, fontSize: 13 }
});