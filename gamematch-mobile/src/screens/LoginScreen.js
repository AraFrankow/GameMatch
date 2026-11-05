import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import tw from 'twrnc';

import { authApi } from '../api';
import { storage } from '../services/storage';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  scopes: ['profile', 'email'],
});

const RANGOS_EDAD = [
  { value: 'menor_18', label: 'Menor de 18' },
  { value: '18_25', label: '18 a 25' },
  { value: '26_35', label: '26 a 35' },
  { value: '36_mas', label: '36 o más' },
];

const OPCIONES_MODO_JUEGO = [
  { clave: 'casual', label: 'Casual' },
  { clave: 'competitivo', label: 'Competitivo' },
  { clave: 'ambos', label: 'Ambos' },
];

export default function LoginScreen({ onLoginExitoso }) {
  const [modo, setModo] = useState('login');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rangoEdad, setRangoEdad] = useState('18_25');
  const [modoJuego, setModoJuego] = useState('casual');

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const [googlePendiente, setGooglePendiente] = useState(null);
  const [rangoGoogle, setRangoGoogle] = useState('18_25');
  const [modoJuegoGoogle, setModoJuegoGoogle] = useState('casual');

  const resetFormulario = () => {
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRangoEdad('18_25');
    setModoJuego('casual');
  };

  const handleCambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    resetFormulario();
  };

  const handleSubmit = async () => {
    setError('');

    if (modo === 'registro') {
      if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
        return setError('Por favor completá todos los campos obligatorios');
      }
      if (password.length < 8) {
        return setError('La contraseña debe tener al menos 8 caracteres');
      }
      if (password !== confirmPassword) {
        return setError('Las contraseñas no coinciden');
      }
    } else {
      if (!email.trim() || !password.trim()) {
        return setError('Ingresá email y contraseña');
      }
    }

    setCargando(true);
    try {
      let data;
      if (modo === 'registro') {
        data = await authApi.registro({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
          rango_edad: rangoEdad,
          modo_juego: modoJuego,
        });
      } else {
        data = await authApi.login({
          email: email.trim().toLowerCase(),
          password,
        });
      }

      await storage.guardar('token', data.token);
      await storage.guardar('usuario', data.usuario);
      onLoginExitoso(data.token, data.usuario);
    } catch (err) {
      const mensajeError = err.response?.data?.error || err.error || err.message;
      setError(mensajeError || 'Error al procesar la solicitud');
    } finally {
      setCargando(false);
    }
  };

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
        const msg = err.response?.data?.error || err.message;
        setError(msg || 'Error al iniciar sesión con Google');
      }
    } finally {
      setCargando(false);
    }
  };

  const autenticarGoogleBackend = async (id_token, rango_edad = null, modo_juego = null) => {
    try {
      const payload = { id_token };
      if (rango_edad) payload.rango_edad = rango_edad;
      if (modo_juego) payload.modo_juego = modo_juego;

      const res = await authApi.google(payload);
      await storage.guardar('token', res.token);
      await storage.guardar('usuario', res.usuario);
      setGooglePendiente(null);
      onLoginExitoso(res.token, res.usuario);
    } catch (err) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.error || err.error || err.message || '';

      if (
        status === 400 ||
        errorMsg.includes('rango_edad') ||
        errorMsg.includes('modo_juego') ||
        errorMsg.includes('requeridos')
      ) {
        setGooglePendiente(id_token);
        setError('');
      } else {
        setError(errorMsg || 'Token de Google inválido o fallo en autenticación.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 bg-slate-900`}
    >
      <ScrollView contentContainerStyle={tw`flex-grow justify-center p-5`}>
        <View style={tw`bg-slate-800 p-6 rounded-2xl border border-white/10 shadow-xl`}>
          <Text style={tw`text-[26px] font-bold text-white text-center`}>GameMatch</Text>
          <Text style={tw`text-[13px] text-slate-400 text-center mb-5 mt-0.5`}>
            Encuentra tu Duo Perfecto
          </Text>

          {/* LOGIN / REGISTRO */}
          {!googlePendiente && (
            <View style={tw`flex-row bg-slate-900 p-1 rounded-xl mb-5`}>
              <TouchableOpacity
                onPress={() => handleCambiarModo('login')}
                style={tw.style(
                  'flex-1 py-2 rounded-lg items-center',
                  modo === 'login' ? 'bg-indigo-600' : 'bg-transparent'
                )}
              >
                <Text style={tw.style('text-xs font-bold', modo === 'login' ? 'text-white' : 'text-slate-400')}>
                  Iniciar Sesión
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleCambiarModo('registro')}
                style={tw.style(
                  'flex-1 py-2 rounded-lg items-center',
                  modo === 'registro' ? 'bg-indigo-600' : 'bg-transparent'
                )}
              >
                <Text style={tw.style('text-xs font-bold', modo === 'registro' ? 'text-white' : 'text-slate-400')}>
                  Registrarme
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {error ? (
            <View style={tw`bg-red-500/10 border border-red-500/30 p-3 rounded-xl mb-4`}>
              <Text style={tw`text-red-400 text-center text-xs font-medium`}>{error}</Text>
            </View>
          ) : null}

          {googlePendiente ? (
            <View style={tw`bg-slate-900 p-4 rounded-xl border border-indigo-500/30 mb-2`}>
              <Text style={tw`text-white font-bold text-sm mb-1`}>Completar Registro Google</Text>
              <Text style={tw`text-slate-400 text-xs mb-3`}>
                Elegí tu rango de edad y modo de juego para finalizar.
              </Text>

              <Text style={tw`text-xs text-slate-400 mb-1 font-medium`}>Rango de edad</Text>
              <View style={tw`flex-row flex-wrap gap-1 mb-3`}>
                {RANGOS_EDAD.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => setRangoGoogle(r.value)}
                    style={tw.style(
                      'px-2.5 py-1.5 rounded-lg border',
                      rangoGoogle === r.value ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-white/10'
                    )}
                  >
                    <Text style={tw`text-xs text-white`}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={tw`text-xs text-slate-400 mb-1 font-medium`}>Modo de juego</Text>
              <View style={tw`flex-row gap-1.5 mb-4`}>
                {OPCIONES_MODO_JUEGO.map((m) => (
                  <TouchableOpacity
                    key={m.clave}
                    onPress={() => setModoJuegoGoogle(m.clave)}
                    style={tw.style(
                      'flex-1 py-1.5 rounded-lg border items-center',
                      modoJuegoGoogle === m.clave ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-white/10'
                    )}
                  >
                    <Text style={tw`text-xs text-white font-semibold`}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={tw`bg-indigo-600 p-3.5 rounded-xl items-center`}
                onPress={() => autenticarGoogleBackend(googlePendiente, rangoGoogle, modoJuegoGoogle)}
                disabled={cargando}
              >
                {cargando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={tw`text-white font-bold text-xs`}>Finalizar Registro</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {modo === 'registro' && (
                <View style={tw`mb-3`}>
                  <Text style={tw`text-xs text-slate-400 mb-1 font-medium`}>Nombre de usuario</Text>
                  <TextInput
                    style={tw`bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-sm`}
                    placeholder="Ej: GamerPRO99"
                    placeholderTextColor="#64748b"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              )}

              <View style={tw`mb-3`}>
                <Text style={tw`text-xs text-slate-400 mb-1 font-medium`}>Email</Text>
                <TextInput
                  style={tw`bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-sm`}
                  placeholder="tu@email.com"
                  placeholderTextColor="#64748b"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={tw`mb-3`}>
                <Text style={tw`text-xs text-slate-400 mb-1 font-medium`}>Contraseña</Text>
                <TextInput
                  style={tw`bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-sm`}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {modo === 'registro' && (
                <View style={tw`mb-3`}>
                  <Text style={tw`text-xs text-slate-400 mb-1 font-medium`}>Confirmar Contraseña</Text>
                  <TextInput
                    style={tw`bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-sm`}
                    placeholder="••••••••"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              )}

              {modo === 'registro' && (
                <>
                  <Text style={tw`text-xs text-slate-400 mb-1 font-medium`}>Rango de edad</Text>
                  <View style={tw`flex-row flex-wrap gap-1 mb-3`}>
                    {RANGOS_EDAD.map((r) => (
                      <TouchableOpacity
                        key={r.value}
                        onPress={() => setRangoEdad(r.value)}
                        style={tw.style(
                          'px-2.5 py-1.5 rounded-lg border',
                          rangoEdad === r.value ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-900 border-white/10'
                        )}
                      >
                        <Text style={tw`text-xs text-white`}>{r.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={tw`text-xs text-slate-400 mb-1 font-medium`}>Modo de juego preferido</Text>
                  <View style={tw`flex-row gap-1.5 mb-4`}>
                    {OPCIONES_MODO_JUEGO.map((m) => (
                      <TouchableOpacity
                        key={m.clave}
                        onPress={() => setModoJuego(m.clave)}
                        style={tw.style(
                          'flex-1 py-2 rounded-xl border items-center',
                          modoJuego === m.clave ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-900 border-white/10'
                        )}
                      >
                        <Text style={tw.style('text-xs font-semibold', modoJuego === m.clave ? 'text-white' : 'text-slate-400')}>
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <TouchableOpacity
                style={tw`bg-indigo-600 p-3.5 rounded-xl items-center mt-2`}
                onPress={handleSubmit}
                disabled={cargando}
              >
                {cargando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={tw`text-white font-bold text-sm`}>
                    {modo === 'registro' ? 'Crear Cuenta' : 'Iniciar Sesión'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={tw`flex-row items-center my-4`}>
                <View style={tw`flex-1 h-px bg-white/10`} />
                <Text style={tw`text-slate-500 text-xs mx-3`}>o continuar con</Text>
                <View style={tw`flex-1 h-px bg-white/10`} />
              </View>

              <TouchableOpacity
                style={tw`bg-white p-3.5 rounded-xl items-center`}
                onPress={handleGoogleLogin}
                disabled={cargando}
              >
                <Text style={tw`text-slate-900 font-bold text-xs`}>Google</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}