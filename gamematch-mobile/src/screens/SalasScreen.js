import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  BackHandler,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

import { authApi, salasApi } from '../api';
import { storage } from '../services/storage';
import { conectarSocket, obtenerSocket } from '../services/socket';
import ModalPerfilUsuario from '../components/ModalPerfilUsuario';

const esVerdadero = (v) => v === true || v === 1 || v === '1' || v === 'true';

export default function SalasScreen({ route, navigation, campanita }) {
  const targetUser = route?.params?.targetUser;
  const salaDirecta = route?.params?.salaDirecta;

  const [salas, setSalas] = useState([]);
  const [salaActiva, setSalaActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [miUsuario, setMiUsuario] = useState(null);
  const [cargandoSalas, setCargandoSalas] = useState(true);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);

  const [modalIntegrantesVisible, setModalIntegrantesVisible] = useState(false);
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState(null);
  const [modalPerfilVisible, setModalPerfilVisible] = useState(false);

  const flatListRef = useRef(null);
  const salaActivaRef = useRef(salaActiva);
  const miUsuarioRef = useRef(miUsuario);

  useEffect(() => {
    salaActivaRef.current = salaActiva;
  }, [salaActiva]);

  useEffect(() => {
    miUsuarioRef.current = miUsuario;
  }, [miUsuario]);

  useEffect(() => {
    if (salaActiva && salas.length > 0) {
      const encontrada = salas.find((s) => Number(s.id) === Number(salaActiva.id));
      if (encontrada) {
        setSalaActiva((prev) => ({
          ...encontrada,
          _targetUser: prev?._targetUser || prev?.emisor || encontrada._targetUser
        }));
      }
    }
  }, [salas]);

  const normalizarSala = (s) => ({
    ...s,
    mensajes_sin_leer: Number(
      s.mensajes_sin_leer ?? s.sin_leer ?? s.no_leidos ?? s.cant_sin_leer ?? s.unread_count ?? s.unread ?? 0
    ),
  });

  useEffect(() => {
    const totalSinLeer = salas.reduce((acc, s) => acc + Number(s.mensajes_sin_leer || 0), 0);

    navigation.setOptions({
      tabBarBadge: totalSinLeer > 0 ? (totalSinLeer > 99 ? '99+' : totalSinLeer) : undefined,
      tabBarBadgeStyle: {
        backgroundColor: '#6366f1',
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
      },
    });
  }, [salas, navigation]);

  useEffect(() => {
    const onBackPress = () => {
      if (salaActiva) {
        setSalaActiva(null);
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [salaActiva]);

  useEffect(() => {
    let socketInstancia = null;

    const handleNuevoMensaje = (mensaje) => {
      const activa = salaActivaRef.current;
      const miUser = miUsuarioRef.current;
      const miId = miUser?.id || miUser?.usuario?.id;
      const emisorId = mensaje.emisor_id || mensaje.emisor?.id || mensaje.usuario_id;
      const esMio = miId && Number(emisorId) === Number(miId);

      if (activa && Number(mensaje.sala_id) === Number(activa.id)) {
        setMensajes((prev) => {
          if (prev.some((m) => m.id === mensaje.id)) return prev;
          return [...prev, mensaje];
        });
      }

      setSalas((prevSalas) =>
        prevSalas.map((s) => {
          if (Number(s.id) === Number(mensaje.sala_id)) {
            const esLaSalaAbierta = activa && Number(activa.id) === Number(s.id);
            const sinLeerActual = Number(s.mensajes_sin_leer || 0);

            const nuevoSinLeer = (!esMio && !esLaSalaAbierta) ? sinLeerActual + 1 : (esLaSalaAbierta ? 0 : sinLeerActual);

            return {
              ...s,
              ultimo_mensaje: mensaje.contenido,
              updated_at: mensaje.createdAt || mensaje.created_at || new Date().toISOString(),
              mensajes_sin_leer: nuevoSinLeer,
            };
          }
          return s;
        })
      );
    };

    const handleErrorChat = (data) => {
      Alert.alert('Chat', data.error || 'Ocurrió un error en la sala');
    };

    const handleSalaActualizada = () => {
      cargarSalas();
    };

    const inicializar = async () => {
      const user = await storage.obtener('usuario');
      setMiUsuario(user);
      miUsuarioRef.current = user;

      await conectarSocket();
      socketInstancia = obtenerSocket();

      if (socketInstancia) {
        socketInstancia.off('mensaje_nuevo', handleNuevoMensaje);
        socketInstancia.off('error_chat', handleErrorChat);
        socketInstancia.off('sala_actualizada', handleSalaActualizada);

        socketInstancia.on('mensaje_nuevo', handleNuevoMensaje);
        socketInstancia.on('error_chat', handleErrorChat);
        socketInstancia.on('sala_actualizada', handleSalaActualizada);
      }

      await cargarSalas();
    };

    inicializar();

    return () => {
      const socket = obtenerSocket();
      if (socket) {
        socket.off('mensaje_nuevo', handleNuevoMensaje);
        socket.off('error_chat', handleErrorChat);
        socket.off('sala_actualizada', handleSalaActualizada);
      }
    };
  }, []);

  useEffect(() => {
    const gestionarParametros = async () => {
      if (salaDirecta) {
        const salaASeleccionar = salas.find((s) => Number(s.id) === Number(salaDirecta.id)) || salaDirecta;
        seleccionarSala(salaASeleccionar);
        navigation.setParams({ salaDirecta: null });
      } else if (targetUser) {
        let salaEncontrada = salas.find((s) => {
          const lista = s.participantes || s.usuarios || s.Participantes || s.Usuarios || [];
          return lista.some(
            (p) => Number(p.id || p.usuario_id || p.usuario?.id) === Number(targetUser.id)
          );
        });

        if (!salaEncontrada) {
          try {
            const apiRes = await (salasApi.crearSala
              ? salasApi.crearSala({ tipo: 'privada', participante_id: targetUser.id })
              : authApi.crearSala(null, { tipo: 'privada', participante_id: targetUser.id }));
            salaEncontrada = apiRes.sala || apiRes;
            await cargarSalas();
          } catch (e) {
            salaEncontrada = { id: Date.now(), tipo: 'privada' };
          }
        }

        seleccionarSala({
          ...salaEncontrada,
          _targetUser: targetUser,
          tipo: 'privada'
        });
        navigation.setParams({ targetUser: null });
      }
    };

    if (targetUser || salaDirecta) {
      gestionarParametros();
    }
  }, [targetUser, salaDirecta, salas]);

  const cargarSalas = async () => {
    try {
      const data = await salasApi.listarMisSalas();
      const lista = Array.isArray(data) ? data : data.salas || [];
      const listaNormalizada = lista.map(normalizarSala);
      setSalas(listaNormalizada);

      const socket = obtenerSocket();
      if (socket && listaNormalizada.length > 0) {
        listaNormalizada.forEach((s) => {
          socket.emit('unirse_sala', { sala_id: s.id });
        });
      }
    } catch (error) {
      console.log('Error al cargar salas:', error?.message || error);
    } finally {
      setCargandoSalas(false);
    }
  };

  const seleccionarSala = async (sala) => {
    if (!sala) return;

    const salaCompleta = salas.find((s) => Number(s.id) === Number(sala.id)) || sala;
    const salaConTarget = {
      ...salaCompleta,
      _targetUser: sala._targetUser || salaCompleta._targetUser || sala.emisor
    };

    setSalaActiva(salaConTarget);
    setCargandoMensajes(true);

    setSalas((prev) =>
      prev.map((s) => (Number(s.id) === Number(sala.id) ? { ...s, mensajes_sin_leer: 0 } : s))
    );

    try {
      const socket = obtenerSocket();
      if (socket && sala.id) {
        socket.emit('unirse_sala', { sala_id: sala.id });
      }

      if (sala.id) {
        const historial = await salasApi.obtenerHistorial(sala.id);
        setMensajes(Array.isArray(historial) ? historial : historial.mensajes || []);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setMensajes([]);
      } else {
        console.log('Aviso al cargar historial:', error?.message || error);
      }
    } finally {
      setCargandoMensajes(false);
    }
  };

  const handleBuscar = async (textoVal) => {
    setBusqueda(textoVal);
    if (!textoVal.trim()) {
      setSugerencias([]);
      return;
    }

    setCargandoSugerencias(true);
    try {
      const miToken = await storage.obtener('token');
      const res = await authApi.buscarUsuarios(miToken, textoVal.trim());
      const lista = res.usuarios || [];
      const miId = miUsuario?.id || miUsuario?.usuario?.id;
      setSugerencias(lista.filter((u) => Number(u.id) !== Number(miId)));
    } catch (err) {
      console.log('Error al buscar usuarios:', err?.message || err);
    } finally {
      setCargandoSugerencias(false);
    }
  };

  const iniciarChatConUsuario = (target) => {
    setBusqueda('');
    setSugerencias([]);
    navigation.setParams({ targetUser: target });
  };

  const handleEnviarMensaje = () => {
    if (!nuevoMensaje.trim() || !salaActiva) return;

    const socket = obtenerSocket();
    if (!socket) {
      Alert.alert('Error', 'No hay conexión con el servidor de chat');
      return;
    }

    socket.emit('enviar_mensaje', {
      sala_id: salaActiva.id,
      contenido: nuevoMensaje.trim()
    });

    setNuevoMensaje('');
  };

  const obtenerListaIntegrantes = (sala) => {
    if (!sala) return [];
    const rawLista =
      sala.participantes ||
      sala.usuarios ||
      sala.Participantes ||
      sala.Usuarios ||
      sala.integrantes ||
      [];

    const map = new Map();
    rawLista.forEach((p) => {
      const uObj = p.usuario || p.Usuario || p;
      const id = uObj.id || p.usuario_id || p.id;
      if (id && !map.has(Number(id))) {
        map.set(Number(id), {
          id: Number(id),
          username: uObj.username || uObj.nombre || p.username || 'Jugador',
          foto_perfil:
            uObj.foto_perfil ||
            uObj.avatar ||
            p.foto_perfil ||
            p.avatar ||
            'https://via.placeholder.com/150',
          rango: uObj.rango || p.rango || 'Sin Rango',
          verificado:
            esVerdadero(uObj.verificado) ||
            esVerdadero(uObj.estaVerificado) ||
            esVerdadero(p.verificado) ||
            esVerdadero(p.estaVerificado)
        });
      }
    });

    return Array.from(map.values());
  };

  const obtenerDatosChat = (sala) => {
    const miId = miUsuario?.id || miUsuario?.usuario?.id;
    const integrantes = obtenerListaIntegrantes(sala);
    const otros = integrantes.filter((p) => Number(p.id) !== Number(miId));

    const targetObj = sala?._targetUser || (otros.length > 0 ? otros[0] : sala?.emisor);
    const esGrupo = sala?.tipo === 'grupal' || sala?.es_grupo || (integrantes.length > 2 && !sala?._targetUser);

    if (!esGrupo && targetObj) {
      return {
        nombre: targetObj.username || targetObj.nombre || 'Jugador',
        avatar: targetObj.foto_perfil || targetObj.avatar || 'https://via.placeholder.com/150',
        otroUsuarioId: targetObj.id,
        otroVerificado:
          esVerdadero(targetObj.verificado) ||
          esVerdadero(targetObj.estaVerificado),
        esGrupo: false
      };
    }

    return {
      nombre: sala?.nombre && !sala.nombre.startsWith('Sala #') ? sala.nombre : `Grupo (${integrantes.length})`,
      avatar: 'https://via.placeholder.com/150',
      esGrupo: true
    };
  };

  const formatearHora = (fechaIso) => {
    if (!fechaIso) return '';
    const fecha = new Date(fechaIso);
    if (isNaN(fecha.getTime())) return '';
    return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleAbrirPerfil = (usuarioId) => {
    if (!usuarioId || Number(usuarioId) === Number(miUsuario?.id || miUsuario?.usuario?.id)) return;
    setModalIntegrantesVisible(false);
    setUsuarioSeleccionadoId(usuarioId);
    setModalPerfilVisible(true);
  };

  const renderItemChatList = ({ item }) => {
    const datos = obtenerDatosChat(item);
    const sinLeer = Number(item.mensajes_sin_leer || 0);

    return (
      <TouchableOpacity
        style={tw`flex-row items-center px-4 py-3.5 border-b border-white/5`}
        activeOpacity={0.7}
        onPress={() => seleccionarSala(item)}
      >
        <Image source={{ uri: datos.avatar }} style={tw`w-[52px] h-[52px] rounded-full bg-slate-700`} />

        <View style={tw`flex-1 ml-3.5 justify-center`}>
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`flex-row items-center flex-1 mr-2`}>
              <Text style={tw`text-base font-bold text-slate-100 shrink`} numberOfLines={1}>
                {datos.nombre}
              </Text>
              {!datos.esGrupo && datos.otroVerificado ? (
                <Text style={tw`text-emerald-400 text-xs font-bold ml-1.5`}>✓</Text>
              ) : null}
            </View>
            {item.updated_at ? (
              <Text style={tw.style('text-xs text-slate-500', sinLeer > 0 && 'text-indigo-500 font-bold')}>
                {formatearHora(item.updated_at)}
              </Text>
            ) : null}
          </View>

          <View style={tw`flex-row justify-between items-center mt-1`}>
            <Text style={tw`text-xs text-slate-400 flex-1 mr-2`} numberOfLines={1}>
              {item.ultimo_mensaje || 'Tocá para ver la conversación'}
            </Text>

            {sinLeer > 0 ? (
              <View style={tw`bg-indigo-500 rounded-full min-w-[22px] h-[22px] justify-center items-center px-1.5`}>
                <Text style={tw`text-white text-[11px] font-bold`}>
                  {sinLeer > 99 ? '99+' : sinLeer}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMensaje = ({ item }) => {
    const emisorId = item.emisor_id || item.emisor?.id;
    const esMio = Number(emisorId) === Number(miUsuario?.id || miUsuario?.usuario?.id);
    const nombreEmisor = item.emisor?.username || item.usuario?.username;

    return (
      <View style={tw.style('w-full flex-row mb-1', esMio ? 'justify-end' : 'justify-start')}>
        <View
          style={tw.style(
            'max-w-[78%] p-3 rounded-2xl',
            esMio ? 'bg-indigo-500 rounded-br-none' : 'bg-slate-800 rounded-bl-none'
          )}
        >
          {!esMio && nombreEmisor ? (
            <Text style={tw`text-indigo-300 text-[11px] font-bold mb-0.5`}>{nombreEmisor}</Text>
          ) : null}
          <Text style={tw`text-white text-sm`}>{item.contenido || ''}</Text>
        </View>
      </View>
    );
  };

  if (salaActiva) {
    const datosChatActivo = obtenerDatosChat(salaActiva);
    const integrantes = obtenerListaIntegrantes(salaActiva);

    return (
      <SafeAreaView style={tw`flex-1 bg-slate-900`} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={tw`flex-1`}
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={tw`flex-row items-center px-3 py-3 bg-slate-800 border-b border-white/10`}>
            <TouchableOpacity style={tw`p-2 mr-1`} onPress={() => setSalaActiva(null)}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`flex-1 flex-row items-center`}
              activeOpacity={0.7}
              onPress={() => {
                if (datosChatActivo.esGrupo) {
                  setModalIntegrantesVisible(true);
                } else if (datosChatActivo.otroUsuarioId) {
                  handleAbrirPerfil(datosChatActivo.otroUsuarioId);
                }
              }}
            >
              <Image source={{ uri: datosChatActivo.avatar }} style={tw`w-10 h-10 rounded-full bg-slate-700`} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={tw`flex-row items-center`}>
                  <Text style={tw`text-base font-bold text-white mr-1`} numberOfLines={1}>
                    {datosChatActivo.nombre}
                  </Text>
                  {!datosChatActivo.esGrupo && datosChatActivo.otroVerificado && (
                    <Text style={tw`text-emerald-400 font-bold text-xs`}>✓</Text>
                  )}
                </View>
                <Text style={tw`text-[11px] text-slate-400 mt-0.5`} numberOfLines={1}>
                  {datosChatActivo.esGrupo
                    ? `${integrantes.length} integrantes · Toca para ver`
                    : 'Toca para ver perfil'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`p-2 bg-slate-900 rounded-xl ml-2`}
              onPress={() => {
                if (datosChatActivo.esGrupo) {
                  setModalIntegrantesVisible(true);
                } else if (datosChatActivo.otroUsuarioId) {
                  handleAbrirPerfil(datosChatActivo.otroUsuarioId);
                }
              }}
            >
              <Ionicons
                name={datosChatActivo.esGrupo ? 'people-outline' : 'person-outline'}
                size={22}
                color="#6366f1"
              />
            </TouchableOpacity>
          </View>

          {/* BANNER DE VERIFICACIÓN */}
          {!datosChatActivo.esGrupo && datosChatActivo.otroUsuarioId ? (
            <View
              style={tw.style(
                'px-3 py-2 flex-row items-center border-b',
                datosChatActivo.otroVerificado
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/20'
              )}
            >
              <Text style={tw`text-xs mr-2`}>{datosChatActivo.otroVerificado ? '✅' : '⚠️'}</Text>
              <Text
                style={tw.style(
                  'text-[11px] flex-1 leading-4',
                  datosChatActivo.otroVerificado ? 'text-emerald-300' : 'text-amber-300'
                )}
              >
                <Text style={tw`font-bold`}>{datosChatActivo.nombre} </Text>
                {datosChatActivo.otroVerificado
                  ? 'verificó su identidad por cámara.'
                  : 'aún no ha verificado su edad con la webcam. Tené cuidado.'}
              </Text>
            </View>
          ) : null}

          {/* LISTA DE MENSAJES */}
          <View style={tw`flex-1 px-3`}>
            {cargandoMensajes ? (
              <View style={tw`flex-1 justify-center items-center`}>
                <ActivityIndicator size="large" color="#6366f1" />
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                style={tw`flex-1`}
                data={mensajes}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={renderMensaje}
                contentContainerStyle={tw.style('py-4', { gap: 10, flexGrow: 1 })}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              />
            )}
          </View>

          <View style={tw`flex-row items-center p-3 bg-slate-800 border-t border-white/10`}>
            <TextInput
              style={tw`flex-1 bg-slate-900 rounded-full px-4 py-2.5 text-white text-sm mr-2`}
              placeholder="Escribí un mensaje..."
              placeholderTextColor="#64748b"
              value={nuevoMensaje}
              onChangeText={setNuevoMensaje}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleEnviarMensaje}
            />
            <TouchableOpacity
              style={tw`bg-indigo-500 w-[42px] h-[42px] rounded-full justify-center items-center`}
              onPress={handleEnviarMensaje}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* MODAL INTEGRANTES */}
          <Modal visible={modalIntegrantesVisible} transparent animationType="slide">
            <View style={tw`flex-1 bg-black/70 justify-center p-5`}>
              <View style={tw`bg-slate-800 rounded-2xl p-4.5 max-h-[70%] border border-white/10`}>
                <View style={tw`flex-row justify-between items-center mb-3`}>
                  <Text style={tw`text-lg font-bold text-white`}>Integrantes del Grupo</Text>
                  <TouchableOpacity onPress={() => setModalIntegrantesVisible(false)}>
                    <Ionicons name="close-circle-outline" size={26} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={integrantes}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => {
                    const esMiUsuario = Number(item.id) === Number(miUsuario?.id || miUsuario?.usuario?.id);

                    return (
                      <TouchableOpacity
                        style={tw.style('flex-row items-center bg-slate-900 p-2.5 rounded-xl border border-white/5', esMiUsuario && 'opacity-70')}
                        activeOpacity={esMiUsuario ? 1 : 0.7}
                        disabled={esMiUsuario}
                        onPress={() => handleAbrirPerfil(item.id)}
                      >
                        <Image source={{ uri: item.foto_perfil }} style={tw`w-10 h-10 rounded-full bg-slate-700`} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={tw`flex-row items-center`}>
                            <Text style={tw`text-white text-base font-semibold`}>{item.username}</Text>
                            {item.verificado ? (
                              <Text style={tw`text-emerald-400 text-xs font-bold ml-1.5`}>✓</Text>
                            ) : null}
                          </View>
                          <Text style={tw`text-slate-400 text-xs mt-0.5`}>{`🏆 ${item.rango}`}</Text>
                        </View>
                        {esMiUsuario ? (
                          <Text style={tw`bg-indigo-500 text-white text-[11px] font-bold px-2 py-1 rounded-md`}>Tú</Text>
                        ) : (
                          <Ionicons name="person-circle-outline" size={22} color="#6366f1" />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
                />
              </View>
            </View>
          </Modal>

          <ModalPerfilUsuario
            visible={modalPerfilVisible}
            usuarioId={usuarioSeleccionadoId}
            usuarioActual={miUsuario}
            onClose={() => setModalPerfilVisible(false)}
            deshabilitarChat={true}
            onIrAlChat={(salaNueva) => {
              setModalPerfilVisible(false);
              if (salaNueva) {
                cargarSalas().then(() => seleccionarSala(salaNueva));
              }
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-900`} edges={['top', 'left', 'right']}>
      <View style={tw`px-5 py-4 bg-slate-800 border-b border-white/10`}>
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <Text style={tw`text-2xl font-bold text-white`}>Chats</Text>
          {campanita}
        </View>

        <View style={tw`relative`}>
          <TextInput
            style={tw`bg-slate-900 rounded-xl px-3.5 py-2.5 text-white text-sm border border-white/10`}
            placeholder="Buscar jugador para chatear..."
            placeholderTextColor="#64748b"
            value={busqueda}
            onChangeText={handleBuscar}
          />
          {cargandoSugerencias && <ActivityIndicator size="small" color="#6366f1" style={tw`absolute right-3 top-3`} />}
        </View>
      </View>

      {sugerencias.length > 0 && (
        <View style={tw`bg-slate-800 border-b border-indigo-500/50 max-h-[220px] px-3 py-2`}>
          <Text style={tw`text-indigo-400 text-[11px] font-bold uppercase tracking-wider mb-2 px-1`}>Jugadores encontrados</Text>
          <FlatList
            data={sugerencias}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => iniciarChatConUsuario(item)}
                style={tw`flex-row items-center justify-between p-2 rounded-lg bg-slate-900/60 mb-1 border border-white/5`}
              >
                <View style={tw`flex-row items-center flex-1 mr-2`}>
                  <Image
                    source={{ uri: item.foto_perfil || 'https://via.placeholder.com/150' }}
                    style={tw`w-8 h-8 rounded-full bg-slate-700 mr-2.5`}
                  />
                  <Text style={tw`text-white font-semibold text-sm`}>@{item.username}</Text>
                </View>
                <Text style={tw`text-indigo-400 font-bold text-xs bg-indigo-500/10 px-2.5 py-1 rounded-md`}>Escribir</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {cargandoSalas ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : salas.length === 0 ? (
        <View style={tw`flex-1 justify-center items-center px-6`}>
          <Ionicons name="chatbubbles-outline" size={54} color="#475569" />
          <Text style={tw`text-slate-400 mt-3 text-base font-medium text-center`}>No tenés conversaciones activas</Text>
          <Text style={tw`text-slate-600 text-xs text-center mt-1`}>Usá el buscador superior para iniciar un chat con cualquier jugador</Text>
        </View>
      ) : (
        <FlatList
          data={salas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItemChatList}
          contentContainerStyle={tw`py-1`}
        />
      )}

      <ModalPerfilUsuario
        visible={modalPerfilVisible}
        usuarioId={usuarioSeleccionadoId}
        usuarioActual={miUsuario}
        onClose={() => setModalPerfilVisible(false)}
        deshabilitarChat={true}
        onIrAlChat={(salaNueva) => {
          setModalPerfilVisible(false);
          if (salaNueva) {
            cargarSalas().then(() => seleccionarSala(salaNueva));
          }
        }}
      />
    </SafeAreaView>
  );
}