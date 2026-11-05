import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

import CustomModal from './CustomModal';
import { usuariosApi, salasApi } from '../api';

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

export default function ModalPerfilUsuario({
  visible,
  usuarioId,
  usuarioActual,
  onClose,
  deshabilitarChat = false,
  onIrAlChat
}) {
  const [jugador, setJugador] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (visible && usuarioId) {
      cargarPerfil();
    } else {
      setJugador(null);
    }
  }, [visible, usuarioId]);

  const cargarPerfil = async () => {
    setCargando(true);
    try {
      const res = await usuariosApi.obtenerPerfil(usuarioId);

      const base = res.usuario || res.perfil || res.data || res;

      const jugadorNormalizado = {
        ...base,
        id: base.id || res.id || usuarioId,
        username: base.username || base.nombre || res.username || res.nombre || 'Jugador',
        foto_perfil: base.foto_perfil || base.avatar || base.fotoPerfil || res.foto_perfil || res.avatar || res.fotoPerfil,
        rango_edad: base.rango_edad || res.rango_edad,
        modo_juego: base.modo_juego || res.modo_juego,
        verificado: Boolean(base.verificado || base.estaVerificado || res.verificado || res.estaVerificado),
        biografia: base.biografia || res.biografia,
        es_premium: base.es_premium ?? res.es_premium,
        sinergia: base.sinergia || res.sinergia,
        sinergia_porcentaje: base.sinergia_porcentaje ?? res.sinergia_porcentaje,
        sinergia_riot: base.sinergia_riot ?? res.sinergia_riot,
        sinergia_steam: base.sinergia_steam ?? res.sinergia_steam,
        riot: base.riot || base.integracionRiot || base.IntegracionRiot || res.riot || res.integracionRiot || res.IntegracionRiot || null,
        steam: base.steam || base.integracionSteam || base.IntegracionSteam || res.steam || res.integracionSteam || res.IntegracionSteam || null,
      };

      setJugador(jugadorNormalizado);
    } catch (error) {
      console.error('Error al obtener perfil del usuario:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del jugador.');
      onClose();
    } finally {
      setCargando(false);
    }
  };

  const handleHablar = async () => {
    if (!jugador) return;

    const esMenorMio = usuarioActual?.rango_edad === 'menor_18';
    const esMenorTarget = jugador.rango_edad === 'menor_18';

    if (usuarioActual?.rango_edad && jugador.rango_edad && esMenorMio !== esMenorTarget) {
      Alert.alert(
        'Acceso Restringido',
        '🚫 No se permiten chats entre usuarios de distintos entornos de edad (Menores / Adultos).'
      );
      return;
    }

    try {
      const res = await salasApi.crearSala({
        tipo: 'privada',
        participante_id: jugador.id
      });
      const salaObtenida = res.sala || res;
      onClose();
      if (onIrAlChat) {
        onIrAlChat(salaObtenida, jugador);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo iniciar la conversación privada.');
    }
  };

  const handleBloquear = () => {
    if (!jugador) return;
    const nombre = jugador.username || jugador.nombre || 'este usuario';
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
              await usuariosApi.bloquear(jugador.id);
              Alert.alert('Éxito', `${nombre} ha sido bloqueado.`);
              onClose();
            } catch (err) {
              Alert.alert('Error', 'No se pudo procesar el bloqueo.');
            }
          }
        }
      ]
    );
  };

  if (!visible) return null;

  const esPremium = Boolean(
    jugador?.es_premium === true ||
      jugador?.es_premium === 1 ||
      jugador?.es_premium === '1' ||
      jugador?.es_premium === 'true'
  );

  const datosRiot = jugador?.riot || null;
  const datosSteam = jugador?.steam || null;

  const tieneRiot = Boolean(datosRiot && Object.keys(datosRiot).length > 0);
  const tieneSteam = Boolean(datosSteam && Object.keys(datosSteam).length > 0);

  const rawPosicion = datosRiot?.lol_posicion_principal
    ? String(datosRiot.lol_posicion_principal).toUpperCase()
    : null;
  const rolInfo = rawPosicion ? CONFIG_ROLES[rawPosicion] : null;

  const wins = datosRiot?.lol_wins || 0;
  const losses = datosRiot?.lol_losses || 0;
  const totalPartidas = wins + losses;

  const winrate = jugador?.lol_winrate !== undefined && jugador?.lol_winrate !== null
    ? jugador.lol_winrate
    : totalPartidas > 0
    ? Math.round((wins / totalPartidas) * 100)
    : 0;

  const topJuegosSteam = tieneSteam ? parsearTopJuegos(datosSteam.top_juegos) : [];

  const cantidadJuegosSteam = datosSteam?.total_juegos > 0
    ? datosSteam.total_juegos
    : topJuegosSteam.length > 0
    ? topJuegosSteam.length
    : Array.isArray(jugador?.juegos)
    ? jugador.juegos.length
    : 0;

  const porcentajeSinergia = obtenerValorNumero(jugador?.sinergia, obtenerValorNumero(jugador?.sinergia_porcentaje, 50));
  const sinergiaRiot = obtenerValorNumero(jugador?.sinergia_riot);
  const sinergiaSteam = obtenerValorNumero(jugador?.sinergia_steam);

  const modoJuegoTexto = jugador?.modo_juego
    ? jugador.modo_juego === 'casual'
      ? 'Casual'
      : jugador.modo_juego === 'competitivo'
      ? 'Competitivo'
      : 'Ambos'
    : null;

  const esMenorMio = usuarioActual?.rango_edad === 'menor_18';
  const esMenorTarget = jugador?.rango_edad === 'menor_18';
  const esEntornoDiferente = Boolean(usuarioActual?.rango_edad && jugador?.rango_edad && esMenorMio !== esMenorTarget);
  const estaVerificadoTarget = Boolean(jugador?.verificado || jugador?.estaVerificado);

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      titulo="Perfil de Jugador"
      containerStyle={esPremium ? 'border-amber-500/50' : 'border-white/10'}
    >
      {cargando || !jugador ? (
        <View style={tw`py-12 justify-center items-center`}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <View>
          {/* INSIGNIA PREMIUM */}
          {esPremium && (
            <View style={tw`self-start bg-amber-400 px-2.5 py-0.5 rounded-full mb-3 flex-row items-center`}>
              <Text style={tw`text-slate-950 font-extrabold text-[10px] uppercase tracking-wider`}>
                ⭐ Premium
              </Text>
            </View>
          )}

          {/* AVATAR, NOMBRE Y SINERGIA */}
          <View style={tw`flex-row items-start justify-between mb-4`}>
            <View style={tw`flex-row items-center flex-1 mr-2`}>
              <View
                style={tw.style(
                  'w-14 h-14 rounded-full overflow-hidden border-2 bg-slate-700 justify-center items-center mr-3',
                  esPremium ? 'border-amber-400' : 'border-white/20'
                )}
              >
                {jugador.foto_perfil ? (
                  <Image
                    source={{ uri: jugador.foto_perfil }}
                    style={tw`w-full h-full`}
                  />
                ) : (
                  <Text style={tw`font-bold text-white text-xl`}>
                    {(jugador.username?.[0] || 'U').toUpperCase()}
                  </Text>
                )}
              </View>

              <View style={tw`flex-1`}>
                <Text style={tw`text-base font-bold text-white`} numberOfLines={1}>
                  {jugador.username}
                </Text>
                <Text style={tw`text-xs text-slate-400 mt-0.5`} numberOfLines={1}>
                  {jugador.rango_edad ? `Edad: ${jugador.rango_edad}` : 'Jugador GameMatch'}
                  {modoJuegoTexto ? ` · 🎮 ${modoJuegoTexto}` : ''}
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
          </View>

          {/* BIOGRAFÍA */}
          {jugador.biografia ? (
            <View style={tw`bg-slate-900/60 p-3 rounded-xl border border-white/5 mb-4`}>
              <Text style={tw`text-slate-300 text-xs italic`}>"{jugador.biografia}"</Text>
            </View>
          ) : null}

          {/* CONTENEDOR DE CUENTAS VINCULADAS */}
          <View style={tw.style({ gap: 10 })}>
            {/* RIOT */}
            {tieneRiot && (
              <View style={tw`bg-black/30 border border-white/5 rounded-xl p-3`}>
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center flex-1 mr-2`}>
                    <Text style={tw`text-xs text-slate-500 mr-1.5`}>⚔️</Text>
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
                    <View style={tw.style('px-2 py-0.5 rounded-md border flex-row items-center', rolInfo.color)}>
                      <Text style={tw`text-[10px] mr-1`}>{rolInfo.icono}</Text>
                      <Text style={tw`text-[10px] font-bold`}>{rolInfo.label}</Text>
                    </View>
                  ) : rawPosicion ? (
                    <View style={tw`bg-white/10 border border-white/20 px-2 py-0.5 rounded-md`}>
                      <Text style={tw`text-[10px] font-bold text-slate-200`}>{rawPosicion}</Text>
                    </View>
                  ) : null}
                </View>

                {winrate > 0 && (
                  <View style={tw`flex-row items-center justify-between pt-2 mt-2 border-t border-white/5`}>
                    <Text style={tw`text-[11px] text-slate-400`}>Rendimiento SoloQ</Text>
                    <Text style={tw`text-emerald-400 font-bold text-[11px]`}>{winrate}% WR</Text>
                  </View>
                )}
              </View>
            )}

            {/* STEAM */}
            {tieneSteam && (
              <View style={tw`bg-[#66c0f4]/10 border border-[#66c0f4]/20 rounded-xl p-3`}>
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center flex-1 mr-2`}>
                    <Text style={tw`text-xs mr-1.5`}>🎮</Text>
                    <Text style={tw`font-bold text-[#66c0f4] text-xs`} numberOfLines={1}>
                      {datosSteam.steam_username || datosSteam.username || 'Cuenta Steam'}
                    </Text>
                  </View>

                  {datosSteam.jugando_ahora ? (
                    <View style={tw`bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded flex-row items-center`}>
                      <View style={tw`w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1`} />
                      <Text style={tw`text-emerald-300 text-[10px] font-medium`} numberOfLines={1}>
                        {datosSteam.jugando_ahora}
                      </Text>
                    </View>
                  ) : (
                    <Text style={tw`text-[10px] text-slate-400`}>
                      {cantidadJuegosSteam} {cantidadJuegosSteam === 1 ? 'juego' : 'juegos'}
                    </Text>
                  )}
                </View>

                {/* TOP JUEGOS DE STEAM */}
                {topJuegosSteam.length > 0 && (
                  <View style={tw`flex-row flex-wrap items-center pt-2 mt-2 border-t border-white/5`}>
                    {topJuegosSteam.slice(0, 4).map((juego, idx) => {
                      const nombreJuego = typeof juego === 'string' ? juego : juego.name || juego.nombre;
                      return (
                        <View
                          key={idx}
                          style={tw`bg-white/5 border border-white/5 px-2 py-0.5 rounded mr-1 mb-1`}
                        >
                          <Text style={tw`text-[10px] text-slate-300`} numberOfLines={1}>
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
              <View style={tw`bg-black/20 border border-white/5 rounded-xl p-3 flex-row items-center justify-center`}>
                <Text style={tw`text-xs text-slate-400`}>🎮 Sin cuentas de juego vinculadas</Text>
              </View>
            )}
          </View>

          <View style={tw`pt-4 mt-4 border-t border-white/10`}>
            {esEntornoDiferente ? (
              <View style={tw`bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl mb-2`}>
                <Text style={tw`text-red-400 text-xs font-semibold text-center`}>
                  🚫 No se permiten chats entre usuarios de distintos entornos de edad (Menores / Adultos).
                </Text>
              </View>
            ) : (
              <View>
                {!estaVerificadoTarget && (
                  <View style={tw`bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl mb-3`}>
                    <Text style={tw`text-amber-300 text-[11px] font-medium text-center`}>
                      ⚠️ Usuario no verificado por rostro. Tené precaución al compartir datos personales.
                    </Text>
                  </View>
                )}

                <View style={tw`flex-row items-center gap-2`}>
                  {!deshabilitarChat && (
                    <TouchableOpacity
                      style={tw`flex-1 bg-indigo-500 py-2.5 rounded-xl flex-row justify-center items-center`}
                      onPress={handleHablar}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" style={tw`mr-1.5`} />
                      <Text style={tw`text-white font-bold text-sm`}>Hablar</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={tw`bg-slate-700/60 border border-white/10 p-2.5 rounded-xl justify-center items-center`}
                    onPress={handleBloquear}
                  >
                    <Ionicons name="ban-outline" size={20} color="#f59e0b" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </CustomModal>
  );
}