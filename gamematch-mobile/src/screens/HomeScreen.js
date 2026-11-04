import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

import { storage } from '../services/storage';
import { usuariosApi, salasApi } from '../api';
import { obtenerSocket } from '../services/socket';
import ModalPerfilUsuario from '../components/ModalPerfilUsuario';
import PanelFiltros from '../components/PanelFiltros';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const MOTIVOS = [
  { id: 'lenguaje_inapropiado', label: 'Lenguaje Inapropiado' },
  { id: 'acoso', label: 'Acoso / Hostigamiento' },
  { id: 'spam', label: 'Spam' },
  { id: 'otro', label: 'Otro motivo' }
];

const CONFIG_ROLES = {
  TOP: { label: 'TOP', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icono: '🛡️' },
  JUNGLE: { label: 'JUNGLA', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icono: '🌿' },
  MID: { label: 'MID', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icono: '⚡' },
  MIDDLE: { label: 'MID', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icono: '⚡' },
  ADC: { label: 'ADC', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icono: '🎯' },
  BOT: { label: 'ADC', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icono: '🎯' },
  BOTTOM: { label: 'ADC', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icono: '🎯' },
  SUPPORT: { label: 'SUPPORT', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icono: '💚' },
  UTILITY: { label: 'SUPPORT', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icono: '💚' },
  ARAM: { label: 'ARAM', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', icono: '❄️' },
  ARENA: { label: 'ARENA', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icono: '⚔️' },
};

function parsearTopJuegos(topJuegos) {
  if (!topJuegos) return [];
  if (Array.isArray(topJuegos)) return topJuegos;
  try {
    const parsed = JSON.parse(topJuegos);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function obtenerValorNumero(valor, fallback = null) {
  if (valor === null || valor === undefined) return fallback;
  if (typeof valor === 'number' || typeof valor === 'string') return valor;
  if (typeof valor === 'object' && valor.global !== undefined) return obtenerValorNumero(valor.global, fallback);
  return fallback;
}

export default function HomeScreen({ navigation, campanita }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const insets = useSafeAreaInsets();

  const [filtros, setFiltros] = useState({
    modo_juego: '',
    plataforma: '',
    rango_edad: '',
    rango_lol: '',
    winrate_min: '',
    sinergia_min: '',
    rol_preferido: '',
    solo_premium: '',
    solo_verificados: '',
  });

  const [miUsuario, setMiUsuario] = useState(null);

  const [modalReporteVisible, setModalReporteVisible] = useState(false);
  const [usuarioAReportar, setUsuarioAReportar] = useState(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('lenguaje_inapropiado');
  const [comentarioReporte, setComentarioReporte] = useState('');
  const [enviandoReporte, setEnviandoReporte] = useState(false);

  const [usuarioPerfilId, setUsuarioPerfilId] = useState(null);
  const [modalPerfilVisible, setModalPerfilVisible] = useState(false);

  const cargarUsuarios = async (filtrosAEnviar = filtros) => {
    try {
      const user = await storage.obtener('usuario');
      setMiUsuario(user);

      const token = await storage.obtener('token');

      const params = new URLSearchParams();
      if (busqueda.trim()) params.append('q', busqueda.trim());

      Object.keys(filtrosAEnviar).forEach((key) => {
        if (filtrosAEnviar[key]) {
          params.append(key, filtrosAEnviar[key]);
        }
      });

      const url = `${API_URL}/busqueda?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok) {
        setUsuarios(Array.isArray(data) ? data : data.usuarios || []);
      }
    } catch (error) {
      console.error('Error al conectar con la API de búsqueda:', error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();

    const socket = obtenerSocket();
    if (!socket) return;

    const handleCambiarEstado = ({ usuario_id, estado }) => {
      setUsuarios((prev) =>
        prev.map((u) => (Number(u.id) === Number(usuario_id) ? { ...u, estado } : u))
      );
    };

    socket.on('usuario_estado_cambiado', handleCambiarEstado);

    return () => {
      socket.off('usuario_estado_cambiado', handleCambiarEstado);
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefrescando(true);
    cargarUsuarios();
  }, [filtros, busqueda]);

  const abrirPerfilUsuario = (usuarioId) => {
    setUsuarioPerfilId(usuarioId);
    setModalPerfilVisible(true);
  };

  const handleHablar = async (usuario) => {
    if (!usuario) return;

    const esMenorMio = miUsuario?.rango_edad === 'menor_18';
    const esMenorTarget = usuario.rango_edad === 'menor_18';

    if (miUsuario?.rango_edad && usuario.rango_edad && esMenorMio !== esMenorTarget) {
      Alert.alert(
        'Acceso Restringido',
        '🚫 No se permiten chats entre usuarios de distintos entornos de edad (Menores / Adultos).'
      );
      return;
    }

    try {
      const res = await salasApi.crearSala({
        tipo: 'privada',
        participante_id: usuario.id
      });
      const salaObtenida = res.sala || res;
      navigation.navigate('Salas', { targetUser: usuario, salaDirecta: salaObtenida });
    } catch (err) {
      navigation.navigate('Salas', { targetUser: usuario });
    }
  };

  const handleBloquear = (usuario) => {
    const nombre = usuario.nombre || usuario.username || 'este usuario';
    Alert.alert(
      'Bloquear usuario',
      `¿Estás seguro de que querés bloquear a ${nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              await usuariosApi.bloquear(usuario.id);
              setUsuarios((prev) => prev.filter((u) => u.id !== usuario.id));
              Alert.alert('Éxito', `${nombre} ha sido bloqueado.`);
            } catch (err) {
              Alert.alert('Error', 'No se pudo procesar el bloqueo.');
            }
          }
        }
      ]
    );
  };

  const abrirModalReporte = async (usuario) => {
    try {
      const { interactuaron } = await usuariosApi.verificarInteraccion(usuario.id);

      if (interactuaron) {
        setUsuarioAReportar(usuario);
        setMotivoSeleccionado('lenguaje_inapropiado');
        setComentarioReporte('');
        setModalReporteVisible(true);
      } else {
        Alert.alert(
          'Acción no permitida',
          'Solo podés reportar a jugadores con los que hayas interactuado o compartido una sala.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo verificar la interacción con el usuario.');
    }
  };

  const enviarReporteModal = async () => {
    if (!usuarioAReportar) return;

    setEnviandoReporte(true);
    try {
      await usuariosApi.reportar(
        usuarioAReportar.id,
        motivoSeleccionado,
        comentarioReporte || 'Reportado desde la App Móvil'
      );
      setModalReporteVisible(false);
      Alert.alert('Reporte enviado', 'Gracias por mantener la comunidad segura.');
    } catch (err) {
      const mensajeError = err.response?.data?.error || 'No se pudo enviar el reporte.';
      Alert.alert('No se pudo reportar', mensajeError);
    } finally {
      setEnviandoReporte(false);
    }
  };

  const esPremium = Boolean(
    miUsuario?.es_premium === true ||
      miUsuario?.es_premium === 1 ||
      miUsuario?.es_premium === '1' ||
      miUsuario?.es_premium === 'true'
  );

  const usuariosFiltrados = usuarios.filter((user) => {
    const query = busqueda.toLowerCase();
    const nombre = (user.nombre || user.username || '').toLowerCase();
    const juego = (user.juegoFavorito || user.juego || '').toLowerCase();
    const coincideBusqueda = nombre.includes(query) || juego.includes(query);

    const esJugadorPremium = Boolean(
      user.es_premium === true ||
        user.es_premium === 1 ||
        user.es_premium === '1' ||
        user.es_premium === 'true'
    );

    const esJugadorVerificado = Boolean(
      user.verificado === true ||
        user.verificado === 1 ||
        user.verificado === '1' ||
        user.verificado === 'true'
    );

    if (filtros.solo_premium === 'true' && !esJugadorPremium) {
      return false;
    }
    if (filtros.solo_verificados === 'true' && !esJugadorVerificado) {
      return false;
    }

    return coincideBusqueda;
  });

  const renderPlayerCard = ({ item }) => {
    const esJugadorPremium = Boolean(
      item.es_premium === true ||
        item.es_premium === 1 ||
        item.es_premium === '1' ||
        item.es_premium === 'true'
    );

    const avatarUri = item.foto_perfil || item.avatar || item.fotoPerfil;

    const datosRiot = item.riot || item.integracionRiot || item.IntegracionRiot || null;
    const datosSteam = item.steam || item.integracionSteam || item.IntegracionSteam || null;

    const tieneRiot = Boolean(datosRiot && Object.keys(datosRiot).length > 0);
    const tieneSteam = Boolean(datosSteam && Object.keys(datosSteam).length > 0);

    const rawPosicion = datosRiot?.lol_posicion_principal
      ? String(datosRiot.lol_posicion_principal).toUpperCase()
      : null;
    const rolInfo = rawPosicion ? CONFIG_ROLES[rawPosicion] : null;

    const wins = datosRiot?.lol_wins || 0;
    const losses = datosRiot?.lol_losses || 0;
    const totalPartidas = wins + losses;

    const winrate = item.lol_winrate !== undefined && item.lol_winrate !== null
      ? item.lol_winrate
      : totalPartidas > 0
      ? Math.round((wins / totalPartidas) * 100)
      : 0;

    const topJuegosSteam = tieneSteam ? parsearTopJuegos(datosSteam.top_juegos) : [];

    const cantidadJuegosSteam = datosSteam?.total_juegos > 0
      ? datosSteam.total_juegos
      : topJuegosSteam.length > 0
      ? topJuegosSteam.length
      : Array.isArray(item.juegos)
      ? item.juegos.length
      : 0;

    const porcentajeSinergia = obtenerValorNumero(item.sinergia, obtenerValorNumero(item.sinergia_porcentaje, 50));
    const sinergiaRiot = obtenerValorNumero(item.sinergia_riot);
    const sinergiaSteam = obtenerValorNumero(item.sinergia_steam);

    return (
      <View
        style={tw.style(
          'relative bg-slate-800 rounded-2xl p-4 mb-3.5 border shadow-lg',
          esJugadorPremium ? 'border-amber-500/40' : 'border-white/10'
        )}
      >
        {esJugadorPremium && (
          <View style={tw`absolute -top-2.5 right-4 bg-amber-400 px-2 py-0.5 rounded-full z-10 flex-row items-center`}>
            <Text style={tw`text-slate-950 font-extrabold text-[9px] uppercase tracking-wider`}>
              ⭐ Premium
            </Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => abrirPerfilUsuario(item.id)}
          style={tw`flex-row items-start justify-between mb-3`}
        >
          <View style={tw`flex-row items-center flex-1 mr-2`}>
            <View style={tw`relative mr-3`}>
              <View
                style={tw.style(
                  'w-12 h-12 rounded-full overflow-hidden border-2 bg-slate-700 justify-center items-center',
                  esJugadorPremium ? 'border-amber-400' : 'border-white/20'
                )}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={tw`w-full h-full`} />
                ) : (
                  <Text style={tw`font-bold text-white text-lg`}>
                    {(item.username?.[0] || item.nombre?.[0] || 'U').toUpperCase()}
                  </Text>
                )}
              </View>

              <View
                style={tw.style(
                  'absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-800',
                  item.estado === 'conectado'
                    ? 'bg-green-500'
                    : item.estado === 'ausente'
                    ? 'bg-amber-500'
                    : 'bg-slate-500'
                )}
              />
            </View>

            <View style={tw`flex-1`}>
              <Text style={tw`text-sm font-bold text-white`} numberOfLines={1}>
                {item.username || item.nombre || 'Jugador'}
              </Text>
              <Text style={tw`text-[11px] text-slate-400`} numberOfLines={1}>
                {item.rango_edad ? `Edad: ${item.rango_edad}` : 'Jugador GameMatch'}
              </Text>
            </View>
          </View>

          <View style={tw`items-end`}>
            <Text style={tw`bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs px-2 py-1 rounded-lg overflow-hidden`}>
              🤝 {porcentajeSinergia}% Sinergia
            </Text>

            <View style={tw`flex-row items-center mt-1`}>
              {sinergiaRiot !== null && (
                <Text style={tw`text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded mr-1 overflow-hidden`}>
                  LoL: {sinergiaRiot}%
                </Text>
              )}

              {sinergiaSteam !== null && (
                <Text style={tw`text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded overflow-hidden`}>
                  Steam: {sinergiaSteam}%
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <View style={tw.style({ gap: 8 }, 'mb-3')}>
          {tieneRiot && (
            <View style={tw`bg-black/30 border border-white/5 rounded-xl p-2.5`}>
              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-row items-center flex-1 mr-2`}>
                  <Text style={tw`text-[10px] text-slate-500 mr-1`}>⚔️</Text>
                  <Text style={tw`font-bold text-amber-400 text-xs`} numberOfLines={1}>
                    {datosRiot.rango_lol || datosRiot.rango || 'UNRANKED'}
                  </Text>
                  {datosRiot.lol_lp !== undefined && datosRiot.lol_lp > 0 && (
                    <Text style={tw`text-[10px] text-slate-400 ml-1`}>
                      ({datosRiot.lol_lp} LP)
                    </Text>
                  )}
                </View>

                {rolInfo ? (
                  <View style={tw.style('px-1.5 py-0.5 rounded-md border flex-row items-center', rolInfo.color)}>
                    <Text style={tw`text-[9px] mr-1`}>{rolInfo.icono}</Text>
                    <Text style={tw`text-[9px] font-bold`}>{rolInfo.label}</Text>
                  </View>
                ) : rawPosicion ? (
                  <View style={tw`bg-white/10 border border-white/20 px-1.5 py-0.5 rounded-md`}>
                    <Text style={tw`text-[9px] font-bold text-slate-200`}>{rawPosicion}</Text>
                  </View>
                ) : null}
              </View>

              {winrate > 0 && (
                <View style={tw`flex-row items-center justify-between pt-1.5 mt-1.5 border-t border-white/5`}>
                  <Text style={tw`text-[10px] text-slate-400`}>Rendimiento SoloQ</Text>
                  <Text style={tw`text-emerald-400 font-bold text-[10px]`}>{winrate}% WR</Text>
                </View>
              )}
            </View>
          )}

          {tieneSteam && (
            <View style={tw`bg-[#66c0f4]/10 border border-[#66c0f4]/20 rounded-xl p-2.5`}>
              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-row items-center flex-1 mr-2`}>
                  <Text style={tw`text-[11px] mr-1`}>🎮</Text>
                  <Text style={tw`font-bold text-[#66c0f4] text-xs`} numberOfLines={1}>
                    {datosSteam.steam_username || datosSteam.username || 'Cuenta Steam'}
                  </Text>
                </View>

                {datosSteam.jugando_ahora ? (
                  <View style={tw`bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded flex-row items-center`}>
                    <View style={tw`w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1`} />
                    <Text style={tw`text-emerald-300 text-[9px] font-medium`} numberOfLines={1}>
                      {datosSteam.jugando_ahora}
                    </Text>
                  </View>
                ) : (
                  <Text style={tw`text-[10px] text-slate-400`}>
                    {cantidadJuegosSteam} {cantidadJuegosSteam === 1 ? 'juego' : 'juegos'}
                  </Text>
                )}
              </View>

              {topJuegosSteam.length > 0 && (
                <View style={tw`flex-row flex-wrap items-center pt-1.5 mt-1.5 border-t border-white/5`}>
                  {topJuegosSteam.slice(0, 3).map((juego, idx) => {
                    const nombreJuego = typeof juego === 'string' ? juego : juego.name || juego.nombre;
                    return (
                      <View key={idx} style={tw`bg-white/5 border border-white/5 px-1.5 py-0.5 rounded mr-1 mb-1`}>
                        <Text style={tw`text-[9px] text-slate-300`} numberOfLines={1}>
                          {nombreJuego}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {!tieneRiot && !tieneSteam && (
            <View style={tw`bg-black/20 border border-white/5 rounded-xl p-2.5 flex-row items-center justify-center`}>
              <Text style={tw`text-[11px] text-slate-500`}>🎮 Sin cuentas de juego vinculadas</Text>
            </View>
          )}
        </View>

        <View style={tw.style('flex-row items-center pt-2.5 border-t border-white/5', { gap: 8 })}>
          <TouchableOpacity
            style={tw`flex-1 bg-indigo-500 flex-row justify-center items-center py-2.5 rounded-xl`}
            onPress={() => handleHablar(item)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" style={tw`mr-1.5`} />
            <Text style={tw`text-white font-semibold text-sm`}>Hablar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`bg-slate-700/60 w-[42px] h-[42px] rounded-xl justify-center items-center border border-white/10`}
            onPress={() => handleBloquear(item)}
          >
            <Ionicons name="ban-outline" size={18} color="#f59e0b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`bg-slate-700/60 w-[42px] h-[42px] rounded-xl justify-center items-center border border-white/10`}
            onPress={() => abrirModalReporte(item)}
          >
            <Ionicons name="flag-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={tw`flex-1 bg-slate-900`}>
      <View style={[tw`px-5 pb-4 bg-slate-800 border-b border-white/10`, { paddingTop: insets.top + 12 }]}>
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-1 mr-2`}>
            <Text style={tw`text-2xl font-bold text-white`}>Buscar Dúo</Text>
            <Text style={tw`text-[13px] text-slate-400 mt-0.5`}>Encontrá compañeros activos para jugar</Text>
          </View>
          {campanita}
        </View>

        <View style={tw`flex-row items-center gap-2`}>
          <View style={tw`flex-1 flex-row items-center bg-slate-900 rounded-xl px-3 py-2 border border-white/10`}>
            <Ionicons name="search-outline" size={20} color="#64748b" style={tw`mr-2`} />
            <TextInput
              style={tw`flex-1 text-white text-sm`}
              placeholder="Buscar por jugador o juego..."
              placeholderTextColor="#64748b"
              value={busqueda}
              onChangeText={setBusqueda}
              onSubmitEditing={() => cargarUsuarios(filtros)}
            />
            {busqueda ? (
              <TouchableOpacity onPress={() => setBusqueda('')}>
                <Ionicons name="close-circle" size={18} color="#64748b" />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setMostrarFiltros(!mostrarFiltros)}
            style={tw.style(
              'p-2.5 rounded-xl border flex-row items-center justify-center',
              mostrarFiltros ? 'bg-indigo-500 border-indigo-500' : 'bg-slate-900 border-white/10'
            )}
          >
            <Ionicons name="options-outline" size={20} color={mostrarFiltros ? '#fff' : '#94a3b8'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* LISTADO DE JUGADORES */}
      {cargando ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={usuariosFiltrados}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderPlayerCard}
          contentContainerStyle={tw`p-4 pb-8`}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor="#6366f1" />}
          ListHeaderComponent={
            mostrarFiltros ? (
              <PanelFiltros
                filtros={filtros}
                setFiltros={setFiltros}
                esPremium={esPremium}
                onBuscar={() => cargarUsuarios(filtros)}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={tw`items-center justify-center mt-15`}>
              <Ionicons name="people-outline" size={48} color="#64748b" />
              <Text style={tw`text-slate-400 text-sm mt-3`}>No se encontraron jugadores disponibles</Text>
            </View>
          }
        />
      )}

      <ModalPerfilUsuario
        visible={modalPerfilVisible}
        usuarioId={usuarioPerfilId}
        usuarioActual={miUsuario}
        onClose={() => setModalPerfilVisible(false)}
        onIrAlChat={(salaObtenida) => {
          setModalPerfilVisible(false);
          navigation.navigate('Salas', { salaDirecta: salaObtenida });
        }}
      />

      <Modal visible={modalReporteVisible} transparent animationType="slide">
        <View style={tw`flex-1 bg-black/70 justify-center p-5`}>
          <View style={tw`bg-slate-800 rounded-2xl p-5 border border-white/10`}>
            <Text style={tw`text-lg font-bold text-white mb-1`}>
              Reportar a {usuarioAReportar?.nombre || usuarioAReportar?.username}
            </Text>
            <Text style={tw`text-[13px] text-slate-400 mb-3.5`}>Seleccioná el motivo del reporte:</Text>

            <View style={tw.style({ gap: 8 }, 'mb-3.5')}>
              {MOTIVOS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={tw.style(
                    'bg-slate-900 py-2.5 px-3.5 rounded-lg border border-white/10',
                    motivoSeleccionado === item.id && 'bg-indigo-500 border-indigo-500'
                  )}
                  onPress={() => setMotivoSeleccionado(item.id)}
                >
                  <Text
                    style={tw.style(
                      'text-slate-400 text-[13px] font-medium',
                      motivoSeleccionado === item.id && 'text-white font-bold'
                    )}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={tw.style('bg-slate-900 rounded-lg p-3 text-white text-[13px] border border-white/10 mb-4', { textAlignVertical: 'top' })}
              placeholder="Detallá el motivo o la situación..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              value={comentarioReporte}
              onChangeText={setComentarioReporte}
            />

            <View style={tw.style('flex-row justify-end', { gap: 10 })}>
              <TouchableOpacity
                style={tw`py-2.5 px-4 rounded-lg`}
                onPress={() => setModalReporteVisible(false)}
                disabled={enviandoReporte}
              >
                <Text style={tw`text-slate-400 font-semibold`}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`bg-red-500 py-2.5 px-[18px] rounded-lg`}
                onPress={enviarReporteModal}
                disabled={enviandoReporte}
              >
                {enviandoReporte ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={tw`text-white font-bold`}>Enviar Reporte</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}