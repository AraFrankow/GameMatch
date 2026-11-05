import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import tw from 'twrnc';

import CustomModal from '../components/CustomModal';
import { storage } from '../services/storage';
import { obtenerSocket } from '../services/socket';
import { authApi } from '../api';

const OPCIONES_ESTADO = [
  { clave: 'conectado', label: 'Conectado', color: 'bg-emerald-500' },
  { clave: 'ausente', label: 'Ausente', color: 'bg-amber-500' },
  { clave: 'desconectado', label: 'Desconectado', color: 'bg-slate-500' },
];

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

const REGIONES_RIOT = ['las', 'lan', 'br1', 'na1', 'euw1', 'kr'];

export default function PerfilScreen({ usuario: usuarioProp, estadoUsuario, onCambiarEstado, onCerrarSesion, onActualizarUsuario }) {
  const estadoActual = estadoUsuario || usuarioProp?.estado || 'conectado';

  const [perfil, setPerfil] = useState(null);
  const [editando, setEditando] = useState(false);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  const [form, setForm] = useState({
    username: usuarioProp?.username || '',
    foto_perfil: usuarioProp?.foto_perfil || '',
    rango_edad: usuarioProp?.rango_edad || '18_25',
    modo_juego: usuarioProp?.modo_juego || 'casual',
    biografia: usuarioProp?.biografia || '',
  });

  const [cargandoConfig, setCargandoConfig] = useState(true);
  const [configNotif, setConfigNotif] = useState({
    invitaciones: true,
    mensajes: true,
    sistema: true,
  });

  const [datosRiot, setDatosRiot] = useState(null);
  const [datosSteam, setDatosSteam] = useState(null);
  const [juegosLista, setJuegosLista] = useState([]);
  const [mostrarRiotInput, setMostrarRiotInput] = useState(false);
  const [mostrarSteamInput, setMostrarSteamInput] = useState(false);
  const [riotForm, setRiotForm] = useState({ game_name: '', tag_line: '', region: 'las' });
  const [steamIdInput, setSteamIdInput] = useState('');
  const [cargandoIntegracion, setCargandoIntegracion] = useState(false);

  const [mostrarModalCamara, setMostrarModalCamara] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('front');
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [procesandoIA, setProcesandoIA] = useState(false);
  const [errorCamara, setErrorCamara] = useState('');
  const [edadEstimadaRes, setEdadEstimadaRes] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    cargarDatosCompletos();
  }, []);

  const cargarDatosCompletos = async () => {
    try {
      if (authApi?.obtenerMiPerfil) {
        const resPerfil = await authApi.obtenerMiPerfil();
        const p = resPerfil?.perfil || resPerfil?.usuario || resPerfil;
        if (p) {
          setPerfil(p);
          setDatosRiot(p.riot || null);
          setDatosSteam(p.steam || null);
          setJuegosLista(p.juegos || []);
          setForm({
            username: p.username || '',
            foto_perfil: p.foto_perfil || '',
            rango_edad: p.rango_edad || '18_25',
            modo_juego: p.modo_juego || 'casual',
            biografia: p.biografia || '',
          });
          await storage.guardar('usuario', p);
          if (onActualizarUsuario) onActualizarUsuario(p);
        }
      }

      if (authApi?.obtenerConfigNotificaciones) {
        const resConfig = await authApi.obtenerConfigNotificaciones();
        if (resConfig?.config) {
          setConfigNotif({
            invitaciones: Boolean(resConfig.config.invitaciones),
            mensajes: Boolean(resConfig.config.mensajes),
            sistema: Boolean(resConfig.config.sistema),
          });
        }
      }
    } catch (e) {
      console.log('Error al cargar datos del perfil:', e?.message || e);
    } finally {
      setCargandoPerfil(false);
      setCargandoConfig(false);
    }
  };

  const iniciarCamaraModal = async () => {
    setErrorCamara('');
    setEdadEstimadaRes(null);

    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        setErrorCamara('Permiso de cámara denegado. Permitilo desde los ajustes de tu celular.');
        return;
      }
    }
    setCamaraActiva(true);
  };

  const capturarYVerificarEdad = async () => {
    if (!cameraRef.current) return;

    setProcesandoIA(true);
    setErrorCamara('');
    setEdadEstimadaRes(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: true,
        skipProcessing: true,
      });

      if (!photo?.base64) {
        throw new Error('No se pudo procesar la captura en formato Base64.');
      }

      const imagenBase64 = `data:image/jpeg;base64,${photo.base64}`;

      if (authApi?.verificarEdad) {
        const res = await authApi.verificarEdad(imagenBase64);

        if (res?.exito === false) {
          throw new Error(res.message || res.error || 'Error al verificar la foto.');
        }

        const edad = res?.edad_estimada ?? res?.edadEstimada;
        if (edad !== undefined && edad !== null) {
          setEdadEstimadaRes(edad);
        }

        setCamaraActiva(false);
        setMostrarModalCamara(false);
        Alert.alert('¡Verificación Exitosa!', res.message || 'Tu identidad fue verificada.');
        await cargarDatosCompletos();
      }
    } catch (err) {
      setErrorCamara(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'No se pudo completar la verificación por cámara.'
      );
    } finally {
      setProcesandoIA(false);
    }
  };

  const cerrarModalCamara = () => {
    setMostrarModalCamara(false);
    setCamaraActiva(false);
    setErrorCamara('');
    setEdadEstimadaRes(null);
  };

  const handleGuardarPerfil = async () => {
    setGuardandoPerfil(true);
    try {
      if (authApi?.actualizarPerfil) {
        const res = await authApi.actualizarPerfil(form);
        const usuarioActualizado = res?.usuario || res?.perfil;
        if (usuarioActualizado) {
          setPerfil((prev) => ({ ...prev, ...usuarioActualizado }));
          setEditando(false);
          await storage.guardar('usuario', usuarioActualizado);
          if (onActualizarUsuario) onActualizarUsuario(usuarioActualizado);
          Alert.alert('¡Éxito!', 'Perfil actualizado correctamente.');
        }
      }
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || err?.message || 'No se pudieron guardar los cambios');
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const handleToggleNotif = async (campo, valor) => {
    const nuevaConfig = { ...configNotif, [campo]: valor };
    setConfigNotif(nuevaConfig);
    try {
      if (authApi?.actualizarConfigNotificaciones) {
        await authApi.actualizarConfigNotificaciones(nuevaConfig);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar la preferencia.');
      setConfigNotif(configNotif);
    }
  };

  const handleSeleccionarEstado = async (clave) => {
    if (onCambiarEstado) onCambiarEstado(clave);
    try {
      const u = await storage.obtener('usuario');
      if (u) await storage.guardar('usuario', { ...u, estado: clave });
    } catch (e) {
      console.error('Error al guardar estado:', e);
    }
  };

  const handleVincularRiot = async () => {
    if (!riotForm.game_name.trim() || !riotForm.tag_line.trim()) {
      return Alert.alert('Atención', 'Completá tu nombre de juego y Tag (ej: Faker #KR1)');
    }
    setCargandoIntegracion(true);
    try {
      if (authApi?.vincularRiot) {
        const res = await authApi.vincularRiot(riotForm);
        if (res.exito || res.integracion) {
          setMostrarRiotInput(false);
          setRiotForm({ game_name: '', tag_line: '', region: 'las' });
          cargarDatosCompletos();
          Alert.alert('¡Vinculado!', 'Tu cuenta de Riot Games fue asociada.');
        }
      }
    } catch (err) {
      Alert.alert('Error Riot', err?.message || 'No se pudo vincular Riot ID');
    } finally {
      setCargandoIntegracion(false);
    }
  };

  const handleVincularSteam = async () => {
    if (!steamIdInput.trim()) {
      return Alert.alert('Atención', 'Ingresá un SteamID64 válido');
    }
    setCargandoIntegracion(true);
    try {
      if (authApi?.vincularSteam) {
        const res = await authApi.vincularSteam(steamIdInput.trim());
        if (res.integracion || res.importacion) {
          setMostrarSteamInput(false);
          setSteamIdInput('');
          cargarDatosCompletos();
          Alert.alert('¡Vinculado!', 'Tus juegos de Steam fueron importados.');
        }
      }
    } catch (err) {
      Alert.alert('Error Steam', err?.message || 'No se pudo vincular Steam');
    } finally {
      setCargandoIntegracion(false);
    }
  };

  const handleDesvincular = (tipo) => {
    Alert.alert(
      'Desvincular Cuenta',
      `¿Querés desvincular tu cuenta de ${tipo.toUpperCase()}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            try {
              if (tipo === 'riot' && authApi?.desvincularRiot) await authApi.desvincularRiot();
              if (tipo === 'steam' && authApi?.desvincularSteam) await authApi.desvincularSteam();
              cargarDatosCompletos();
            } catch (err) {
              Alert.alert('Error', err?.message || 'No se pudo desvincular');
            }
          }
        }
      ]
    );
  };

  const handleCancelarSuscripcion = () => {
    Alert.alert(
      'Cancelar Renovación',
      '¿Seguro que querés desactivar la renovación automática de tu suscripción?',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (authApi?.cancelarSuscripcion) {
                const res = await authApi.cancelarSuscripcion();
                if (res.exito) {
                  Alert.alert('Suscripción', res.mensaje || 'Renovación automática desactivada.');
                  cargarDatosCompletos();
                }
              }
            } catch (err) {
              Alert.alert('Error', err?.message || 'Error al cancelar la suscripción.');
            }
          }
        }
      ]
    );
  };

  const handleCerrarSesion = () => {
    const socket = obtenerSocket();
    if (socket && socket.connected) {
      socket.emit('cambiar_estado_manual', { estado: 'desconectado' });
    }
    if (onCerrarSesion) onCerrarSesion();
  };

  const usuarioFinal = perfil || usuarioProp;
  const estaVerificado = Boolean(usuarioFinal?.verificado);
  const esPremium = Boolean(usuarioFinal?.es_premium);
  const edadMostrar = usuarioFinal?.edad_estimada;
  const rangoActual = usuarioFinal?.rango_edad || form.rango_edad;
  const modoJuegoActual = usuarioFinal?.modo_juego || form.modo_juego;
  const esMayorDeEdad = rangoActual !== 'menor_18';
  const rangoTexto = RANGOS_EDAD.find((r) => r.value === rangoActual)?.label || rangoActual;

  if (cargandoPerfil) {
    return (
      <View style={tw`flex-1 bg-slate-900 justify-center items-center`}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={tw`text-slate-400 text-xs mt-3`}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-900`} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={tw`p-4 pb-12`} keyboardShouldPersistTaps="handled">
        
        <View style={tw`bg-slate-800/80 p-5 rounded-2xl border border-white/10 mb-4 items-center`}>
          <View style={tw.style(
            'w-24 h-24 rounded-full bg-slate-700 overflow-hidden items-center justify-center border-2 mb-3',
            esPremium ? 'border-amber-400' : 'border-indigo-500/50'
          )}>
            {form.foto_perfil ? (
              <Image source={{ uri: form.foto_perfil }} style={tw`w-full h-full`} />
            ) : (
              <Text style={tw`text-3xl font-bold text-white`}>
                {(form.username?.[0] || 'U').toUpperCase()}
              </Text>
            )}
          </View>

          <Text style={tw`text-xl font-bold text-white text-center`}>
            {form.username}
          </Text>
          <Text style={tw`text-xs text-slate-400 mt-0.5`}>{usuarioFinal?.email}</Text>

          {/* INSIGNIAS */}
          <View style={tw`flex-row flex-wrap justify-center items-center gap-1.5 mt-3`}>
            {estaVerificado ? (
              <View style={tw`bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full flex-row items-center`}>
                <Ionicons name="checkmark-circle" size={14} color="#34d399" style={tw`mr-1`} />
                <Text style={tw`text-emerald-400 text-[11px] font-semibold`}>
                  Verificado {edadMostrar ? `(${edadMostrar} años)` : ''}
                </Text>
              </View>
            ) : null}

            {esPremium ? (
              <View style={tw`bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-full flex-row items-center`}>
                <Text style={tw`text-amber-300 text-[11px] font-semibold`}>⭐ Suscripto</Text>
              </View>
            ) : null}

            <View style={tw`bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 rounded-full`}>
              <Text style={tw`text-indigo-300 text-[11px] font-semibold`}>{rangoTexto}</Text>
            </View>

            <View style={tw`bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 rounded-full`}>
              <Text style={tw`text-indigo-300 text-[11px] font-semibold capitalize`}>🎮 {modoJuegoActual}</Text>
            </View>
          </View>

          {!editando ? (
            <TouchableOpacity
              style={tw`mt-4 bg-indigo-600 px-4 py-2 rounded-xl flex-row items-center`}
              onPress={() => setEditando(true)}
            >
              <Ionicons name="create-outline" size={16} color="#fff" style={tw`mr-1.5`} />
              <Text style={tw`text-white text-xs font-semibold`}>Editar perfil</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* EDICIÓN DE PERFIL */}
        {editando ? (
          <View style={tw`bg-slate-800/80 p-4 rounded-2xl border border-indigo-500/30 mb-4`}>
            <Text style={tw`text-sm font-bold text-white mb-3`}>Editar Información</Text>

            <Text style={tw`text-xs text-slate-400 mb-1`}>Nombre de usuario</Text>
            <TextInput
              style={tw`bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm mb-3`}
              value={form.username}
              onChangeText={(text) => setForm({ ...form, username: text })}
            />

            <Text style={tw`text-xs text-slate-400 mb-1`}>URL Foto de Perfil</Text>
            <TextInput
              style={tw`bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm mb-3`}
              placeholder="https://ejemplo.com/avatar.jpg"
              placeholderTextColor="#64748b"
              value={form.foto_perfil}
              onChangeText={(text) => setForm({ ...form, foto_perfil: text })}
            />

            <Text style={tw`text-xs text-slate-400 mb-1`}>Rango de edad</Text>
            <View style={tw`flex-row flex-wrap gap-1.5 mb-3`}>
              {RANGOS_EDAD.map((r) => {
                const opcionBloqueada = esMayorDeEdad && r.value === 'menor_18';
                const esSeleccionado = form.rango_edad === r.value;

                return (
                  <TouchableOpacity
                    key={r.value}
                    disabled={opcionBloqueada}
                    onPress={() => {
                      if (opcionBloqueada) {
                        Alert.alert('Restricción', 'No podés cambiar tu rango de edad a menor de 18 años.');
                        return;
                      }
                      setForm({ ...form, rango_edad: r.value });
                    }}
                    style={tw.style(
                      'px-3 py-1.5 rounded-lg border',
                      esSeleccionado
                        ? 'bg-indigo-600 border-indigo-500'
                        : 'bg-slate-900 border-white/10',
                      opcionBloqueada && 'opacity-40 bg-slate-900 border-white/5'
                    )}
                  >
                    <Text style={tw.style('text-xs', opcionBloqueada ? 'text-slate-500' : 'text-white')}>
                      {r.label} {opcionBloqueada ? '(No permitido)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={tw`text-xs text-slate-400 mb-1`}>Modo de Juego</Text>
            <View style={tw`flex-row gap-1.5 mb-3`}>
              {OPCIONES_MODO_JUEGO.map((modo) => {
                const seleccionado = form.modo_juego === modo.clave;
                return (
                  <TouchableOpacity
                    key={modo.clave}
                    onPress={() => setForm({ ...form, modo_juego: modo.clave })}
                    style={tw.style(
                      'flex-1 py-2 rounded-xl border items-center',
                      seleccionado ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-900 border-white/10'
                    )}
                  >
                    <Text style={tw.style('text-xs font-semibold', seleccionado ? 'text-white' : 'text-slate-400')}>
                      {modo.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={tw`text-xs text-slate-400 mb-1`}>Biografía / Presentación</Text>
            <TextInput
              style={tw`bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm mb-4 min-h-[70px]`}
              multiline
              numberOfLines={3}
              placeholder="Contanos qué juegos jugás..."
              placeholderTextColor="#64748b"
              value={form.biografia}
              onChangeText={(text) => setForm({ ...form, biografia: text })}
            />

            <View style={tw`flex-row justify-end gap-2`}>
              <TouchableOpacity
                style={tw`bg-slate-700 px-4 py-2 rounded-xl`}
                onPress={() => setEditando(false)}
              >
                <Text style={tw`text-white text-xs`}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`bg-indigo-600 px-4 py-2 rounded-xl`}
                onPress={handleGuardarPerfil}
                disabled={guardandoPerfil}
              >
                {guardandoPerfil ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={tw`text-white text-xs font-semibold`}>Guardar cambios</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={tw`bg-slate-800/80 p-4 rounded-2xl border border-white/10 mb-4`}>
            <Text style={tw`text-xs uppercase text-slate-400 font-semibold mb-1`}>Sobre mí</Text>
            <Text style={tw`text-slate-200 text-xs leading-5`}>
              {form.biografia || 'Sin descripción por el momento.'}
            </Text>
          </View>
        )}

        {/* ESTADO DE DISPONIBILIDAD */}
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

        {/* ESTADO DE LA CUENTA (PREMIUM / GRATUITO) */}
        <View style={tw`bg-slate-800/80 p-4 rounded-2xl border border-white/10 mb-4`}>
          <Text style={tw`text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5`}>
            Estado de la cuenta
          </Text>

          {esPremium ? (
            <View style={tw`bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl`}>
              <View style={tw`flex-row items-center mb-2`}>
                <Text style={tw`text-2xl mr-2`}>⭐</Text>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-amber-300 font-bold text-sm`}>GameMatch Premium Activo</Text>
                  <Text style={tw`text-slate-400 text-[11px]`}>
                    {usuarioFinal?.cancel_at_period_end
                      ? 'Cancelado (Período Pagado)'
                      : 'Plan Mensual · Renovación cada 30 días'}
                  </Text>
                </View>
              </View>

              {!usuarioFinal?.cancel_at_period_end ? (
                <TouchableOpacity
                  style={tw`mt-2 bg-red-500/15 border border-red-500/30 py-2 rounded-xl items-center`}
                  onPress={handleCancelarSuscripcion}
                >
                  <Text style={tw`text-red-300 text-xs font-semibold`}>Cancelar renovación</Text>
                </TouchableOpacity>
              ) : (
                <Text style={tw`text-xs text-red-300 text-center mt-1`}>
                  Vence al finalizar los 30 días
                </Text>
              )}
            </View>
          ) : (
            <View style={tw`bg-slate-900 p-3.5 rounded-xl border border-white/5 flex-row items-center justify-between`}>
              <View style={tw`flex-1 mr-2`}>
                <Text style={tw`text-white font-semibold text-xs`}>Plan Gratuito</Text>
                <Text style={tw`text-slate-400 text-[11px]`}>Filtrá por reputación y rol en la comunidad</Text>
              </View>
              <View style={tw`bg-indigo-600/30 border border-indigo-500/40 px-3 py-1.5 rounded-xl`}>
                <Text style={tw`text-indigo-300 font-bold text-xs`}>⭐ Premium</Text>
              </View>
            </View>
          )}
        </View>

        {/* VERIFICACIÓN POR CÁMARA */}
        <View style={tw`bg-slate-800/80 p-4 rounded-2xl border border-white/10 mb-4`}>
          <Text style={tw`text-xs uppercase text-slate-400 font-semibold mb-2`}>Verificación de Identidad</Text>
          {estaVerificado ? (
            <View style={tw`bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex-row items-center`}>
              <Ionicons name="shield-checkmark" size={24} color="#34d399" style={tw`mr-3`} />
              <View style={tw`flex-1`}>
                <Text style={tw`text-emerald-400 font-semibold text-xs`}>Edad verificada con AWS Rekognition</Text>
                <Text style={tw`text-slate-400 text-[10px]`}>
                  Identidad confirmada {edadMostrar ? `(${edadMostrar} años estimación)` : ''}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMostrarModalCamara(true)}
              style={tw`bg-indigo-600/20 border border-indigo-500/40 p-3 rounded-xl flex-row items-center justify-between`}
            >
              <View style={tw`flex-1 mr-2`}>
                <Text style={tw`text-white text-xs font-bold`}>Verificar Identidad por Cámara</Text>
                <Text style={tw`text-slate-300 text-[10px]`}>Tomate una selfie para validar tu edad en AWS Rekognition</Text>
              </View>
              <View style={tw`bg-indigo-600 p-2 rounded-lg items-center justify-center`}>
                <Ionicons name="camera" size={18} color="#ffffff" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* CUENTAS VINCULADAS (RIOT & STEAM) */}
        <View style={tw`bg-slate-800/80 p-4 rounded-2xl border border-white/10 mb-4`}>
          <Text style={tw`text-xs uppercase text-slate-400 font-semibold mb-3`}>Cuentas Vinculadas</Text>

          {/* RIOT GAMES */}
          <View style={tw`bg-slate-900 p-3.5 rounded-xl border border-white/5 mb-3`}>
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-7 h-7 rounded-lg bg-red-500/20 items-center justify-center mr-2.5`}>
                  <Text style={tw`text-red-400 font-bold text-[10px]`}>RIOT</Text>
                </View>
                <View>
                  <Text style={tw`text-white text-xs font-semibold`}>Riot Games</Text>
                  <Text style={tw`text-slate-400 text-[10px]`}>
                    {datosRiot ? `${datosRiot.riot_username} (${datosRiot.region?.toUpperCase()})` : 'No vinculada'}
                  </Text>
                </View>
              </View>

              {!datosRiot ? (
                <TouchableOpacity
                  style={tw`bg-indigo-600 px-3 py-1.5 rounded-lg`}
                  onPress={() => setMostrarRiotInput(!mostrarRiotInput)}
                >
                  <Text style={tw`text-white text-xs`}>{mostrarRiotInput ? 'Cancelar' : 'Vincular'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={tw`bg-red-500/20 border border-red-500/30 px-3 py-1 rounded-lg`}
                  onPress={() => handleDesvincular('riot')}
                >
                  <Text style={tw`text-red-300 text-xs`}>Desvincular</Text>
                </TouchableOpacity>
              )}
            </View>

            {mostrarRiotInput && !datosRiot && (
              <View style={tw`mt-3 pt-3 border-t border-white/5`}>
                <TextInput
                  style={tw`bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs mb-2`}
                  placeholder="Nombre (ej: Faker)"
                  placeholderTextColor="#64748b"
                  value={riotForm.game_name}
                  onChangeText={(val) => setRiotForm({ ...riotForm, game_name: val })}
                />
                <TextInput
                  style={tw`bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs mb-2`}
                  placeholder="Tagline (ej: KR1)"
                  placeholderTextColor="#64748b"
                  value={riotForm.tag_line}
                  onChangeText={(val) => setRiotForm({ ...riotForm, tag_line: val })}
                />

                <Text style={tw`text-[10px] text-slate-400 mb-1`}>Región:</Text>
                <View style={tw`flex-row flex-wrap gap-1 mb-3`}>
                  {REGIONES_RIOT.map((reg) => (
                    <TouchableOpacity
                      key={reg}
                      onPress={() => setRiotForm({ ...riotForm, region: reg })}
                      style={tw.style(
                        'px-2 py-1 rounded border',
                        riotForm.region === reg ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-white/10'
                      )}
                    >
                      <Text style={tw`text-[10px] text-white uppercase`}>{reg}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={tw`bg-indigo-600 py-2 rounded-lg items-center`}
                  onPress={handleVincularRiot}
                  disabled={cargandoIntegracion}
                >
                  {cargandoIntegracion ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={tw`text-white text-xs font-semibold`}>Guardar Riot ID</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* STEAM */}
          <View style={tw`bg-slate-900 p-3.5 rounded-xl border border-white/5`}>
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-7 h-7 rounded-lg bg-blue-500/20 items-center justify-center mr-2.5`}>
                  <Ionicons name="logo-steam" size={16} color="#60a5fa" />
                </View>
                <View>
                  <Text style={tw`text-white text-xs font-semibold`}>Steam</Text>
                  <Text style={tw`text-slate-400 text-[10px]`}>
                    {datosSteam ? `ID: ${datosSteam.steam_id}` : 'No vinculada'}
                  </Text>
                </View>
              </View>

              {!datosSteam ? (
                <TouchableOpacity
                  style={tw`bg-indigo-600 px-3 py-1.5 rounded-lg`}
                  onPress={() => setMostrarSteamInput(!mostrarSteamInput)}
                >
                  <Text style={tw`text-white text-xs`}>{mostrarSteamInput ? 'Cancelar' : 'Vincular'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={tw`bg-red-500/20 border border-red-500/30 px-3 py-1 rounded-lg`}
                  onPress={() => handleDesvincular('steam')}
                >
                  <Text style={tw`text-red-300 text-xs`}>Desvincular</Text>
                </TouchableOpacity>
              )}
            </View>

            {mostrarSteamInput && !datosSteam && (
              <View style={tw`mt-3 pt-3 border-t border-white/5`}>
                <TextInput
                  style={tw`bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs mb-2`}
                  placeholder="SteamID64 (ej: 76561198860923712)"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={steamIdInput}
                  onChangeText={setSteamIdInput}
                />
                <TouchableOpacity
                  style={tw`bg-indigo-600 py-2 rounded-lg items-center`}
                  onPress={handleVincularSteam}
                  disabled={cargandoIntegracion}
                >
                  {cargandoIntegracion ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={tw`text-white text-xs font-semibold`}>Vincular por ID</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* JUEGOS DE STEAM */}
            {datosSteam && juegosLista?.length > 0 ? (
              <View style={tw`mt-3 pt-2 border-t border-white/5`}>
                <Text style={tw`text-[10px] text-slate-400 font-semibold mb-2`}>
                  Catálogo ({juegosLista.length} juegos):
                </Text>
                <View style={tw`flex-row flex-wrap gap-1.5`}>
                  {juegosLista.slice(0, 10).map((juego, idx) => {
                    const horas = juego.horas_steam ?? (juego.playtime_forever ? Math.round(juego.playtime_forever / 60) : 0);
                    return (
                      <View key={idx} style={tw`bg-slate-800 border border-white/10 px-2 py-1 rounded-md flex-row items-center`}>
                        <Text style={tw`text-white text-[11px] font-medium mr-1`} numberOfLines={1}>
                          🎮 {juego.nombre || juego.name}
                        </Text>
                        {horas > 0 && (
                          <Text style={tw`text-indigo-400 text-[10px] font-bold bg-indigo-500/20 px-1 rounded`}>
                            {horas}h
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* PREFERENCIAS DE NOTIFICACIONES PUSH */}
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
                  value={configNotif.invitaciones}
                  onValueChange={(val) => handleToggleNotif('invitaciones', val)}
                  trackColor={{ false: '#334155', true: '#6366f1' }}
                  thumbColor={configNotif.invitaciones ? '#ffffff' : '#94a3b8'}
                />
              </View>

              <View style={tw`flex-row items-center justify-between py-2 border-b border-white/5`}>
                <View style={tw`flex-1 mr-2`}>
                  <Text style={tw`text-xs font-semibold text-white`}>Nuevos Mensajes</Text>
                  <Text style={tw`text-[10px] text-slate-400`}>Avisos push al recibir un mensaje privado</Text>
                </View>
                <Switch
                  value={configNotif.mensajes}
                  onValueChange={(val) => handleToggleNotif('mensajes', val)}
                  trackColor={{ false: '#334155', true: '#6366f1' }}
                  thumbColor={configNotif.mensajes ? '#ffffff' : '#94a3b8'}
                />
              </View>

              <View style={tw`flex-row items-center justify-between py-2 pt-3`}>
                <View style={tw`flex-1 mr-2`}>
                  <Text style={tw`text-xs font-semibold text-white`}>Notificaciones del Sistema</Text>
                  <Text style={tw`text-[10px] text-slate-400`}>Novedades y alertas administrativas</Text>
                </View>
                <Switch
                  value={configNotif.sistema}
                  onValueChange={(val) => handleToggleNotif('sistema', val)}
                  trackColor={{ false: '#334155', true: '#6366f1' }}
                  thumbColor={configNotif.sistema ? '#ffffff' : '#94a3b8'}
                />
              </View>
            </>
          )}
        </View>

        {/* CERRAR SESIÓN */}
        <TouchableOpacity 
          style={tw`bg-red-500/90 py-3.5 px-6 rounded-xl w-full items-center`} 
          onPress={handleCerrarSesion}
        >
          <Text style={tw`text-white font-bold text-xs`}>Cerrar Sesión</Text>
        </TouchableOpacity>

      </ScrollView>

      <CustomModal
        visible={mostrarModalCamara}
        onClose={cerrarModalCamara}
        titulo="Verificación Facial con IA"
      >
        <View style={tw`w-full items-center`}>
          {!camaraActiva ? (
            <View style={tw`py-4 items-center w-full`}>
              <Ionicons name="camera-outline" size={48} color="#818cf8" style={tw`mb-3`} />
              <Text style={tw`text-slate-300 text-xs text-center mb-4 px-2`}>
                Ubicá tu rostro en un lugar bien iluminado para validar tu edad con AWS Rekognition.
              </Text>
              
              <TouchableOpacity
                onPress={iniciarCamaraModal}
                style={tw`bg-indigo-600 px-5 py-3 rounded-xl flex-row items-center gap-2 shadow-lg`}
              >
                <Ionicons name="videocam" size={16} color="#fff" />
                <Text style={tw`text-white text-xs font-semibold`}>Activar Cámara</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={tw`w-full items-center`}>
              <View style={{ width: '100%', height: 280, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', marginBottom: 12, position: 'relative' }}>
                <CameraView
                  ref={cameraRef}
                  style={{ width: '100%', height: '100%' }}
                  facing={facing}
                />

                {procesandoIA && (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16, zIndex: 20 }}>
                    <ActivityIndicator size="large" color="#6366f1" style={tw`mb-3`} />
                    <Text style={tw`text-white text-xs font-semibold mb-2 text-center`}>
                      Analizando edad con Amazon AWS...
                    </Text>
                    <View style={tw`w-44 h-1.5 bg-white/20 rounded-full overflow-hidden`}>
                      <View style={tw`h-full bg-indigo-500 rounded-full w-full`} />
                    </View>
                  </View>
                )}
              </View>

              <View style={tw`flex-row justify-between items-center w-full px-2 mb-2`}>
                <TouchableOpacity
                  onPress={() => setFacing((prev) => (prev === 'front' ? 'back' : 'front'))}
                  disabled={procesandoIA}
                  style={tw`bg-slate-800 border border-white/10 p-2.5 rounded-xl flex-row items-center gap-1.5`}
                >
                  <Ionicons name="camera-reverse-outline" size={18} color="#fff" />
                  <Text style={tw`text-white text-[11px]`}>Rotar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={capturarYVerificarEdad}
                  disabled={procesandoIA}
                  style={tw.style(
                    'bg-emerald-600 px-4 py-2.5 rounded-xl flex-row items-center gap-2 shadow-md',
                    procesandoIA && 'opacity-50'
                  )}
                >
                  {procesandoIA ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="aperture" size={18} color="#fff" />
                  )}
                  <Text style={tw`text-white text-xs font-semibold`}>
                    {procesandoIA ? 'Verificando...' : 'Tomar Foto y Verificar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {edadEstimadaRes !== null && (
            <View style={tw`bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl w-full mt-2`}>
              <Text style={tw`text-emerald-400 text-xs text-center font-medium`}>
                Verificación exitosa. Edad estimada:{' '}
                <Text style={tw`font-bold text-white text-sm`}>{edadEstimadaRes} años</Text>
              </Text>
            </View>
          )}

          {Boolean(errorCamara) && (
            <View style={tw`bg-red-500/10 border border-red-500/30 p-3 rounded-xl w-full mt-2`}>
              <Text style={tw`text-red-400 text-xs text-center`}>⚠️ {errorCamara}</Text>
            </View>
          )}
        </View>
      </CustomModal>

    </SafeAreaView>
  );
}